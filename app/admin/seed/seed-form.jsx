"use client";

import { useActionState } from "react";
import { seedAll } from "./actions";

const initialState = null;

export default function SeedForm() {
  const [result, formAction, pending] = useActionState(async () => await seedAll(), initialState);

  return (
    <div className="card" style={{ padding: "24px 28px", maxWidth: 500 }}>
      <h3 className="section-title" style={{ marginTop: 0 }}>Seed Sample Data</h3>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16, lineHeight: 1.5 }}>
        This will create 17 faculty accounts, programs, requirement templates, assignments, and organizations. Faculty passwords follow the pattern: <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>Temp@Surname2026</code>
      </p>

      <form action={formAction}>
        <button type="submit" disabled={pending} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          {pending ? "Seeding…" : "Seed All Sample Data"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ padding: "12px 16px", background: "#d4edda", borderRadius: 8, fontSize: 14, color: "#155724" }}>
            <strong>{result.created}</strong> accounts created, <strong>{result.skipped}</strong> already existed.
          </div>
          {result.errors.length > 0 && (
            <div style={{ marginTop: 8, padding: "12px 16px", background: "#f8d7da", borderRadius: 8, fontSize: 13, color: "#721c24" }}>
              <strong>Errors:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
