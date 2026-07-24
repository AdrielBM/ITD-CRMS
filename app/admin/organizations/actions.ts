"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export async function getOrganizations() {
  const supabase = await createClient();
  const { roles } = await getCurrentUserAccess(supabase);
  if (!roles.includes("Chair")) throw new Error("Unauthorized");

  const { data: orgs } = await supabase
    .from("organizations")
    .select("*, program:programs!program_id(name), leader:users!org_leader_id(id, email, full_name)")
    .order("name");

  const { data: programs } = await supabase.from("programs").select("id, name").order("name");

  const { data: leaders } = await supabase
    .from("users")
    .select("id, email, full_name, user_roles!inner(role:roles!role_id(name))")
    .eq("user_roles.role.name", "Student Org Leader");

  return { orgs, programs, leaders };
}

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();
  const { roles } = await getCurrentUserAccess(supabase);
  if (!roles.includes("Chair")) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const acronym = (formData.get("acronym") as string) || null;
  const programId = formData.get("program_id") ? Number(formData.get("program_id")) : null;

  const { error } = await supabase.from("organizations").insert({ name, acronym, program_id: programId });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/organizations");
}

export async function updateOrganization(formData: FormData) {
  const supabase = await createClient();
  const { roles } = await getCurrentUserAccess(supabase);
  if (!roles.includes("Chair")) throw new Error("Unauthorized");

  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const acronym = (formData.get("acronym") as string) || null;
  const programId = formData.get("program_id") ? Number(formData.get("program_id")) : null;
  const orgLeaderId = (formData.get("org_leader_id") as string) || null;

  const { error } = await supabase
    .from("organizations")
    .update({ name, acronym, program_id: programId, org_leader_id: orgLeaderId })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/organizations");
}

export async function deleteOrganization(formData: FormData) {
  const supabase = await createClient();
  const { roles } = await getCurrentUserAccess(supabase);
  if (!roles.includes("Chair")) throw new Error("Unauthorized");
  const id = Number(formData.get("id"));

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/organizations");
}