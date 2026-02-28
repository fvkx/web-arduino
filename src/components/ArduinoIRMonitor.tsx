// File: ArduinoIRMonitor.tsx
import React, { useState, useRef } from "react";

const ArduinoIRMonitor: React.FC = () => {
  const [status, setStatus] = useState<string>("Not connected");
  const [connected, setConnected] = useState<boolean>(false);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );
  const keepReadingRef = useRef<boolean>(false);

  const connectArduino = async () => {
    try {
      // Request serial port
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;

      setStatus("Connected to Arduino");
      setConnected(true);
      keepReadingRef.current = true;

      const reader = port.readable!.getReader();
      readerRef.current = reader;

      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const text = new TextDecoder().decode(value);
          setStatus(text.trim());
        }
      }
    } catch (err) {
      console.error("Error connecting to Arduino:", err);
      setStatus("Connection failed");
    }
  };

  const disconnectArduino = async () => {
    try {
      keepReadingRef.current = false;
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
      if (portRef.current) {
        await portRef.current.close();
      }
      setStatus("Disconnected");
      setConnected(false);
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  };

  // Visual indicator for buzzer
  const isBuzzerOn = status.includes("Detected");

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>IR Sensor Monitor</h2>
      <div>
        <button
          onClick={connectArduino}
          disabled={connected}
          style={{ marginRight: "1rem", padding: "0.5rem 1rem" }}
        >
          Connect
        </button>
        <button
          onClick={disconnectArduino}
          disabled={!connected}
          style={{ padding: "0.5rem 1rem" }}
        >
          Disconnect
        </button>
      </div>

      <div style={{ marginTop: "2rem", fontSize: "1.5rem" }}>{status}</div>

      <div
        style={{
          marginTop: "1rem",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          margin: "1rem auto",
          backgroundColor: isBuzzerOn ? "red" : "green",
        }}
        title={isBuzzerOn ? "Buzzer ON" : "Buzzer OFF"}
      ></div>
    </div>
  );
};

export default ArduinoIRMonitor;
