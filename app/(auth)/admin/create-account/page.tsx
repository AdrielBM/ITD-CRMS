import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import CreateAccountForm from "./create-account-form";

export default async function CreateAccountPage() {
  const supabase = await createClient();
  const { user, role, roles, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");
  if (!roles.includes("Chair")) redirect("/dashboard");

  const { data: allRoles } = await supabase.from("roles").select("id, name").order("id");

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/admin/create-account">
      <div className="page-header">
        <h1>Create Account</h1>
        <p>Only the Department Chair can create logins</p>
      </div>
      <div className="page-body" style={{ maxWidth: 500 }}>
        <CreateAccountForm roles={allRoles ?? []} />
      </div>
    </AppShell>
  );
}
