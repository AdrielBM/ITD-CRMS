"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loginAction(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Login error:", error);
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(formData) {
  const email = formData.get("email");
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) return { error: "Could not send reset email." };
  return { success: "Check your email for a reset link." };
}

/**
 * Chair-only. Creates a login (auth.users) + profile (public.users) row.
 * There is no public sign-up screen in this system — this is the only
 * way an account gets created.
 */
export async function createAccountAction(formData) {
  const supabase = await createClient();

  // 1. Confirm the caller is actually a Chair before doing anything privileged.
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) return { error: "Not signed in." };

  const { data: callerProfile } = await supabase
    .from("users")
    .select("roles ( name )")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.roles?.name !== "Chair") {
    return { error: "Only the Department Chair can create accounts." };
  }

  const email = formData.get("email");
  const fullName = formData.get("full_name");
  const roleId = Number(formData.get("role_id"));
  const tempPassword = formData.get("temp_password");

  try {
    const admin = createAdminClient();

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) {
      console.error("createUser error:", createError);
      return { error: `Auth create failed: ${createError.message}` };
    }

    console.log("Created auth user:", created.user.id, created.user.email);

    const { error: profileError } = await admin.from("users").insert({
      id: created.user.id,
      email,
      full_name: fullName,
      role_id: roleId,
    });

    if (profileError) {
      console.error("users insert error:", profileError);
      return { error: `Profile insert failed: ${profileError.message}` };
    }

    return { success: `Account created for ${email}.` };
  } catch (err) {
    console.error("createAccountAction unexpected error:", err);
    return { error: `Unexpected error: ${err.message}` };
  }
}