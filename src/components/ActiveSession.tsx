import { useState, useEffect } from "react";
import type { SessionData } from "./SessionCreator";

// Convert "HH:MM" to total minutes since midnight
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const EARLY_REASONS = [
  "Class dismissed early",
  "Emergency / evacuation",
  "Technical issue",
  "Event cancelled",
  "Other",
];

const EXTENDED_REASONS = [
  "Class running overtime",
  "Event extended",
  "Waiting for students",
  "Technical delay",
  "Other",
];

interface Props {
  session: SessionData;
  peak:    number;
  entries: number;
  exits:   number;
  saving:  boolean;
  error:   string | null;
  onEnd:   (reason: string | null, status: "on-time" | "early" | "extended") => void;
}

export default function ActiveSession({
  session, peak, entries, exits, saving, error, onEnd,
}: Props) {
  const [nowTime,       setNowTime]       = useState("");
  const [status,        setStatus]        = useState<"on-time" | "early" | "extended">("on-time");
  const [showModal,     setShowModal]     = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason,  setCustomReason]  = useState("");
  const [reasonErr,     setReasonErr]     = useState<string | null>(null);

  // Live clock + status detection
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setNowTime(timeStr);

      // Compare current time to scheduled end (HH:MM)
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const endMin = toMinutes(session.end);
      const diff   = nowMin - endMin;

      if (diff > 2)       setStatus("extended");
      else if (diff < -2) setStatus("on-time"); // still within window
      // we only flip to "early" when user clicks End — not on a timer
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.end]);

  const handleEndClick = () => {
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const endMin = toMinutes(session.end);
    const diff   = nowMin - endMin;

    if (diff > 2) {
      // Running over scheduled end
      setStatus("extended");
      setShowModal(true);
    } else if (diff < -2) {
      // Ending before scheduled end
      setStatus("early");
      setShowModal(true);
    } else {
      // On time — no modal needed
      onEnd(null, "on-time");
    }
  };

  const handleConfirm = () => {
    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!reason) { setReasonErr("Please select or enter a reason."); return; }
    setReasonErr(null);
    setShowModal(false);
    onEnd(reason, status);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedReason("");
    setCustomReason("");
    setReasonErr(null);
  };

  const isOverdue = status === "extended";
  const reasons   = status === "early" ? EARLY_REASONS : EXTENDED_REASONS;

  // Status color for the scheduled end cell
  const endColor = isOverdue
    ? "var(--red)"
    : status === "early"
      ? "var(--amber)"
      : "var(--text-1)";

  return (
    <>
      <div className="dash-card" style={{ borderColor: isOverdue ? "var(--red-dim)" : "var(--blue-dim)" }}>
        <div className="dash-card-head">
          <div className="dash-card-title">Active Session</div>
          <div style={{ display: "flex", gap: 6 }}>
            {isOverdue && <div className="dash-chip red">Overtime</div>}
            <div className="dash-chip green">Live</div>
          </div>
        </div>

        <div className="dash-card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Overtime warning banner */}
          {isOverdue && (
            <div style={{
              background:   "var(--red-dim)",
              border:       "1px solid var(--red)",
              borderRadius: 6,
              padding:      "8px 12px",
              fontSize:     12,
              color:        "var(--red)",
            }}>
              ⚠ Session has passed its scheduled end time ({session.end}). Current time: {nowTime}.
            </div>
          )}

          <div className="dash-session-grid">
            {[
              { label: "Room",    value: session.room  },
              { label: "Year",    value: session.year  },
              { label: "Start",   value: session.start },
              { label: "Sched. End", value: session.end, color: endColor },
              { label: "Now",     value: nowTime       },
              { label: "Entries", value: entries       },
              { label: "Exits",   value: exits         },
              { label: "Peak",    value: peak          },
            ].map(({ label, value, color }) => (
              <div key={label} className="dash-session-cell">
                <div className="dash-session-cell-label">{label}</div>
                <div className="dash-session-cell-value" style={{ color: color ?? "var(--text-1)" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {error && <div className="dash-error">{error}</div>}

          <button
            className={`dash-btn ${isOverdue ? "red" : "red"}`}
            onClick={handleEndClick}
            disabled={saving}
            style={{ width: "100%" }}
          >
            {saving ? "Saving\u2026" : "End Session & Save"}
          </button>

        </div>
      </div>

      {/* ── Reason Modal ── */}
      {showModal && (
        <div style={{
          position:       "fixed",
          inset:          0,
          background:     "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          zIndex:         100,
        }}>
          <div style={{
            background:   "var(--surface)",
            border:       "1px solid var(--border)",
            borderRadius: 12,
            padding:      24,
            width:        "100%",
            maxWidth:     400,
            display:      "flex",
            flexDirection:"column",
            gap:          16,
          }}>
            {/* Modal header */}
            <div>
              <div style={{
                fontSize:      11,
                fontWeight:    600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color:         status === "early" ? "var(--amber)" : "var(--red)",
                marginBottom:  6,
              }}>
                {status === "early" ? "⚠ Ending Early" : "⚠ Session Overtime"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                {status === "early"
                  ? `This session was scheduled to end at ${session.end}. Please provide a reason for ending early.`
                  : `This session passed its scheduled end time of ${session.end}. Please provide a reason for the extension.`}
              </div>
            </div>

            {/* Reason options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {reasons.map(r => (
                <label
                  key={r}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          10,
                    padding:      "8px 12px",
                    borderRadius: 6,
                    border:       `1px solid ${selectedReason === r ? "var(--blue)" : "var(--border)"}`,
                    background:   selectedReason === r ? "rgba(59,130,246,0.08)" : "var(--surface-2)",
                    cursor:       "pointer",
                    fontSize:     13,
                    color:        "var(--text-1)",
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => { setSelectedReason(r); setCustomReason(""); }}
                    style={{ accentColor: "var(--blue)" }}
                  />
                  {r}
                </label>
              ))}
            </div>

            {/* Custom reason input */}
            {selectedReason === "Other" && (
              <div className="dash-field">
                <label className="dash-label">Describe the reason</label>
                <input
                  className="dash-input"
                  placeholder="Enter reason..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {reasonErr && <div className="dash-error">{reasonErr}</div>}

            {/* Modal actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="dash-btn red"
                style={{ flex: 1 }}
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? "Saving\u2026" : "Confirm & Save"}
              </button>
              <button className="dash-btn ghost" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}