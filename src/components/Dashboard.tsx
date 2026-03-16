import { useState, useRef, useMemo, useEffect } from "react";
import { useSerial } from "../hooks/useSerial";
import SessionCreator, { type SessionData } from "./SessionCreator";
import SessionQueue from "./SessionQueue";
import ActiveSession from "./ActiveSession";
import CompletedSessions from "./CompletedSessions";
import OccupancyChart from "./OccupancyChart";
import DashboardStats from "./DashboardStats";
import DevicePanel from "./DevicePanel";
import ThemeToggle from "./ThemeToggle";
import "../style/Dashboard.css";

export interface CompletedSession {
  id: number;
  room: string;
  year: string;
  start: string;
  end: string;
  entries: number;
  exits: number;
  peak: number;
  savedAt: string;
  source: "auto" | "manual";
  status: "on-time" | "early" | "extended";
  reason: string | null;
}

const nextIdRef = { current: 1 };

export default function Dashboard() {
  const serial = useSerial();

  const [queue,     setQueue]     = useState<SessionData[]>([]);
  const [activeId,  setActiveId]  = useState<number | null>(null);
  const [completed, setCompleted] = useState<CompletedSession[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);

  const peakRef = useRef(0);
  peakRef.current = Math.max(peakRef.current, serial.count);

  const entries = useMemo(() => serial.rawLog.filter(e => e === "IN").length,  [serial.rawLog]);
  const exits   = useMemo(() => serial.rawLog.filter(e => e === "OUT").length, [serial.rawLog]);

  const activeSession = queue.find(s => s.id === activeId) ?? null;

  const todayStr       = new Date().toISOString().slice(0, 10);
  const formatDatetime = (timeStr: string) => `${todayStr} ${timeStr}:00`;

  // ── Load existing sessions from DB on mount ──
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res  = await fetch("http://localhost/website_ar/api/get-sessions.php");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.status === "ok" && Array.isArray(json.sessions)) {
          const loaded: CompletedSession[] = json.sessions.map((s: {
            id: number; room: string; year: string;
            start: string; end: string; entries: number;
            exits: number; peak: number; savedAt: string;
          }) => ({
            id:      s.id,
            room:    s.room,
            year:    s.year,
            start:   s.start,
            end:     s.end,
            entries: s.entries,
            exits:   s.exits,
            peak:    s.peak,
            savedAt: s.savedAt,
            source:  "auto" as const,
            status:  "on-time" as const,
            reason:  null,
          }));
          setCompleted(loaded);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // ── Save to DB ──
  const saveToDB = async (payload: {
    room: string; year: string; start: string; end: string;
    entries: number; exits: number; peak: number;
  }) => {
    const body = new URLSearchParams({
      room:    payload.room,
      year:    payload.year,
      start:   payload.start,
      end:     payload.end,
      entries: String(payload.entries),
      exits:   String(payload.exits),
      peak:    String(payload.peak),
    });

    const res = await fetch("http://localhost/website_ar/api/save-summary.php", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error: ${res.status} - ${text}`);
    }
    return res.json();
  };

  const handleAdd = (data: Omit<SessionData, "id">) => {
    const [h, m] = data.start.split(":").map(Number);
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    // If time is in the past, push to tomorrow
    if (scheduled.getTime() < Date.now()) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
  
    setQueue(prev => [...prev, {
      id: nextIdRef.current++,
      ...data,
      scheduledAt: scheduled.getTime(),
    }]);
  };

  const handleRemove = (id: number) => {
    setQueue(prev => prev.filter(s => s.id !== id));
  };

  // ── Edit a queued session ──
  const handleEdit = (id: number, data: { room: string; year: string; start: string; end: string }) => {
    const [h, m] = data.start.split(":").map(Number);
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    if (scheduled.getTime() < Date.now()) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
  
    setQueue(prev => prev.map(s =>
      s.id === id
        ? { ...s, ...data, scheduledAt: scheduled.getTime() }
        : s
    ));
  
    // Allow the session to re-fire after edit
    // (access firedRef via a ref passed down or handle in SessionQueue)
  };
  const handleStart = (id: number) => {
    if (activeId !== null) return;
    peakRef.current = 0;
    serial.reset();
    setActiveId(id);
    setError(null);
  };

  const handleEnd = async (reason: string | null, status: "on-time" | "early" | "extended") => {
    if (!activeSession) return;

    const now       = new Date();
    const actualEnd = now.toISOString().slice(0, 19).replace("T", " ");

    const payload = {
      room:    activeSession.room,
      year:    activeSession.year,
      start:   formatDatetime(activeSession.start),
      end:     actualEnd,
      entries,
      exits,
      peak:    peakRef.current,
    };

    setSaving(true);
    setError(null);

    try {
      const saved = await saveToDB(payload);

      setCompleted(prev => [...prev, {
        id:      saved.session_id ?? activeSession.id,
        room:    activeSession.room,
        year:    activeSession.year,
        start:   formatDatetime(activeSession.start),
        end:     actualEnd,
        entries,
        exits,
        peak:    peakRef.current,
        savedAt: actualEnd,
        source:  "auto",
        status,
        reason,
      }]);

      setQueue(prev => prev.filter(s => s.id !== activeSession.id));
      setActiveId(null);
      peakRef.current = 0;
      serial.reset();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async (id: number, data: {
    entries: string; exits: string; peak: string; end: string;
  }) => {
    const session = queue.find(s => s.id === id);
    if (!session) return;

    const payload = {
      room:    session.room,
      year:    session.year,
      start:   formatDatetime(session.start),
      end:     formatDatetime(data.end),
      entries: parseInt(data.entries),
      exits:   parseInt(data.exits),
      peak:    parseInt(data.peak),
    };

    setSaving(true);
    setError(null);

    try {
      const saved = await saveToDB(payload);

      setCompleted(prev => [...prev, {
        id:      saved.session_id ?? id,
        room:    session.room,
        year:    session.year,
        start:   session.start,
        end:     data.end,
        entries: parseInt(data.entries),
        exits:   parseInt(data.exits),
        peak:    parseInt(data.peak),
        savedAt: new Date().toLocaleTimeString("en-US", { hour12: false }),
        source:  "manual",
        status:  "on-time",
        reason:  null,
      }]);

      setQueue(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash-root">
      <nav className="dash-topbar">
        <div className="dash-brand">
          <div className={`dash-dot ${serial.connected ? "live" : ""}`} />
          OccuTrack
        </div>
        <div className="dash-sep" />
        <div className={`dash-chip ${serial.connected ? "green" : ""}`}>
          {serial.connected ? "Live" : "Offline"}
        </div>
        {activeSession && (
          <div className="dash-chip blue">{activeSession.room} &mdash; {activeSession.year}</div>
        )}
        {queue.length > 0 && !activeSession && (
          <div className="dash-chip amber">
            {queue.length} session{queue.length > 1 ? "s" : ""} queued
          </div>
        )}
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle />
        </div>
      </nav>

      <main className="dash-main">
        <DashboardStats count={serial.count} entries={entries} exits={exits} peak={peakRef.current} />

        <div className="dash-mid-row">
          <OccupancyChart log={serial.log} />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <DevicePanel
              connected={serial.connected}
              onConnect={serial.connect}
              onDisconnect={serial.disconnect}
            />

            <div className="dash-card">
              <div className="dash-card-head">
                <div className="dash-card-title">Add Session</div>
              </div>
              <div className="dash-card-body">
                <SessionCreator onAdd={handleAdd} />
              </div>
            </div>

            {activeSession && (
              <ActiveSession
                session={activeSession}
                peak={peakRef.current}
                entries={entries}
                exits={exits}
                saving={saving}
                error={error}
                onEnd={handleEnd}
              />
            )}
          </div>
        </div>

        <SessionQueue
          queue={queue}
          activeId={activeId}
          onStart={handleStart}
          onRemove={handleRemove}
          onManualSave={handleManualSave}
          onEdit={handleEdit}
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0", fontSize: 13, color: "var(--text-3)" }}>
            Loading sessions…
          </div>
        ) : (
          <CompletedSessions sessions={completed} />
        )}
      </main>

      <footer className="dash-footer">
        <span>OccuTrack &middot; Arduino Serial &middot; v1.0</span>
        <div className="dash-footer-right">
          <span>Port: <b>{serial.connected ? "9600 baud" : "—"}</b></span>
          <span>Queue: <b>{queue.length}</b></span>
          <span>Saved: <b>{completed.length}</b></span>
        </div>
      </footer>
    </div>
  );
}