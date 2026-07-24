import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import ChairDashboard from "@/components/dashboard/ChairDashboard";
import SecretaryDashboard from "@/components/dashboard/SecretaryDashboard";
import RecordsDashboard from "@/components/dashboard/RecordsDashboard";
import CoordinatorDashboard from "@/components/dashboard/CoordinatorDashboard";
import FacultyDashboard from "@/components/dashboard/FacultyDashboard";

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { user, role, roles, profile, error } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");

  const isChair = roles.includes("Chair");
  const isSecretary = roles.includes("Secretary");
  const isRecords = roles.includes("Records");
  const isCoordinator = roles.includes("Coordinator");
  const isFaculty = roles.includes("Faculty");
  const isOrgLeader = roles.includes("Student Org Leader");

  const [{ data: activeSemester }, { data: coordinatorPrograms }, { count: organizationCount }] =
    await Promise.all([
      supabase
        .from("semesters")
        .select("id, name, academic_years ( label )")
        .eq("is_active", true)
        .maybeSingle(),
      isCoordinator
        ? supabase
            .from("program_coordinators")
            .select("program_id")
            .eq("user_id", user.id)
        : { data: [] },
      supabase.from("organizations").select("id", { count: "exact", head: true }),
    ]);

  const coordinatorProgramIds = (coordinatorPrograms ?? []).map((pc: any) => pc.program_id).filter(Boolean);
  const isDepartmentWide = (coordinatorPrograms ?? []).some((pc: any) => pc.program_id === null);

  // Faculty query — scoped if coordinator has specific programs
  let facultyQuery: any = supabase
    .from("users")
    .select("id, roles!role_id!inner(name)", { count: "exact", head: true })
    .eq("roles.name", "Faculty");

  if (isCoordinator && coordinatorProgramIds.length > 0 && !isDepartmentWide) {
    const { data: scopedFaculty } = await supabase
      .from("faculty_profiles")
      .select("user_id")
      .in("program_id", coordinatorProgramIds);
    const scopedIds = (scopedFaculty ?? []).map((f: any) => f.user_id);
    if (scopedIds.length > 0) {
      facultyQuery = facultyQuery.in("id", scopedIds);
    } else {
      facultyQuery = facultyQuery.in("id", []);
    }
  }

  const { count: facultyCount } = await facultyQuery;

  const activeSemesterLabel = activeSemester
    ? `${activeSemester.academic_years?.[0]?.label ?? ""} · ${activeSemester.name}`
    : null;

  const { data: instances } = activeSemester
    ? await supabase
        .from("requirement_instances")
        .select("id, due_date, requirement_templates ( name, requirement_categories ( name ) )")
        .eq("semester_id", activeSemester.id)
    : { data: [] };

  const instanceList = instances ?? [];
  const instanceIds = instanceList.map((i: any) => i.id);

  const { count: assignmentCount } = instanceIds.length
    ? await supabase
        .from("assignments")
        .select("id", { count: "exact", head: true })
        .in("requirement_instance_id", instanceIds)
    : { count: 0 };

  // Build dashboard sections for all user roles
  const sections: React.ReactNode[] = [];

  if (isChair) {
    const { data: recentUsers } = await supabase
      .from("users")
      .select("id, full_name, roles!role_id ( name )")
      .order("created_at", { ascending: false })
      .limit(5);

    const { count: pendingChair } = activeSemester
      ? await supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted")
          .eq("current_step", 3)
      : { count: 0 };

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

    const catMap: Record<string, { name: string; completed: number; submitted: number; needs_revision: number; draft: number; total: number }> = {};
    for (const inst of catStats ?? []) {
      const cat = inst.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
      for (const asgn of inst.assignments ?? []) {
        if (!catMap[cat]) catMap[cat] = { name: cat, completed: 0, submitted: 0, needs_revision: 0, draft: 0, total: 0 };
        catMap[cat].total++;
      }
    }
    const assignmentIdsAll = (catStats ?? []).flatMap((i: any) => (i.assignments ?? []).map((a: any) => a.id));
    if (assignmentIdsAll.length) {
      const { data: allStatuses } = await supabase
        .from("submissions")
        .select("assignment_id, status")
        .in("assignment_id", assignmentIdsAll);
      for (const s of allStatuses ?? []) {
        for (const inst of catStats ?? []) {
          const asgnIds = (inst.assignments ?? []).map((a: any) => a.id);
          if (asgnIds.includes(s.assignment_id)) {
            const cat = inst.requirement_templates?.requirement_categories?.name ?? "Uncategorized";
            if (catMap[cat] && catMap[cat][s.status as keyof typeof catMap[string]] !== undefined) (catMap[cat] as any)[s.status]++;
          }
        }
      }
    }
    const categoryData = Object.values(catMap);

    sections.push(<ChairDashboard key="chair" activeSemesterLabel={activeSemesterLabel} facultyCount={facultyCount ?? 0} organizationCount={organizationCount ?? 0} instanceCount={instanceList.length} assignmentCount={assignmentCount ?? 0} recentUsers={recentUsers ?? []} pendingChair={pendingChair ?? 0} categoryData={categoryData} />);
  }

  if (isSecretary) {
    const upcomingInstances = instanceList.filter((i: any) => {
      const left = daysUntil(i.due_date);
      return left !== null && left >= 0 && left <= 14;
    });
    const overdueCount = instanceList.filter((i: any) => {
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

    sections.push(<SecretaryDashboard key="secretary" activeSemesterLabel={activeSemesterLabel} facultyCount={facultyCount ?? 0} organizationCount={organizationCount ?? 0} upcomingInstances={upcomingInstances} overdueCount={overdueCount} pendingSecretary={pendingSecretary ?? 0} />);
  }

  if (isRecords) {
    const { count: pendingRecords } = activeSemester
      ? await supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted")
          .eq("current_step", 1)
      : { count: 0 };

    sections.push(<RecordsDashboard key="records" activeSemesterLabel={activeSemesterLabel} assignmentCount={assignmentCount ?? 0} instances={instanceList} pendingRecords={pendingRecords ?? 0} />);
  }

  if (isCoordinator) {
    let pendingQuery: any = supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted")
      .eq("current_step", 0);

    if (coordinatorProgramIds.length > 0 && !isDepartmentWide) {
      const { data: scopedFaculty } = await supabase
        .from("faculty_profiles")
        .select("user_id")
        .in("program_id", coordinatorProgramIds);
      const scopedIds = (scopedFaculty ?? []).map((f: any) => f.user_id);
      if (scopedIds.length > 0) {
        pendingQuery = pendingQuery.in("faculty_id", scopedIds);
      } else {
        pendingQuery = pendingQuery.in("faculty_id", []);
      }
    }

    const { count: pendingCoordinator } = activeSemester
      ? await pendingQuery
      : { count: 0 };

    sections.push(<CoordinatorDashboard key="coordinator" activeSemesterLabel={activeSemesterLabel} facultyCount={facultyCount ?? 0} instances={instanceList} pendingCoordinator={pendingCoordinator ?? 0} coordinatorProgramIds={coordinatorProgramIds} isDepartmentWide={isDepartmentWide} />);
  }

  if (isFaculty || isOrgLeader) {
    const { data: myAssignments } = instanceIds.length
      ? await supabase
          .from("assignments")
          .select(
            "id, requirement_instances ( due_date, requirement_templates ( name, requirement_categories ( name ) ) )"
          )
          .or(`faculty_id.eq.${user.id},organization_id.not.is.null`)
          .in("requirement_instance_id", instanceIds)
      : { data: [] };

    const assignmentIds = (myAssignments ?? []).map((a: any) => a.id);
    const { data: submissionStatuses } = assignmentIds.length
      ? await supabase
          .from("submissions")
          .select("assignment_id, status, current_step")
          .in("assignment_id", assignmentIds)
      : { data: [] };

    const statusMap: Record<string, any> = {};
    for (const s of submissionStatuses ?? []) statusMap[s.assignment_id] = s;

    const completedCount = (myAssignments ?? []).filter(
      (a: any) => statusMap[a.id]?.status === "completed"
    ).length;
    const returnedCount = (myAssignments ?? []).filter(
      (a: any) => statusMap[a.id]?.status === "needs_revision"
    ).length;

    sections.push(<FacultyDashboard key="faculty" activeSemesterLabel={activeSemesterLabel} myAssignments={myAssignments ?? []} submissionStatuses={submissionStatuses ?? []} completedCount={completedCount} returnedCount={returnedCount} />);
  }

  // Determine display role label
  const displayRole = roles.length > 0 ? roles.join(", ") : null;

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>{displayRole ? `Signed in as ${displayRole}` : "No role assigned yet"}</p>
      </div>
      <div className="page-body">
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 14, fontSize: 14, color: "#dc2626", marginBottom: 20 }}>
            Role lookup error: {error}
          </div>
        )}
        {roles.length === 0 && !error && (
          <div className="card" style={{ textAlign: "center", color: "#9ca3af" }}>
            Your account has no role assigned yet. Ask the Department Chair to set one.
          </div>
        )}
        {sections.length === 0 && roles.length > 0 && (
          <div className="card" style={{ textAlign: "center", color: "#9ca3af" }}>
            No dashboard data available for your roles.
          </div>
        )}
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            {section}
          </div>
        ))}
      </div>
    </AppShell>
  );
}