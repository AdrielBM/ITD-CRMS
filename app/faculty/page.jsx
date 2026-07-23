import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess, can } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import { upsertFacultyProfile } from "./actions";

export default async function FacultyPage() {
  const supabase = await createClient();
  const { user, role, profile, permissions } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const canWrite = can(permissions, "Faculty", "CRUD");

  const [{ data: faculty, error: facultyError }, { data: programs }] = await Promise.all([
    supabase.from("users")
      .select("id, full_name, email, roles!role_id!inner(name), faculty_profiles!faculty_profiles_user_id_fkey(program_id, position, employment_type)")
      .eq("roles.name", "Faculty").order("full_name"),
    supabase.from("programs").select("id, name, code").order("name"),
  ]);

  if (facultyError) console.error("Faculty query error:", facultyError);

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} currentPath="/faculty">
      <div className="page-header">
        <h1>Faculty</h1>
        <p>Manage program, position, and employment type for faculty accounts</p>
      </div>
      <div className="page-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(faculty ?? []).map((f) => {
            const fp = f.faculty_profiles;
            return (
              <form key={f.id} action={upsertFacultyProfile} className="card">
                <input type="hidden" name="user_id" value={f.id} />
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1f2937" }}>{f.full_name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9ca3af" }}>{f.email}</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <select name="program_id" defaultValue={fp?.program_id ?? ""} disabled={!canWrite} className="input" style={{ flex: 1, minWidth: 140 }}>
                    <option value="">Program…</option>
                    {(programs ?? []).map((p) => (<option key={p.id} value={p.id}>{p.code}</option>))}
                  </select>
                  <input name="position" placeholder="Position" defaultValue={fp?.position ?? ""} disabled={!canWrite} className="input" style={{ flex: 1, minWidth: 140 }} />
                  <input name="employment_type" placeholder="Employment type" defaultValue={fp?.employment_type ?? ""} disabled={!canWrite} className="input" style={{ flex: 1, minWidth: 140 }} />
                  {canWrite && <button className="btn btn-primary btn-sm">Save</button>}
                </div>
              </form>
            );
          })}

          {facultyError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 14, fontSize: 14, color: "#dc2626" }}>
              Query error: {facultyError.message}
            </div>
          )}

          {!facultyError && (faculty ?? []).length === 0 && (
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ color: "#9ca3af" }}>No faculty accounts yet. Create one from Create Account with role &ldquo;Faculty.&rdquo;</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
