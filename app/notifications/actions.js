"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";

export async function markAsRead(formData) {
  const supabase = await createClient();
  const { user } = await getCurrentUserAccess(supabase);
  if (!user) throw new Error("Not authenticated");

  const notificationId = parseInt(formData.get("notification_id"));
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId).eq("user_id", user.id);
  revalidatePath("/notifications");
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const { user } = await getCurrentUserAccess(supabase);
  if (!user) throw new Error("Not authenticated");

  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).is("is_read", false);
  revalidatePath("/notifications");
}
