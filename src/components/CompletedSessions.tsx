interface CompletedSession {
  id:      number;
  room:    string;
  year:    string;
  start:   string;
  end:     string;
  entries: number;
  exits:   number;
  peak:    number;
  savedAt: string;
  source:  "auto" | "manual";
  status:  "on-time" | "early" | "extended";
  reason:  string | null;
}

interface Props {
  sessions: CompletedSession[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  "on-time":  { bg: "var(--green-dim)", color: "var(--green)", border: "var(--green)", label: "On Time"  },
  "early":    { bg: "var(--amber-dim)", color: "var(--amber)", border: "var(--amber)", label: "Early"    },
  "extended": { bg: "var(--red-dim)",   color: "var(--red)",   border: "var(--red)",   label: "Overtime" },
};

export default function CompletedSessions({ sessions }: Props) {
  if (sessions.length === 0) return null;

  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <div className="dash-card-title">Completed Sessions</div>
        <div className="dash-card-badge">{sessions.length} saved</div>
      </div>

      {/* Outer: horizontal scroll. Inner: vertical scroll with sticky header */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Source", "Status", "Room", "Year", "Time", "Entries", "Exits", "Peak", "Reason", "Saved"].map(h => (
                  <th key={h} style={{
                    padding:         "8px 14px",
                    textAlign:       "left",
                    fontSize:        10,
                    fontWeight:      600,
                    letterSpacing:   "0.08em",
                    textTransform:   "uppercase",
                    color:           "var(--text-3)",
                    whiteSpace:      "nowrap",
                    position:        "sticky",
                    top:             0,
                    background:      "var(--surface)",
                    zIndex:          1,
                    borderBottom:    "1px solid var(--border)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...sessions].reverse().map((s, idx) => {
                const st = STATUS_STYLES[s.status] ?? STATUS_STYLES["on-time"];
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: idx < sessions.length - 1 ? "1px solid var(--border)" : "none",
                      background:   idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    {/* Source */}
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                        textTransform: "uppercase", padding: "2px 7px", borderRadius: 999,
                        background: s.source === "auto" ? "var(--green-dim)" : "var(--amber-dim)",
                        color:      s.source === "auto" ? "var(--green)"     : "var(--amber)",
                        border:     `1px solid ${s.source === "auto" ? "var(--green)" : "var(--amber)"}`,
                      }}>
                        {s.source === "auto" ? "Auto" : "Manual"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                        textTransform: "uppercase", padding: "2px 7px", borderRadius: 999,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                      }}>
                        {st.label}
                      </span>
                    </td>

                    <td style={{ padding: "10px 14px", color: "var(--text-1)", fontWeight: 600 }}>{s.room}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-2)" }}>{s.year}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-2)", whiteSpace: "nowrap" }}>
                      {s.start} &rarr; {s.end}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>{s.entries}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: "var(--amber)", fontWeight: 600 }}>{s.exits}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-1)", fontWeight: 600 }}>{s.peak}</td>

                    {/* Reason */}
                    <td style={{ padding: "10px 14px", color: "var(--text-3)", maxWidth: 180 }}>
                      {s.reason
                        ? <span style={{ color: "var(--text-2)" }}>{s.reason}</span>
                        : <span style={{ color: "var(--text-3)" }}>&mdash;</span>
                      }
                    </td>

                    <td style={{ padding: "10px 14px", color: "var(--text-3)", whiteSpace: "nowrap" }}>{s.savedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}