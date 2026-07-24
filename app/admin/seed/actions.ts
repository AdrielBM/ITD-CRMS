"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const FACULTY = [
  "Dr. Michelle C. Tanega",
  "Dr. Angelito L. Catajan Jr.",
  "Prof. Jeffrey F. Papa",
  "Dr. Sherrlyn M. Rasdas",
  "Dr. Ricky Jay A. Riel",
  "Dr. Rossian V. Perea",
  "Mr. Henry R. Balanza",
  "Mr. Marc Luigi G. Timola",
  "Mr. Jomari M. Launio",
  "Ms. Flordeluna B. Merlan",
  "Ms. Arvel O. Himor",
  "Mr. Gabriel Christian D. Arcega",
  "Mr. Mac John T. Poblete",
  "Ms. Kimberly Rose P. Bautista",
  "Mr. Raven Dave R. Gallardo",
  "Ms. Dezza Anne A. Peregrina",
  "Mr. Gillian Kyle D. Catahan",
];

// Role assignments (primary role)
const ROLE_MAP: Record<string, string> = {
  "Dr. Michelle C. Tanega": "Chair",
  "Ms. Arvel O. Himor": "Secretary",
  "Ms. Dezza Anne A. Peregrina": "Records",
  "Mr. Raven Dave R. Gallardo": "Student Org Leader",
  "Mr. Gillian Kyle D. Catahan": "Student Org Leader",
  "Ms. Flordeluna B. Merlan": "Student Org Leader",
  "Dr. Angelito L. Catajan Jr.": "IT Coordinator",
  "Dr. Sherrlyn M. Rasdas": "CS Coordinator",
};

// Multi-role assignments (additional roles beyond primary)
const ROLE_ADDITIONS: Record<string, string[]> = {
  "Mr. Raven Dave R. Gallardo": ["Faculty"],
  "Mr. Gillian Kyle D. Catahan": ["Faculty"],
  "Ms. Flordeluna B. Merlan": ["Faculty"],
};

// Program assignments for faculty profiles
const PROGRAM_ASSIGNMENTS: Record<string, string> = {
  // BSIT faculty
  "Dr. Michelle C. Tanega": "BSIT",
  "Prof. Jeffrey F. Papa": "BSIT",
  "Dr. Ricky Jay A. Riel": "BSIT",
  "Mr. Henry R. Balanza": "BSIT",
  "Mr. Marc Luigi G. Timola": "BSIT",
  "Mr. Jomari M. Launio": "BSIT",
  "Ms. Flordeluna B. Merlan": "BSIT",
  "Mr. Raven Dave R. Gallardo": "BSIT",
  "Mr. Gillian Kyle D. Catahan": "BSIT",
  "Dr. Angelito L. Catajan Jr.": "BSIT",
  "Dr. Sherrlyn M. Rasdas": "BSIT",
  // BSCS faculty
  "Dr. Rossian V. Perea": "BSCS",
  "Ms. Arvel O. Himor": "BSCS",
  "Mr. Gabriel Christian D. Arcega": "BSCS",
  "Mr. Mac John T. Poblete": "BSCS",
  "Ms. Kimberly Rose P. Bautista": "BSCS",
  "Ms. Dezza Anne A. Peregrina": "BSCS",
};

const PROGRAMS = [
  { name: "Bachelor of Science in Information Technology", code: "BSIT" },
  { name: "Bachelor of Science in Computer Science", code: "BSCS" },
];

const CATEGORIES = [
  "Administrative Requirements",
  "Academic Requirements",
  "Research & Extension",
  "Student Development",
];

const TEMPLATES: Record<string, string[]> = {
  "Administrative Requirements": [
    "Faculty Loading & Assignment Form",
    "Certificate of Employment",
    "Service Record",
    "Performance Rating (IPCR)",
  ],
  "Academic Requirements": [
    "Course Syllabus (Latest OBE)",
    "Teaching & Learning Materials",
    "Class Record & Grading Sheets",
    "Assessment of Student Outcomes",
  ],
  "Research & Extension": [
    "Research Output / Publication",
    "Extension Program Report",
    "Community Involvement Report",
  ],
  "Student Development": [
    "Student Advising Record",
    "Co-Curricular Activity Report",
    "Student Organization Monitoring",
  ],
};

