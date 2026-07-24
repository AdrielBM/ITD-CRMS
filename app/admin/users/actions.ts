"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateUserRole(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = formData.get("user_id") as string;
  const roleId = Number(formData.get("role_id"));

  const { error } = await supabase
    .from("users")
    .update({ role_id: roleId })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = formData.get("user_id") as string;
  const isActive = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("users")
    .update({ is_active: !isActive })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function resetUserPassword(formData: FormData): Promise<void> {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const newPassword = formData.get("new_password") as string;

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function addUserRole(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = formData.get("user_id") as string;
  const roleName = formData.get("role_name") as string;

  const { data: role } = await supabase.from("roles").select("id").eq("name", roleName).single();
  if (!role) throw new Error("Role not found");

  await supabase.from("user_roles").upsert({ user_id: userId, role_id: role.id }, { onConflict: "user_id,role_id" });
  revalidatePath("/admin/users");
}

export async function removeUserRole(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const userId = formData.get("user_id") as string;
  const roleName = formData.get("role_name") as string;

  const { data: role } = await supabase.from("roles").select("id").eq("name", roleName).single();
  if (!role) throw new Error("Role not found");

  await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", role.id);
  revalidatePath("/admin/users");
}