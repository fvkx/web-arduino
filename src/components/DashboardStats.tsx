// components/DashboardStats.tsx
interface Props {
    count: number;
    entries: number;
    exits: number;
    peak: number;
  }
  
  export default function DashboardStats({ count, entries, exits, peak }: Props) {
    return (
      <div className="dash-stats-row">
        <div className="dash-stat primary">
          <div className="dash-stat-label">Current Occupancy</div>
          <div className="dash-stat-value blue">{count}</div>
          <div className="dash-stat-sub">people in room</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Total Entries</div>
          <div className="dash-stat-value green">{entries}</div>
          <div className="dash-stat-sub">IN this session</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Total Exits</div>
          <div className="dash-stat-value amber">{exits}</div>
          <div className="dash-stat-sub">OUT this session</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Peak Occupancy</div>
          <div className="dash-stat-value">{peak}</div>
          <div className="dash-stat-sub">highest recorded</div>
        </div>
      </div>
    );
  }