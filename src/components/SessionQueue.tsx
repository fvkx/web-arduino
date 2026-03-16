import { useState, useEffect, useRef } from "react";
import type { SessionData } from "./SessionCreator";

interface ManualData {
  entries: string;
  exits: string;
  peak: string;
  end: string;
}

interface EditData {
  room:  string;
  year:  string;
  start: string;
  end:   string;
}

interface Props {
  queue:        SessionData[];
  activeId:     number | null;
  onStart:      (id: number) => void;
  onRemove:     (id: number) => void;
  onManualSave: (id: number, data: ManualData) => void;
  onEdit:       (id: number, data: EditData) => void;
}

function parseSessionTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);

  // Only roll to tomorrow if more than 1 minute in the past
  // This prevents a session set 30 seconds ago from jumping to tomorrow
  if (d.getTime() < Date.now() - 60_000) {
    d.setDate(d.getDate() + 1);
  }

  return d;
}

export default function SessionQueue({
  queue, activeId, onStart, onRemove, onManualSave, onEdit,
}: Props) {
  const [expandedId,  setExpandedId]  = useState<number | null>(null);
  const [editId,      setEditId]      = useState<number | null>(null);
  const [manual,      setManual]      = useState<ManualData>({ entries: "", exits: "", peak: "", end: "" });
  const [editData,    setEditData]    = useState<EditData>({ room: "", year: "", start: "", end: "" });
  const [manualErr,   setManualErr]   = useState<string | null>(null);
  const [editErr,     setEditErr]     = useState<string | null>(null);
  const [countdown,   setCountdown]   = useState<Record<number, string>>({});
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const newCountdowns: Record<number, string> = {};
  
      for (const s of queue) {
        if (activeId !== null) break;
        if (firedRef.current.has(s.id)) continue;
  
        const diff = parseSessionTime(s.start).getTime() - now;
  
        if (diff <= 0) {
          firedRef.current.add(s.id);
          onStart(s.id);
          return;
        } else {
          const totalSec = Math.floor(diff / 1000);
          const hrs  = Math.floor(totalSec / 3600);
          const mins = Math.floor((totalSec % 3600) / 60);
          const secs = totalSec % 60;
          newCountdowns[s.id] = hrs > 0
            ? `${hrs}h ${String(mins).padStart(2, "0")}m`
            : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        }
      }
      setCountdown(newCountdowns);
    };
  
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [queue, activeId, onStart]);

  const openManual = (id: number) => {
    setEditId(null);
    setExpandedId(id);
    setManual({ entries: "", exits: "", peak: "", end: "" });
    setManualErr(null);
  };

  const closeManual = () => {
    setExpandedId(null);
    setManualErr(null);
  };

