import { useState, useEffect, useRef } from "react";
import type { SessionData } from "./SessionCreator";

interface Props {
  queue:        SessionData[];
  activeId:     number | null;
  onStart:      (id: number) => void;
  onRemove:     (id: number) => void;
  onManualSave: (id: number, data: { entries: string; exits: string; peak: string; end: string }) => Promise<void>;
  onEdit:       (id: number, data: { room: string; year: string; start: string; end: string }) => void;
}

function parseSessionTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() < Date.now() - 60_000) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function to12Hour(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm  = h >= 12 ? "PM" : "AM";
  const hour  = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function to24Hour(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  let h = parseInt(match[1]);
  const m = match[2];
  const meridiem = match[3].toUpperCase();
  if (meridiem === "AM" && h === 12) h = 0;
  if (meridiem === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export default function SessionQueue({
  queue, activeId, onStart, onRemove, onManualSave, onEdit,
}: Props) {
  const firedRef = useRef<Set<number>>(new Set());

  const [editId,    setEditId]   = useState<number | null>(null);
  const [manualId,  setManualId] = useState<number | null>(null);

  // Edit form state
  const [editRoom,  setEditRoom]  = useState("");
  const [editYear,  setEditYear]  = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd,   setEditEnd]   = useState("");

  // Manual save form state
  const [manEntries, setManEntries] = useState("");
  const [manExits,   setManExits]   = useState("");
  const [manPeak,    setManPeak]    = useState("");
  const [manEnd,     setManEnd]     = useState("");

  // ── Auto-start: check every 10s if any session's time has arrived ──
  useEffect(() => {
    if (activeId !== null) return;

    const interval = setInterval(() => {
      const now = Date.now();
      for (const s of queue) {
        if (firedRef.current.has(s.id)) continue;
        const scheduled = parseSessionTime(s.start);
        if (now >= scheduled.getTime()) {
          firedRef.current.add(s.id);
          onStart(s.id);
          break;
        }
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [queue, activeId, onStart]);

  const openEdit = (s: SessionData) => {
    setEditId(s.id);
    setEditRoom(s.room);
    setEditYear(s.year);
    setEditStart(to12Hour(s.start));
    setEditEnd(to12Hour(s.end));
    setManualId(null);
  };

  const openManual = (s: SessionData) => {
    setManualId(s.id);
    setManEntries("");
    setManExits("");
    setManPeak("");
    setManEnd(to12Hour(s.end));
    setEditId(null);
  };

  if (queue.length === 0) {
    return (
      <div className="dash-card">
        <div className="dash-card-head">
          <div className="dash-card-title">Session Queue</div>
          <div className="dash-card-badge">0 pending</div>
        </div>
        <div className="dash-card-body">
          <div style={{ color: "var(--text-3)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>
            No sessions queued — add one above
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <div className="dash-card-title">Session Queue</div>
        <div className="dash-card-badge">{queue.length} pending</div>
      </div>

      <div style={{ padding: 0 }}>
        {queue.map((s, idx) => {
          const isActive  = s.id === activeId;
          const isEditing = editId   === s.id;
          const isManual  = manualId === s.id;

          return (
            <div key={s.id} style={{
              borderBottom: idx < queue.length - 1 ? "1px solid var(--border)" : "none",
              background: isActive ? "rgba(59,130,246,0.06)" : "transparent",
            }}>

              {/* ── Row ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>

                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: isActive ? "var(--blue)" : "var(--surface-2)",
                  border: `1px solid ${isActive ? "var(--blue)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: isActive ? "#fff" : "var(--text-3)",
                }}>
                  {isActive ? "▶" : idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {s.room} · <span style={{ fontWeight: 400 }}>{s.year}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {to12Hour(s.start)} → {to12Hour(s.end)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {!isActive && (
                    <>
                      {/* Advance start — only when nothing is active */}
                      {activeId === null && (
                        <button
                          className="dash-btn ghost"
                          title="Start now"
                          onClick={() => {
                            firedRef.current.add(s.id);
                            onStart(s.id);
                          }}
                        >
                          ▶
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        className="dash-btn ghost"
                        title="Edit session"
                        onClick={() => isEditing ? setEditId(null) : openEdit(s)}
                      >
                        ✎
                      </button>

                      {/* Manual save */}
                      <button
                        className="dash-btn ghost"
                        title="Save manually"
                        onClick={() => isManual ? setManualId(null) : openManual(s)}
                      >
                        💾
                      </button>

                      {/* Delete */}
                      <button
                        className="dash-btn ghost"
                        style={{ color: "var(--red)" }}
                        title="Delete session"
                        onClick={() => {
                          const confirmed = confirm(`Delete session "${s.room} (${s.year})"?`);
                          if (!confirmed) return;
                          firedRef.current.delete(s.id);
                          onRemove(s.id);
                        }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Edit Form ── */}
              {isEditing && (
                <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      className="dash-input"
                      placeholder="Room"
                      value={editRoom}
                      onChange={e => setEditRoom(e.target.value)}
                      style={{ flex: 1, minWidth: 80 }}
                    />
                    <input
                      className="dash-input"
                      placeholder="Year / Section"
                      value={editYear}
                      onChange={e => setEditYear(e.target.value)}
                      style={{ flex: 1, minWidth: 80 }}
                    />
                    <input
                      className="dash-input"
                      placeholder="Start (e.g. 8:00 AM)"
                      value={editStart}
                      onChange={e => setEditStart(e.target.value)}
                      style={{ flex: 1, minWidth: 110 }}
                    />
                    <input
                      className="dash-input"
                      placeholder="End (e.g. 9:00 AM)"
                      value={editEnd}
                      onChange={e => setEditEnd(e.target.value)}
                      style={{ flex: 1, minWidth: 110 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="dash-btn primary"
                      onClick={() => {
                        onEdit(s.id, {
                          room:  editRoom,
                          year:  editYear,
                          start: to24Hour(editStart),
                          end:   to24Hour(editEnd),
                        });
                        setEditId(null);
                      }}
                    >
                      Save
                    </button>
                    <button className="dash-btn ghost" onClick={() => setEditId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Manual Save Form ── */}
              {isManual && (
                <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      className="dash-input"
                      placeholder="Entries"
                      type="number"
                      min={0}
                      value={manEntries}
                      onChange={e => setManEntries(e.target.value)}
                      style={{ flex: 1, minWidth: 80 }}
                    />
                    <input
                      className="dash-input"
                      placeholder="Exits"
                      type="number"
                      min={0}
                      value={manExits}
                      onChange={e => setManExits(e.target.value)}
                      style={{ flex: 1, minWidth: 80 }}
                    />
                    <input
                      className="dash-input"
                      placeholder="Peak"
                      type="number"
                      min={0}
                      value={manPeak}
                      onChange={e => setManPeak(e.target.value)}
                      style={{ flex: 1, minWidth: 80 }}
                    />
                    <input
                      className="dash-input"
                      placeholder="End (e.g. 9:00 AM)"
                      value={manEnd}
                      onChange={e => setManEnd(e.target.value)}
                      style={{ flex: 1, minWidth: 110 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="dash-btn primary"
                      onClick={async () => {
                        await onManualSave(s.id, {
                          entries: manEntries,
                          exits:   manExits,
                          peak:    manPeak,
                          end:     to24Hour(manEnd),
                        });
                        setManualId(null);
                      }}
                    >
                      Save Manually
                    </button>
                    <button className="dash-btn ghost" onClick={() => setManualId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}