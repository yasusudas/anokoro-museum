"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Museum page error:", error);
  }, [error]);

  return (
    <main className="museum-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", maxWidth: "480px", padding: "2rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>展示の読み込みに失敗しました</h2>
        <p style={{ color: "var(--fg-muted, #aaa)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          {error.message || "一時的なエラーが発生しました。ネットワーク状況をご確認の上、もう一度お試しください。"}
        </p>
        <button
          className="login-button"
          onClick={() => reset()}
          style={{ cursor: "pointer", padding: "0.6rem 1.4rem" }}
        >
          再試行する
        </button>
      </div>
    </main>
  );
}
