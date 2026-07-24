"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Shield } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0f2f5 0%, #e5e7eb 50%, #d1d5db 100%)",
      padding: "0 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 16px auto",
            background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
            borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(27,94,32,0.2)",
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
            Set New Password
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>
            Choose a new password for your account
          </p>
        </div>

        {!ready && !success && (
          <div style={{
            background: "white", borderRadius: 16, padding: 32, textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(229,231,235,0.5)",
          }}>
            <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>Verifying your reset link…</p>
          </div>
        )}

        {success ? (
          <div style={{
            background: "white", borderRadius: 16, padding: 32, textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(229,231,235,0.5)",
          }}>
            <p style={{ color: "#16a34a", fontSize: 14, margin: 0 }}>{success}</p>
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Redirecting to login…</p>
          </div>
        ) : ready ? (
          <form onSubmit={handleSubmit} style={{
            background: "white", borderRadius: 16, padding: "32px 32px 28px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(229,231,235,0.5)",
          }}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="password" className="form-label">New Password</label>
              <input id="password" name="password" type="password" required minLength={8} className="system-input" placeholder="At least 8 characters" />
            </div>

            {error && (
              <p style={{ margin: "0 0 16px 0", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="system-btn" style={{ width: "100%", justifyContent: "center", padding: "12px 22px", fontSize: 15 }}>
              {pending ? "Updating…" : "Update Password"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
