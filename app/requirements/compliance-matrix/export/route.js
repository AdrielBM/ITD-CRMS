import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";

const WORKFLOW_STEPS = ["Coordinator", "Records", "Secretary", "Chair"];

function csvEscape(val) {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUserAccess(supabase);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("id, name, academic_years ( label )")
    .eq("is_active", true)
    .single();

  if (!activeSemester) return new Response("No active semester", { status: 400 });

  const { data: instances } = await supabase
    .from("requirement_instances")
    .select("id, requirement_templates ( id, name, category_id, requirement_categories ( id, name ) )")
    .eq("semester_id", activeSemester.id);

  const sortedInstances = [...(instances ?? [])].sort((a, b) => {
    const catA = a.requirement_templates?.requirement_categories?.id ?? 0;
    const catB = b.requirement_templates?.requirement_categories?.id ?? 0;
    if (catA !== catB) return catA - catB;
    return (a.requirement_templates?.id ?? 0) - (b.requirement_templates?.id ?? 0);
  });

  const { data: faculty } = await supabase
    .from("users")
    .select("id, full_name")
    .order("full_name");

  const instanceIds = sortedInstances.map((i) => i.id);

  const { data: assignments } = instanceIds.length
    ? await supabase
        .from("assignments")
        .select("requirement_instance_id, faculty_id, submissions ( id, status, current_step, updated_at )")
        .in("requirement_instance_id", instanceIds)
        .not("faculty_id", "is", null)
    : { data: [] };

  const submissionMap = {};
  for (const a of assignments ?? []) {
    submissionMap[`${a.faculty_id}-${a.requirement_instance_id}`] = a.submissions?.[0] ?? null;
  }

  // Build CSV
  const headers = ["Faculty"];
  for (const inst of sortedInstances) {
    headers.push(inst.requirement_templates?.name ?? `Instance #${inst.id}`);
  }

  const rows = [headers.map(csvEscape).join(",")];
  for (const f of faculty ?? []) {
    const row = [csvEscape(f.full_name)];
    for (const inst of sortedInstances) {
      const sub = submissionMap[`${f.id}-${inst.id}`];
      if (!sub) {
        row.push("N/A");
      } else {
        let label = sub.status;
        if (sub.status === "submitted") {
          const step = sub.current_step < 4 ? WORKFLOW_STEPS[sub.current_step] : "";
          label = `Under Review@${step}`;
        } else if (sub.status === "draft") label = "Pending";
        else if (sub.status === "needs_revision") label = "Returned";
        else if (sub.status === "completed") label = "Approved";
        row.push(label);
      }
    }
    rows.push(row.map(csvEscape).join(","));
  }

  const semesterLabel = `${activeSemester.academic_years?.label ?? ""} ${activeSemester.name}`;
  const filename = `compliance-matrix-${semesterLabel.replace(/\s+/g, "_")}.csv`;

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
