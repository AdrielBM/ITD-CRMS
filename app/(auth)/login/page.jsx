"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { Shield } from "lucide-react";

const initialState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState, formData) => (await loginAction(formData)) ?? initialState,
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
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        top: "-50%",
        right: "-20%",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(27,94,32,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-30%",
        left: "-10%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(234,88,12,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            margin: "0 auto 16px auto",
            background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(27,94,32,0.2)",
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            color: "#111827",
            letterSpacing: "-0.5px",
          }}>
            ITD-CRMS
          </h1>
          <p style={{
            margin: "6px 0 0",
            fontSize: 14,
            color: "#6b7280",
            fontWeight: 400,
          }}>
            Compliance &amp; Requirements Management System
          </p>
        </div>

        {/* Login card */}
        <form
          action={formAction}
          style={{
            background: "white",
            borderRadius: 16,
            padding: "32px 32px 28px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(229,231,235,0.5)",
            backdropFilter: "blur(8px)",
          }}
        >
          <h2 style={{
            margin: "0 0 24px",
            fontSize: 18,
            fontWeight: 600,
            color: "#111827",
            textAlign: "center",
          }}>
            Sign in to your account
          </h2>

          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="system-input"
              style={{ marginBottom: 0 }}
              placeholder="you@itd-crms.edu.ph"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="system-input"
              style={{ marginBottom: 0 }}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <a href="/forgot-password" className="forgot-pw-link">
              Forgot password?
            </a>
          </div>

          {state?.error && (
            <p style={{
              margin: "0 0 16px 0",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: 13,
              color: "#dc2626",
            }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="system-btn"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px 22px",
              fontSize: 15,
            }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 13,
          color: "#9ca3af",
          lineHeight: 1.6,
        }}>
          Accounts are created by the Department Chair.<br />
          Contact your Chair if you need access.
        </p>
      </div>
    </div>
  );
}
