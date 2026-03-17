import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");

    if (saved) {
      setDark(saved === "dark");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light"
    );

    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(p => !p)}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 99,
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        color: "var(--text-2)",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14 }}>
        {dark ? "☀" : "☾"}
      </span>
      {dark ? "Light" : "Dark"}
    </button>
  );
}