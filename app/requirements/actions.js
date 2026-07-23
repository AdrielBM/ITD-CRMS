"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PATH = "/requirements";

// ---------- Categories ----------
export async function createCategory(formData) {
  const supabase = await createClient();
  const { error } = await supabase.from("requirement_categories").insert({
    name: formData.get("name"),
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

// ---------- Templates ----------
export async function createTemplate(formData) {
  const supabase = await createClient();
  const { error } = await supabase.from("requirement_templates").insert({
    category_id: formData.get("category_id") || null,
    name: formData.get("name"),
    description: formData.get("description") || null,
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function toggleTemplateActive(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const isActive = formData.get("is_active") === "true";
  const { error } = await supabase
    .from("requirement_templates")
    .update({ is_active: !isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function deleteTemplate(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("requirement_templates")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
    .eq("id", formData.get("id"));
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

// ---------- Instances (a template applied to a semester) ----------
export async function createInstance(formData) {
  const supabase = await createClient();

  const semesterId = formData.get("semester_id");
  const { data: semester } = await supabase
    .from("semesters")
    .select("academic_year_id")
    .eq("id", semesterId)
    .single();

  const { error } = await supabase.from("requirement_instances").insert({
    template_id: formData.get("template_id"),
    semester_id: semesterId,
    academic_year_id: semester?.academic_year_id ?? null,
    due_date: formData.get("due_date") || null,
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function deleteInstance(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("requirement_instances")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
    .eq("id", formData.get("id"));
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

/**
 * Generates an instance for every currently-active template, for one
 * semester, in a single click — instead of doing it 19 times by hand.
 * Skips templates that already have an instance for this semester.
 */
export async function bulkGenerateInstances(formData) {
  const supabase = await createClient();
  const semesterId = formData.get("semester_id");

  const { data: semester } = await supabase
    .from("semesters")
    .select("academic_year_id")
    .eq("id", semesterId)
    .single();

  const { data: templates } = await supabase
    .from("requirement_templates")
    .select("id")
    .eq("is_active", true);

  const rows = (templates ?? []).map((t) => ({
    template_id: t.id,
    semester_id: semesterId,
    academic_year_id: semester?.academic_year_id ?? null,
  }));

  if (rows.length === 0) return { error: "No active templates to generate." };

  const { error } = await supabase
    .from("requirement_instances")
    .upsert(rows, { onConflict: "template_id,semester_id", ignoreDuplicates: true });

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { success: `Generated instances for ${rows.length} template(s).` };
}

/**
 * Assigns every current Faculty account to every requirement instance in
 * a semester, in one click. Safe to click again later (e.g. after a new
 * faculty account is created) — duplicates are silently skipped.
 */
export async function bulkAssignAllFacultyForSemester(formData) {
  const supabase = await createClient();
  const semesterId = formData.get("semester_id");

  const { data: instances } = await supabase
    .from("requirement_instances")
    .select("id")
    .eq("semester_id", semesterId);

  const { data: faculty } = await supabase
    .from("users")
    .select("id, roles!role_id!inner(name)")
    .eq("roles.name", "Faculty");

  const instanceIds = (instances ?? []).map((i) => i.id);

  // Find what's already assigned so we don't try to insert duplicates
  // (the unique index on assignments is partial, so a plain upsert
  // can't target it — filtering manually here instead).
  const { data: existing } = instanceIds.length
    ? await supabase
        .from("assignments")
        .select("requirement_instance_id, faculty_id")
        .in("requirement_instance_id", instanceIds)
        .not("faculty_id", "is", null)
    : { data: [] };

  const existingSet = new Set(
    (existing ?? []).map((a) => `${a.requirement_instance_id}-${a.faculty_id}`)
  );

  const rows = [];
  for (const instanceId of instanceIds) {
    for (const f of faculty ?? []) {
      if (!existingSet.has(`${instanceId}-${f.id}`)) {
        rows.push({ requirement_instance_id: instanceId, faculty_id: f.id });
      }
    }
  }

  if (rows.length === 0) return { error: "Nothing new to assign — everyone's already assigned." };

  const { error } = await supabase.from("assignments").insert(rows);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  revalidatePath(`${PATH}/compliance-matrix`);
  return { success: `Assigned ${faculty?.length ?? 0} faculty across ${instanceIds.length} requirement(s).` };
}

// ---------- Assignments ----------
export async function createAssignment(formData) {
  const supabase = await createClient();
  const assigneeType = formData.get("assignee_type"); // 'faculty' | 'organization'
  const assigneeId = formData.get("assignee_id");

  const { error } = await supabase.from("assignments").insert({
    requirement_instance_id: formData.get("requirement_instance_id"),
    faculty_id: assigneeType === "faculty" ? assigneeId : null,
    organization_id: assigneeType === "organization" ? assigneeId : null,
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
  revalidatePath(`${PATH}/compliance-matrix`);
}

export async function deleteAssignment(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("assignments").update({
    deleted_at: new Date().toISOString(), deleted_by: user?.id,
  }).eq("id", formData.get("id"));
  if (error) return { error: error.message };
  revalidatePath(PATH);
  revalidatePath(`${PATH}/compliance-matrix`);
}