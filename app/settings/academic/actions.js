"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PATH = "/settings/academic";

// ---------- Programs ----------
export async function createProgram(formData) {
  const supabase = await createClient();
  const { error } = await supabase.from("programs").insert({
    name: formData.get("name"),
    code: formData.get("code"),
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function deleteProgram(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("programs").update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
  }).eq("id", formData.get("id"));
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

// ---------- Academic Years ----------
export async function createAcademicYear(formData) {
  const supabase = await createClient();
  const { error } = await supabase.from("academic_years").insert({
    label: formData.get("label"),
    start_date: formData.get("start_date") || null,
    end_date: formData.get("end_date") || null,
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function setActiveAcademicYear(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  // Only one academic year should be "active" at a time.
  await supabase.from("academic_years").update({ is_active: false }).neq("id", 0);
  const { error } = await supabase.from("academic_years").update({ is_active: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function deleteAcademicYear(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("academic_years").update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
  }).eq("id", formData.get("id"));
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

// ---------- Semesters ----------
export async function createSemester(formData) {
  const supabase = await createClient();
  const { error } = await supabase.from("semesters").insert({
    academic_year_id: formData.get("academic_year_id"),
    name: formData.get("name"),
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function setActiveSemester(formData) {
  const supabase = await createClient();
  const id = formData.get("id");
  const academicYearId = formData.get("academic_year_id");
  // Only one active semester per academic year.
  await supabase
    .from("semesters")
    .update({ is_active: false })
    .eq("academic_year_id", academicYearId);
  const { error } = await supabase.from("semesters").update({ is_active: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
}

export async function deleteSemester(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("semesters").update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
  }).eq("id", formData.get("id"));
  if (error) return { error: error.message };
  revalidatePath(PATH);
}