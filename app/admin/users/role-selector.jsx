"use client";

import { updateUserRole } from "./actions";

export default function RoleSelector({ userId, currentRoleId, roles }) {
  return (
    <form action={updateUserRole}>
      <input type="hidden" name="user_id" value={userId} />
      <select name="role_id" defaultValue={currentRoleId ?? ""}
        className="input" onChange={(e) => e.target.form.requestSubmit()}
        style={{ width: "auto", minWidth: 130, marginBottom: 0 }}>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
    </form>
  );
}
