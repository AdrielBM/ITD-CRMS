"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PATH = "/settings/academic";

// ---------- Programs ----------
export async function createProgram(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("programs").insert({
    name: formData.get("name") as string,
    code: formData.get("code") as string,
  });
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

export async function deleteProgram(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("programs").update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
  }).eq("id", formData.get("id"));
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

// ---------- Academic Years ----------
export async function createAcademicYear(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("academic_years").insert({
    label: formData.get("label") as string,
    start_date: (formData.get("start_date") as string) || null,
    end_date: (formData.get("end_date") as string) || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

export async function setActiveAcademicYear(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  // Only one academic year should be "active" at a time.
  await supabase.from("academic_years").update({ is_active: false }).neq("id", 0);
  const { error } = await supabase.from("academic_years").update({ is_active: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

export async function deleteAcademicYear(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("academic_years").update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
  }).eq("id", formData.get("id"));
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

// ---------- Semesters ----------
export async function createSemester(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("semesters").insert({
    academic_year_id: formData.get("academic_year_id"),
    name: formData.get("name") as string,
  });
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

export async function setActiveSemester(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const academicYearId = formData.get("academic_year_id") as string;
  // Only one active semester per academic year.
  await supabase
    .from("semesters")
    .update({ is_active: false })
    .eq("academic_year_id", academicYearId);
  const { error } = await supabase.from("semesters").update({ is_active: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

export async function deleteSemester(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("semesters").update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
  }).eq("id", formData.get("id"));
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

// ---------- Program Coordinators ----------
export async function assignProgramCoordinator(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("program_coordinators").insert({
    user_id: formData.get("user_id") as string,
    program_id: formData.get("program_id") ? Number(formData.get("program_id")) : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

export async function removeProgramCoordinator(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("program_coordinators").delete().eq("id", formData.get("id"));
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}