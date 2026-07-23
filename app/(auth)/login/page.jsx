"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

const initialState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prevState, formData) => (await loginAction(formData)) ?? initialState,
    initialState
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e0e0e0",
        padding: "0 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 12px auto",
              background: "#333",
              borderRadius: 14,
            }}
          />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#222" }}>
            ITD-CRMS
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#888" }}>
            Compliance &amp; Requirements Management
          </p>
        </div>

        <form
          action={formAction}
          style={{
            background: "white",
            borderRadius: 20,
            padding: 30,
            boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
                color: "#444",
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
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
                color: "#444",
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
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <a
              href="/forgot-password"
              className="forgot-pw-link"
            >
              Forgot password?
            </a>
          </div>

          {state?.error && (
            <p
              style={{
                margin: "0 0 16px 0",
                padding: "10px 14px",
                background: "#f8d7da",
                borderRadius: 8,
                fontSize: 14,
                color: "#721c24",
              }}
            >
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
              padding: "14px 22px",
            }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 13,
            color: "#999",
          }}
        >
          Accounts are created by the Department Chair. Contact your Chair if you need access.
        </p>
      </div>
    </div>
  );
}
