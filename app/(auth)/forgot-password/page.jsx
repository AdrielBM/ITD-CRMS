"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "../actions";

const initialState = { error: null, success: null };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState, formData) => (await requestPasswordResetAction(formData)) ?? initialState,
    initialState
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e0e0e0", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#222" }}>Reset Password</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#888" }}>Enter your email to receive a reset link</p>
        </div>

        {state?.success ? (
          <div style={{ background: "white", borderRadius: 20, padding: 30, boxShadow: "0 5px 20px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <p style={{ color: "#16a34a", fontSize: 14, margin: 0 }}>{state.success}</p>
            <a href="/login" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: "inline-flex" }}>Back to Login</a>
          </div>
        ) : (
          <form action={formAction} style={{ background: "white", borderRadius: 20, padding: 30, boxShadow: "0 5px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="email" style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#444" }}>Email</label>
              <input id="email" name="email" type="email" required className="system-input" style={{ marginBottom: 0 }} />
            </div>

            {state?.error && (
              <p style={{ margin: "0 0 16px 0", padding: "10px 14px", background: "#f8d7da", borderRadius: 8, fontSize: 14, color: "#721c24" }}>{state.error}</p>
            )}

            <button type="submit" disabled={pending} className="system-btn" style={{ width: "100%", justifyContent: "center", padding: "14px 22px" }}>
              {pending ? "Sending…" : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a href="/login" style={{ color: "#ea580c", fontSize: 13 }}>Back to Login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