function makeEmail(name: string) {
  const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, "").toLowerCase().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1].replace(/\./g, "").replace(/[^\w]/g, "");
  return `${first}.${last}@itd-crms.edu.ph`;
}

function makePassword(name: string) {
  const last = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, "").split(/\s+/).pop()!.replace(/\./g, "").toLowerCase();
  return `Temp@${last}2026`;
}

export async function seedAll(): Promise<{ created: number; skipped: number; errors: string[] }> {
  const admin = createAdminClient();
  const supabase = await createClient();
  const results = { created: 0, skipped: 0, errors: [] as string[] };

  // --- 1. Programs ---
  for (const p of PROGRAMS) {
    const { data: existing } = await supabase.from("programs").select("id").eq("code", p.code).maybeSingle();
    if (!existing) {
      await supabase.from("programs").insert(p);
    }
  }

  // --- 2. Academic Year & Semester ---
  const { data: existingAy } = await supabase.from("academic_years").select("id").eq("label", "2025-2026").maybeSingle();
  let ayId = existingAy?.id;
  if (!ayId) {
    const { data } = await supabase.from("academic_years").insert({
      label: "2025-2026", start_date: "2025-08-01", end_date: "2026-07-31", is_active: true,
    }).select("id").single();
    ayId = data?.id;
  }

  if (ayId) {
    const { data: existingSem } = await supabase.from("semesters").select("id").eq("name", "First Semester").eq("academic_year_id", ayId).maybeSingle();
    if (!existingSem) {
      await supabase.from("semesters").insert({
        academic_year_id: ayId, name: "First Semester", is_active: true,
      });
    }
  }

  // --- 3. Requirement Categories ---
  const catIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const { data: existing } = await supabase.from("requirement_categories").select("id").eq("name", c).maybeSingle();
    if (existing) { catIds[c] = existing.id; continue; }
    const { data } = await supabase.from("requirement_categories").insert({ name: c }).select("id").single();
    if (data) catIds[c] = data.id;
  }

  // --- 4. Requirement Templates ---
  const tempIds: string[] = [];
  for (const [cat, templates] of Object.entries(TEMPLATES)) {
    for (const t of templates) {
      const { data: existing } = await supabase.from("requirement_templates").select("id").eq("name", t).maybeSingle();
      if (existing) { tempIds.push(existing.id); continue; }
      const { data } = await supabase.from("requirement_templates").insert({
        category_id: catIds[cat] || null, name: t, description: t, is_active: true,
      }).select("id").single();
      if (data) tempIds.push(data.id);
    }
  }

  // --- 5. Create Auth Users + Profiles ---
  const { data: roles } = await supabase.from("roles").select("id, name");

  const roleIdMap: Record<string, string> = {};
  for (const r of roles ?? []) roleIdMap[r.name] = r.id;

  // Map program codes to IDs
  const { data: progData } = await supabase.from("programs").select("id, code");
  const progIdMap: Record<string, string> = {};
  for (const p of progData ?? []) progIdMap[p.code] = p.id;

  for (const name of FACULTY) {
    const email = makeEmail(name);
    const password = makePassword(name);

    // Check if user already exists by email
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existingUser) { results.skipped++; continue; }

    try {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) { results.errors.push(`${name}: ${createError.message}`); continue; }

      const assignedRole = ROLE_MAP[name] || "Faculty";
      const roleId = roleIdMap[assignedRole];
      if (!roleId) { results.errors.push(`${name}: role "${assignedRole}" not found`); continue; }

      const { error: profileError } = await admin.from("users").insert({
        id: created.user.id, email, full_name: name, role_id: roleId,
      });

      if (profileError) { results.errors.push(`${name} profile: ${profileError.message}`); continue; }

      // Create faculty_profiles with program assignment
      const progCode = PROGRAM_ASSIGNMENTS[name];
      const progId = progCode ? progIdMap[progCode] : null;
      if (progId) {
        await supabase.from("faculty_profiles").upsert({
          user_id: created.user.id,
          program_id: progId,
        }).maybeSingle();
      }

      // Add multi-role assignments
      const extraRoles = ROLE_ADDITIONS[name] ?? [];
      for (const rName of extraRoles) {
        const rId = roleIdMap[rName];
        if (rId) {
          await supabase.from("user_roles").upsert({
            user_id: created.user.id,
            role_id: rId,
          }).maybeSingle();
        }
      }

      results.created++;
    } catch (err: any) {
      results.errors.push(`${name}: ${err.message}`);
    }
  }

  // --- 6. Organizations & Org Leaders ---
  const orgs = [
    { name: "IT Society", acronym: "ITS" },
    { name: "Computer Science Guild", acronym: "CSG" },
    { name: "Junior Philippine Computing Society", acronym: "JPCS" },
  ];
  const createdOrgs: any[] = [];
  for (const o of orgs) {
    const { data: existing } = await supabase.from("organizations").select("id").eq("acronym", o.acronym).maybeSingle();
    if (existing) {
      createdOrgs.push(existing);
    } else {
      const { data: ins } = await supabase.from("organizations").insert(o).select("id").single();
      if (ins) createdOrgs.push(ins);
    }
  }

  // Assign org_leader_id for Student Org Leaders
  const orgLeaderMap: Record<string, string> = {
    "IT Society": "Mr. Raven Dave R. Gallardo",
    "Computer Science Guild": "Mr. Gillian Kyle D. Catahan",
    "Junior Philippine Computing Society": "Ms. Flordeluna B. Merlan",
  };
  for (const org of createdOrgs) {
    const leaderName = orgLeaderMap[org.name];
    if (!leaderName) continue;
    const { data: leaderUser } = await supabase.from("users").select("id").eq("full_name", leaderName).maybeSingle();
    if (leaderUser) {
      await supabase.from("organizations").update({ org_leader_id: leaderUser.id }).eq("id", org.id);
    }
  }

  // --- 7. Requirement Instances & Assignments ---
  const { data: activeSem } = await supabase.from("semesters").select("id").eq("is_active", true).maybeSingle();
  if (activeSem && tempIds.length > 0) {
    const { data: facultyUsers } = await supabase.from("users").select("id").in("full_name", FACULTY);

    const { data: existingInsts } = await supabase
      .from("requirement_instances")
      .select("requirement_template_id")
      .eq("semester_id", activeSem.id);

    const existingTemplateIds = new Set((existingInsts ?? []).map((i: any) => i.requirement_template_id));

    for (const tid of tempIds) {
      if (existingTemplateIds.has(tid)) continue;
      const { data: inst } = await supabase.from("requirement_instances").insert({
        semester_id: activeSem.id, requirement_template_id: tid, due_date: "2026-05-30",
      }).select("id").single();

      if (inst && facultyUsers) {
        for (const f of facultyUsers) {
          const { data: existingAsgn } = await supabase
            .from("assignments")
            .select("id")
            .eq("requirement_instance_id", inst.id)
            .eq("faculty_id", f.id)
            .maybeSingle();
          if (!existingAsgn) {
            await supabase.from("assignments").insert({
              requirement_instance_id: inst.id, faculty_id: f.id,
            });
          }
        }
      }
    }
  }

  // --- 8. Program Coordinators ---
  const coordinatorAssignments = [
    { name: "Dr. Angelito L. Catajan Jr.", programCode: "BSIT" },
    { name: "Dr. Sherrlyn M. Rasdas", programCode: "BSCS" },
  ];
  for (const ca of coordinatorAssignments) {
    const { data: coordUser } = await supabase.from("users").select("id").eq("full_name", ca.name).maybeSingle();
    if (!coordUser) continue;
    const pId = progIdMap[ca.programCode];
    if (!pId) continue;
    const { data: existingC } = await supabase
      .from("program_coordinators")
      .select("id")
      .eq("user_id", coordUser.id)
      .eq("program_id", pId)
      .maybeSingle();
    if (!existingC) {
      await supabase.from("program_coordinators").insert({ user_id: coordUser.id, program_id: pId });
    }
  }

  revalidatePath("/admin/seed");
  return results;
}