"use client";

import { useOptimistic, useRef } from "react";
import { addUserRole, removeUserRole } from "./actions";

function RoleBadge({ roleName, userId, optimistic, pending }) {
  return (
    <span className={`badge ${optimistic === false ? "badge-gray" : "badge-blue"}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, opacity: pending ? 0.6 : 1 }}>
      {roleName}
      <form action={removeUserRole} style={{ display: "inline" }}>
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="role_name" value={roleName} />
        <button type="submit"
          style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 13, padding: 0, lineHeight: 1 }}>
          ×
        </button>
      </form>
    </span>
  );
}

export default function MultiRoleManager({ userId, assignedRoles, allRoles }) {
  const assignedNames = new Set(assignedRoles.map((r) => r.name));
  const unassigned = allRoles.filter((r) => !assignedNames.has(r.name));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {assignedRoles.map((r) => (
        <RoleBadge key={`${userId}-${r.id}`} roleName={r.name} userId={userId} />
      ))}
      {unassigned.length > 0 && (
        <form action={addUserRole} style={{ display: "inline" }}>
          <input type="hidden" name="user_id" value={userId} />
          <select name="role_name" defaultValue=""
            onChange={(e) => { if (e.target.value) e.target.form.requestSubmit(); }}
            style={{ fontSize: 12, padding: "2px 4px", border: "1px solid #d1d5db", borderRadius: 4, background: "white", minWidth: 80 }}>
            <option value="">+ Add</option>
            {unassigned.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </form>
      )}
    </div>
  );
}