const openEdit = (s: SessionData) => {
  setExpandedId(null);
  setEditId(s.id);
  setEditData({ room: s.room, year: s.year, start: s.start, end: s.end });
  setEditErr(null);
  firedRef.current.delete(s.id);
};

  const closeEdit = () => {
    setEditId(null);
    setEditErr(null);
  };

  const handleManualSave = (id: number) => {
    const e = parseInt(manual.entries);
    const x = parseInt(manual.exits);
    const p = parseInt(manual.peak);
    if (isNaN(e) || e < 0) return setManualErr("Entries must be a non-negative number.");
    if (isNaN(x) || x < 0) return setManualErr("Exits must be a non-negative number.");
    if (isNaN(p) || p < 0) return setManualErr("Peak must be a non-negative number.");
    if (!manual.end)        return setManualErr("End time is required.");
    setManualErr(null);
    onManualSave(id, manual);
    closeManual();
  };

  const handleEditSave = (id: number) => {
    if (!editData.room.trim())          { setEditErr("Room is required.");                    return; }
    if (!editData.year.trim())          { setEditErr("Year level is required.");              return; }
    if (!editData.start)                { setEditErr("Start time is required.");              return; }
    if (!editData.end)                  { setEditErr("End time is required.");                return; }
    if (editData.end <= editData.start) { setEditErr("End time must be after start time.");   return; }
    setEditErr(null);
    onEdit(id, editData);
    closeEdit();
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
          const isActive   = s.id === activeId;
          const isExpanded = s.id === expandedId;
          const isEditing  = s.id === editId;
          const timeLeft   = countdown[s.id];

          return (
            <div
              key={s.id}
              style={{
                borderBottom: idx < queue.length - 1 ? "1px solid var(--border)" : "none",
                background:   isActive ? "rgba(59,130,246,0.06)" : "transparent",
              }}
            >
              {/* ── Main row ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>

                {/* Position badge */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: isActive ? "var(--blue)" : "var(--surface-2)",
                  border: `1px solid ${isActive ? "var(--blue)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: isActive ? "#fff" : "var(--text-3)",
                  flexShrink: 0,
                }}>
                  {isActive ? "▶" : idx + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: "var(--text-1)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {s.room}
                    <span style={{ color: "var(--text-3)", marginLeft: 6 }}>·</span>
                    <span style={{ color: "var(--text-2)", fontWeight: 400, marginLeft: 6 }}>{s.year}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {s.start} → {s.end}
                  </div>

                  {!isActive && activeId === null && idx === 0 && timeLeft && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      marginTop: 5, padding: "2px 8px",
                      background: "rgba(59,130,246,0.08)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      borderRadius: 99, fontSize: 10, color: "var(--blue)",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      <span style={{ opacity: 0.7 }}>auto-starts in</span>
                      <strong>{timeLeft}</strong>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {isActive && (
                    <div className="dash-chip green" style={{ fontSize: 10 }}>Active</div>
                  )}

                  {!isActive && (
                    <>
                      {/* Edit button */}
                      <button
                        className={`dash-btn ${isEditing ? "blue" : "ghost"}`}
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => isEditing ? closeEdit() : openEdit(s)}
                        title="Edit session"
                      >
                        ✎ Edit
                      </button>

                      {/* Manual button */}
                      <button
                        className={`dash-btn ${isExpanded ? "amber" : "ghost"}`}
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => isExpanded ? closeManual() : openManual(s.id)}
                        title="Enter data manually"
                      >
                        Manual
                      </button>

                      {/* Remove button */}
                      <button
                        className="dash-btn ghost"
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => { closeManual(); closeEdit(); onRemove(s.id); }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Edit form ── */}
              {isEditing && !isActive && (
                <div style={{
                  margin: "0 18px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--blue)",
                  borderRadius: 8, padding: 14,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--blue)", marginBottom: 10,
                  }}>
                    Edit Session — {s.room} · {s.year}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div className="dash-field">
                      <label className="dash-label">Room</label>
                      <input
                        className="dash-input"
                        placeholder="e.g. Room 101"
                        value={editData.room}
                        onChange={e => setEditData(p => ({ ...p, room: e.target.value }))}
                      />
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Year Level</label>
                      <input
                        className="dash-input"
                        placeholder="e.g. Grade 11"
                        value={editData.year}
                        onChange={e => setEditData(p => ({ ...p, year: e.target.value }))}
                      />
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Start Time</label>
                      <input
                        className="dash-input"
                        type="time"
                        value={editData.start}
                        onChange={e => setEditData(p => ({ ...p, start: e.target.value }))}
                      />
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">End Time</label>
                      <input
                        className="dash-input"
                        type="time"
                        value={editData.end}
                        onChange={e => setEditData(p => ({ ...p, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  {editErr && <div className="dash-error" style={{ marginTop: 8 }}>{editErr}</div>}

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      className="dash-btn blue"
                      style={{ flex: 1 }}
                      onClick={() => handleEditSave(s.id)}
                    >
                      Save Changes
                    </button>
                    <button className="dash-btn ghost" onClick={closeEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Manual entry form ── */}
              {isExpanded && !isActive && (
                <div style={{
                  margin: "0 18px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8, padding: 14,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--amber)", marginBottom: 10,
                  }}>
                    Manual Entry — {s.room} · {s.year}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div className="dash-field" style={{ gridColumn: "1 / -1" }}>
                      <label className="dash-label">Actual End Time</label>
                      <input className="dash-input" type="time" value={manual.end}
                        onChange={e => setManual(p => ({ ...p, end: e.target.value }))} />
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Entries (IN)</label>
                      <input className="dash-input" type="number" min={0} placeholder="0"
                        value={manual.entries}
                        onChange={e => setManual(p => ({ ...p, entries: e.target.value }))} />
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Exits (OUT)</label>
                      <input className="dash-input" type="number" min={0} placeholder="0"
                        value={manual.exits}
                        onChange={e => setManual(p => ({ ...p, exits: e.target.value }))} />
                    </div>
                    <div className="dash-field" style={{ gridColumn: "1 / -1" }}>
                      <label className="dash-label">Peak Occupancy</label>
                      <input className="dash-input" type="number" min={0} placeholder="0"
                        value={manual.peak}
                        onChange={e => setManual(p => ({ ...p, peak: e.target.value }))} />
                    </div>
                  </div>

                  {manualErr && <div className="dash-error" style={{ marginTop: 8 }}>{manualErr}</div>}

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="dash-btn amber" style={{ flex: 1 }} onClick={() => handleManualSave(s.id)}>
                      Save Manually
                    </button>
                    <button className="dash-btn ghost" onClick={closeManual}>Cancel</button>
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