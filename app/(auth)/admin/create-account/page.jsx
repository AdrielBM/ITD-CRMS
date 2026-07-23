import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CreateAccountForm from "./create-account-form";

export default async function CreateAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, roles ( name ), email")
    .eq("id", user.id)
    .single();

  if (profile?.roles?.name !== "Chair") redirect("/dashboard");

  const { data: roles } = await supabase.from("roles").select("id, name").order("id");

  return (
    <AppShell fullName={profile?.full_name} email={profile?.email} role="Chair" currentPath="/admin/create-account">
      <div className="page-header">
        <h1>Create Account</h1>
        <p>Only the Department Chair can create logins</p>
      </div>
      <div className="page-body" style={{ maxWidth: 500 }}>
        <CreateAccountForm roles={roles ?? []} />
      </div>
    </AppShell>
  );
}
