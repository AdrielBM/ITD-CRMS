"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "../actions";
import { Shield } from "lucide-react";

const initialState = { error: null, success: null };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState, formData) => (await requestPasswordResetAction(formData)) ?? initialState,
    initialState
  );

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
            Reset Password
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280" }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {state?.success ? (
          <div style={{
            background: "white", borderRadius: 16, padding: 32, textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(229,231,235,0.5)",
          }}>
            <p style={{ color: "#16a34a", fontSize: 14, margin: 0 }}>{state.success}</p>
            <a href="/login" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: "inline-flex" }}>Back to Login</a>
          </div>
        ) : (
          <form action={formAction} style={{
            background: "white", borderRadius: 16, padding: "32px 32px 28px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(229,231,235,0.5)",
          }}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="email" className="form-label">Email</label>
              <input id="email" name="email" type="email" required className="system-input" placeholder="you@itd-crms.edu.ph" />
            </div>

            {state?.error && (
              <p style={{ margin: "0 0 16px 0", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending} className="system-btn" style={{ width: "100%", justifyContent: "center", padding: "12px 22px", fontSize: 15 }}>
              {pending ? "Sending…" : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a href="/login" className="forgot-pw-link">Back to Login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
