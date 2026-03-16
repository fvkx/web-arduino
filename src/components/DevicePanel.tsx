// components/DevicePanel.tsx
interface Props {
    connected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
  }
  
  export default function DevicePanel({ connected, onConnect, onDisconnect }: Props) {
    return (
      <div className="dash-card">
        <div className="dash-card-head">
          <div className="dash-card-title">Device</div>
          <div className={`dash-chip ${connected ? "green" : ""}`}>
            {connected ? "Connected" : "Offline"}
          </div>
        </div>
        <div className="dash-card-body">
          <div className="dash-controls">
            <div className="dash-status-line">
              Status:{" "}
              <b>{connected ? "Arduino · 9600 baud" : "No device connected"}</b>
            </div>
            <div className="dash-btn-row">
              {!connected ? (
                <button className="dash-btn blue" onClick={onConnect} style={{ flex: 1 }}>
                  Connect Arduino
                </button>
              ) : (
                <button className="dash-btn ghost" onClick={onDisconnect} style={{ flex: 1 }}>
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }