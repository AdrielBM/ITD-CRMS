"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TABLES = [
  { name: "programs", label: "Programs" },
  { name: "academic_years", label: "Academic Years" },
  { name: "semesters", label: "Semesters" },
  { name: "requirement_categories", label: "Categories" },
  { name: "requirement_templates", label: "Templates" },
  { name: "requirement_instances", label: "Instances" },
  { name: "assignments", label: "Assignments" },
];

export async function restoreItem(formData) {
  const supabase = await createClient();
  const table = formData.get("table");
  const id = formData.get("id");

  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/recycle");
}

export async function permanentDelete(formData) {
  const supabase = await createClient();
  const table = formData.get("table");
  const id = formData.get("id");

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/recycle");
}


