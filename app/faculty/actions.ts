"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertFacultyProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("faculty_profiles").upsert({
    user_id: formData.get("user_id"),
    program_id: formData.get("program_id") || null,
    position: formData.get("position") || null,
    employment_type: formData.get("employment_type") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/faculty");
}