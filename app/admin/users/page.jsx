import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import RoleSelector from "./role-selector";
import { toggleUserActive, resetUserPassword } from "./actions";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { user, role, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");
  if (role !== "Chair") redirect("/dashboard");

  const [{ data: users }, { data: roles }] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, is_active, created_at, roles ( id, name )")
      .order("created_at", { ascending: false }),
    supabase.from("roles").select("id, name").order("id"),
  ]);

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} currentPath="/admin/users">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage users, roles, and account status</p>
      </div>
      <div className="page-body">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Reset Password</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).length === 0 && (
                <tr><td colSpan={5} className="empty-state">No users found.</td></tr>
              )}
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                  <td style={{ color: "#6b7280", fontSize: 14 }}>{u.email}</td>
                  <td>
                    <RoleSelector userId={u.id} currentRoleId={u.roles?.id} roles={roles ?? []} />
                  </td>
                  <td>
                    <form action={toggleUserActive}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="is_active" value={String(u.is_active)} />
                      {u.is_active ? (
                        <button className="btn btn-outline btn-sm" style={{ borderColor: "#16a34a", color: "#16a34a" }}>
                          Active
                        </button>
                      ) : (
                        <button className="btn btn-outline btn-sm" style={{ borderColor: "#dc2626", color: "#dc2626" }}>
                          Inactive
                        </button>
                      )}
                    </form>
                  </td>
                  <td>
                    <details style={{ fontSize: 14 }}>
                      <summary style={{ cursor: "pointer", color: "#6b7280", userSelect: "none" }}>Reset</summary>
                      <form action={resetUserPassword} style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input name="new_password" type="text" required minLength={8}
                          placeholder="New password" className="input"
                          style={{ width: 140, marginBottom: 0, fontSize: 13 }} />
                        <button className="btn btn-sm">Set</button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
