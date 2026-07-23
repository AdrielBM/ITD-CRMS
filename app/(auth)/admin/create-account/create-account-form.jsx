"use client";

import { useActionState } from "react";
import { createAccountAction } from "../../actions";

const initialState = { error: null, success: null };

export default function CreateAccountForm({ roles }) {
  const [state, formAction, pending] = useActionState(
    async (_prevState, formData) => (await createAccountAction(formData)) ?? initialState,
    initialState
  );

  return (
    <form
      action={formAction}
      className="system-card"
      style={{ padding: "24px 28px" }}
    >
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#444" }}>
          Full name
        </label>
        <input name="full_name" required className="system-input" style={{ marginBottom: 0 }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#444" }}>
          Email
        </label>
        <input name="email" type="email" required className="system-input" style={{ marginBottom: 0 }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#444" }}>
          Role
        </label>
        <select name="role_id" required className="system-input" style={{ marginBottom: 0 }}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#444" }}>
          Temporary password
        </label>
        <input
          name="temp_password"
          type="text"
          required
          minLength={8}
          className="system-input"
          style={{ marginBottom: 0 }}
        />
      </div>

      {state?.error && (
        <p style={{ margin: "0 0 14px 0", padding: "10px 14px", background: "#f8d7da", borderRadius: 8, fontSize: 14, color: "#721c24" }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p style={{ margin: "0 0 14px 0", padding: "10px 14px", background: "#d4edda", borderRadius: 8, fontSize: 14, color: "#155724" }}>
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="system-btn"
        style={{ width: "100%", justifyContent: "center" }}
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
