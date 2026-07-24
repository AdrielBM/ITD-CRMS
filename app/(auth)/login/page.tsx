"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

interface State {
  error: string | null;
}

const initialState: State = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: State, formData: FormData) => (await loginAction(formData)) ?? initialState,
    initialState
  );

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, #0B3D2B 0%, #0a2e20 55%, #081f16 100%)",
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
        background: "radial-gradient(circle, rgba(227,185,74,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-30%",
        left: "-10%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(242,153,74,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 80,
            height: 80,
            margin: "0 auto 16px auto",
            borderRadius: "50%",
            background: "#fff",
            padding: 6,
            boxShadow: "0 0 0 3px #D4A94A, 0 10px 26px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img src="/images/cvsu-seal.png" alt="CvSU" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "contain" }} />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.3px",
            fontFamily: "'Fraunces', Georgia, serif",
          }}>
            ITD-CRMS
          </h1>
          <p style={{
            margin: "6px 0 0",
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
          }}>
            Compliance &amp; Requirements Management System
          </p>
        </div>

        {/* Login card */}
        <form
          action={formAction}
          style={{
            background: "var(--paper)",
            borderRadius: 18,
            padding: "32px 32px 28px",
            boxShadow: "0 32px 64px -20px rgba(6,26,18,0.55), 0 0 0 1px rgba(255,255,255,0.9)",
            border: "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #0F5C3F, #d9711c 50%, #0F5C3F)",
            borderRadius: "18px 18px 0 0",
          }} />

          <h2 style={{
            margin: "0 0 24px",
            fontSize: 18,
            fontWeight: 600,
            color: "var(--ink)",
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
                fontSize: 12,
                fontWeight: 600,
                color: "#4a4038",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
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
              style={{ marginBottom: 0, borderWidth: 1.5 }}
              placeholder="e.g. juan.delacruz@cvsu.edu.ph"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#4a4038",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
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
              style={{ marginBottom: 0, borderWidth: 1.5 }}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
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
              background: "rgba(217, 113, 28, 0.08)",
              border: "1px solid rgba(217, 113, 28, 0.28)",
              borderRadius: 8,
              fontSize: 13,
              color: "#d9711c",
              textAlign: "center",
            }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="system-btn system-btn--dark"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px 22px",
              fontSize: 15,
              borderRadius: 10,
            }}
          >
            {pending ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>

        <p style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.6,
        }}>
          Accounts are created by the Department Chair.<br />
          Contact your Chair if you need access.
        </p>
      </div>
    </div>
  );
}
