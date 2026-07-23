import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import ChairDashboard from "@/components/dashboard/ChairDashboard";
import SecretaryDashboard from "@/components/dashboard/SecretaryDashboard";
import RecordsDashboard from "@/components/dashboard/RecordsDashboard";
import CoordinatorDashboard from "@/components/dashboard/CoordinatorDashboard";
import FacultyDashboard from "@/components/dashboard/FacultyDashboard";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(new Date().toDateString());
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { user, role, profile, error } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const [{ data: activeSemester }, { count: facultyCount }, { count: organizationCount }] =
    await Promise.all([
      supabase
        .from("semesters")
        .select("id, name, academic_years ( label )")
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("users")
        .select("id, roles!inner(name)", { count: "exact", head: true })
        .eq("roles.name", "Faculty"),
      supabase.from("organizations").select("id", { count: "exact", head: true }),
    ]);

  const activeSemesterLabel = activeSemester
    ? `${activeSemester.academic_years?.label ?? ""} · ${activeSemester.name}`
    : null;

  const { data: instances } = activeSemester
    ? await supabase
        .from("requirement_instances")
        .select("id, due_date, requirement_templates ( name, requirement_categories ( name ) )")
        .eq("semester_id", activeSemester.id)
    : { data: [] };

  const instanceList = instances ?? [];
  const instanceIds = instanceList.map((i) => i.id);

  const { count: assignmentCount } = instanceIds.length
    ? await supabase
        .from("assignments")
        .select("id", { count: "exact", head: true })
        .in("requirement_instance_id", instanceIds)
    : { count: 0 };

  let content = null;

  if (role === "Chair") {
    const { data: recentUsers } = await supabase
      .from("users")
      .select("id, full_name, roles ( name )")
      .order("created_at", { ascending: false })
      .limit(5);

    const { count: pendingChair } = activeSemester
      ? await supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted")
          .eq("current_step", 3)
      : { count: 0 };

    // Analytics: submissions per category by status
    const { data: catStats } = instanceIds.length
      ? await supabase
          .from("requirement_instances")
          .select(`
            id,
            requirement_templates!inner ( requirement_categories ( name ) ),
            assignments!inner ( id )
          `)
          .in("id", instanceIds)
      : { data: [] };

    const catMap = {};
    for (const inst of catStats ?? []) {
      const cat = inst.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
      for (const asgn of inst.assignments ?? []) {
        if (!catMap[cat]) catMap[cat] = { name: cat, completed: 0, submitted: 0, needs_revision: 0, draft: 0, total: 0 };
        catMap[cat].total++;
      }
    }
    const assignmentIdsAll = (catStats ?? []).flatMap((i) => (i.assignments ?? []).map((a) => a.id));
    if (assignmentIdsAll.length) {
      const { data: allStatuses } = await supabase
        .from("submissions")
        .select("assignment_id, status")
        .in("assignment_id", assignmentIdsAll);
      for (const s of allStatuses ?? []) {
        for (const inst of catStats ?? []) {
          const asgnIds = (inst.assignments ?? []).map((a) => a.id);
          if (asgnIds.includes(s.assignment_id)) {
            const cat = inst.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
            if (catMap[cat] && catMap[cat][s.status] !== undefined) catMap[cat][s.status]++;
          }
        }
      }
    }
    const categoryData = Object.values(catMap);

    content = (
      <ChairDashboard
        activeSemesterLabel={activeSemesterLabel}
        facultyCount={facultyCount ?? 0}
        organizationCount={organizationCount ?? 0}
        instanceCount={instanceList.length}
        assignmentCount={assignmentCount ?? 0}
        recentUsers={recentUsers ?? []}
        pendingChair={pendingChair ?? 0}
        categoryData={categoryData}
      />
    );
  } else if (role === "Secretary") {
    const upcomingInstances = instanceList.filter((i) => {
      const left = daysUntil(i.due_date);
      return left !== null && left >= 0 && left <= 14;
    });
    const overdueCount = instanceList.filter((i) => {
      const left = daysUntil(i.due_date);
      return left !== null && left < 0;
    }).length;

    const { count: pendingSecretary } = activeSemester
      ? await supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted")
          .eq("current_step", 2)
      : { count: 0 };

    content = (
      <SecretaryDashboard
        activeSemesterLabel={activeSemesterLabel}
        facultyCount={facultyCount ?? 0}
        organizationCount={organizationCount ?? 0}
        upcomingInstances={upcomingInstances}
        overdueCount={overdueCount}
        pendingSecretary={pendingSecretary ?? 0}
      />
    );
  } else if (role === "Records") {
    const { count: pendingRecords } = activeSemester
      ? await supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted")
          .eq("current_step", 1)
      : { count: 0 };

    content = (
      <RecordsDashboard
        activeSemesterLabel={activeSemesterLabel}
        assignmentCount={assignmentCount ?? 0}
        instances={instanceList}
        pendingRecords={pendingRecords ?? 0}
      />
    );
  } else if (role === "Coordinator") {
    const { count: pendingCoordinator } = activeSemester
      ? await supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted")
          .eq("current_step", 0)
      : { count: 0 };

    content = (
      <CoordinatorDashboard
        activeSemesterLabel={activeSemesterLabel}
        facultyCount={facultyCount ?? 0}
        instances={instanceList}
        pendingCoordinator={pendingCoordinator ?? 0}
      />
    );
  } else if (role === "Faculty") {
    const { data: myAssignments } = instanceIds.length
      ? await supabase
          .from("assignments")
          .select(
            "id, requirement_instances ( due_date, requirement_templates ( name, requirement_categories ( name ) ) )"
          )
          .eq("faculty_id", user.id)
          .in("requirement_instance_id", instanceIds)
      : { data: [] };

    const assignmentIds = (myAssignments ?? []).map((a) => a.id);
    const { data: submissionStatuses } = assignmentIds.length
      ? await supabase
          .from("submissions")
          .select("assignment_id, status, current_step")
          .in("assignment_id", assignmentIds)
      : { data: [] };

    const statusMap = {};
    for (const s of submissionStatuses ?? []) statusMap[s.assignment_id] = s;

    const completedCount = (myAssignments ?? []).filter(
      (a) => statusMap[a.id]?.status === "completed"
    ).length;
    const returnedCount = (myAssignments ?? []).filter(
      (a) => statusMap[a.id]?.status === "needs_revision"
    ).length;

    content = (
      <FacultyDashboard
        activeSemesterLabel={activeSemesterLabel}
        myAssignments={myAssignments ?? []}
        submissionStatuses={submissionStatuses ?? []}
        completedCount={completedCount}
        returnedCount={returnedCount}
      />
    );
  }

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} currentPath="/dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>{role ? `Signed in as ${role}` : "No role assigned yet"}</p>
      </div>
      <div className="page-body">
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 14, fontSize: 14, color: "#dc2626", marginBottom: 20 }}>
            Role lookup error: {error}
          </div>
        )}
        {!role && !error && (
          <div className="card" style={{ textAlign: "center", color: "#9ca3af" }}>
            Your account has no role assigned yet. Ask the Department Chair to set one.
          </div>
        )}
        {content}
      </div>
    </AppShell>
  );
}
