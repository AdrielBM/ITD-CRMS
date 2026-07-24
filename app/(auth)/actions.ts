"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) return { error: "Could not send reset email." };
  return { success: "Check your email for a reset link." };
}

export async function createAccountAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) return { error: "Not signed in." };

  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role:roles!role_id(name)")
    .eq("user_id", caller.id);

  const isChair = (callerRoles ?? []).some((ur: any) => ur.role?.name === "Chair");
  if (!isChair) {
    return { error: "Only the Department Chair can create accounts." };
  }

  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const roleIds = (formData.getAll("role_ids") as string[]).map(Number).filter(Boolean);
  const tempPassword = formData.get("temp_password") as string;

  if (roleIds.length === 0) return { error: "At least one role must be selected." };

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError) return { error: createError.message };

  const { error: profileError } = await admin.from("users").insert({
    id: created.user.id,
    email,
    full_name: fullName,
    role_id: roleIds[0],
  });

  if (profileError) return { error: profileError.message };

  const userRolesRows = roleIds.map((rid: number) => ({ user_id: created.user.id, role_id: rid }));
  const { error: urError } = await admin.from("user_roles").upsert(userRolesRows, { onConflict: "user_id,role_id" });
  if (urError) return { error: `Role assignment issue: ${urError.message}` };

  return { success: `Account created for ${email}.` };
}
