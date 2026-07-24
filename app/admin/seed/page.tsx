import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import SeedForm from "./seed-form";

export default async function SeedPage() {
  const supabase = await createClient();
  const { user, role, roles, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");
  if (!roles.includes("Chair")) redirect("/dashboard");

  // Show currently seeded data counts
  const [
    { count: userCount },
    { count: programCount },
    { count: templateCount },
    { count: instanceCount },
    { count: assignmentCount },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("programs").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("requirement_templates").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("requirement_instances").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("assignments").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/admin/seed">
      <div className="page-header">
        <h1>Seed Data</h1>
        <p>Populate the system with sample data for testing</p>
      </div>
      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card"><p className="stat-label">Users</p><p className="stat-value">{userCount ?? 0}</p></div>
          <div className="stat-card"><p className="stat-label">Programs</p><p className="stat-value">{programCount ?? 0}</p></div>
          <div className="stat-card"><p className="stat-label">Templates</p><p className="stat-value">{templateCount ?? 0}</p></div>
          <div className="stat-card"><p className="stat-label">Instances</p><p className="stat-value">{instanceCount ?? 0}</p></div>
          <div className="stat-card"><p className="stat-label">Assignments</p><p className="stat-value">{assignmentCount ?? 0}</p></div>
        </div>

        <SeedForm />
      </div>
    </AppShell>
  );
}