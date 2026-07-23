"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const password = e.target.password.value;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    setSuccess("Password updated successfully.");
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e0e0e0", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#222" }}>Set New Password</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#888" }}>Choose a new password for your account</p>
        </div>

        {!ready && !success && (
          <div style={{ background: "white", borderRadius: 20, padding: 30, boxShadow: "0 5px 20px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>Verifying your reset link…</p>
          </div>
        )}

        {success ? (
          <div style={{ background: "white", borderRadius: 20, padding: 30, boxShadow: "0 5px 20px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <p style={{ color: "#16a34a", fontSize: 14, margin: 0 }}>{success}</p>
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Redirecting to login…</p>
          </div>
        ) : ready ? (
          <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 20, padding: 30, boxShadow: "0 5px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="password" style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#444" }}>New Password</label>
              <input id="password" name="password" type="password" required minLength={8} className="system-input" style={{ marginBottom: 0 }} />
            </div>

            {error && (
              <p style={{ margin: "0 0 16px 0", padding: "10px 14px", background: "#f8d7da", borderRadius: 8, fontSize: 14, color: "#721c24" }}>{error}</p>
            )}

            <button type="submit" disabled={pending} className="system-btn" style={{ width: "100%", justifyContent: "center", padding: "14px 22px" }}>
              {pending ? "Updating…" : "Update Password"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
