"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateUserRole(formData) {
  const supabase = await createClient();
  const userId = formData.get("user_id");
  const roleId = Number(formData.get("role_id"));

  const { error } = await supabase
    .from("users")
    .update({ role_id: roleId })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
}

export async function toggleUserActive(formData) {
  const supabase = await createClient();
  const userId = formData.get("user_id");
  const isActive = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("users")
    .update({ is_active: !isActive })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
}

export async function resetUserPassword(formData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id");
  const newPassword = formData.get("new_password");

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: "Password reset successful." };
}
