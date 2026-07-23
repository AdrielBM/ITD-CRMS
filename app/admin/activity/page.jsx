import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ActivityLogPage({ searchParams }) {
  const supabase = await createClient();
  const { user, role, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");
  if (role !== "Chair") redirect("/dashboard");

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const perPage = 30;

  const { data: approvals, count } = await supabase
    .from("approvals")
    .select(`
      id, step_number, step_role, status, remarks, created_at,
      submissions!inner (
        id,
        assignments!inner ( faculty_id )
      ),
      reviewer_id
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const reviewerIds = [...new Set((approvals ?? []).map((a) => a.reviewer_id))];
  const facultyIds = [...new Set((approvals ?? []).map((a) => a.submissions?.assignments?.faculty_id).filter(Boolean))];
  const allUserIds = [...new Set([...reviewerIds, ...facultyIds])];

  const { data: users } = allUserIds.length
    ? await supabase.from("users").select("id, full_name").in("id", allUserIds)
    : { data: [] };

  const userMap = {};
  for (const u of users ?? []) userMap[u.id] = u.full_name;

  const totalPages = Math.ceil((count ?? 0) / perPage);

  const STEP_LABELS = ["Coordinator", "Records", "Secretary", "Chair"];

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} currentPath="/admin/activity">
      <div className="page-header">
        <h1>Activity Log</h1>
        <p>Audit trail of all approval and rejection actions</p>
      </div>
      <div className="page-body">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Submission ID</th>
                <th>Faculty</th>
                <th>Step</th>
                <th>Reviewer</th>
                <th>Action</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {(approvals ?? []).length === 0 && (
                <tr><td colSpan={7} className="empty-state">No approval actions recorded yet.</td></tr>
              )}
              {(approvals ?? []).map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: 13, color: "#6b7280" }}>
                    {formatDate(a.created_at)}
                  </td>
                  <td style={{ fontWeight: 500 }}>#{a.submissions?.id}</td>
                  <td>{userMap[a.submissions?.assignments?.faculty_id] ?? "—"}</td>
                  <td><span className="badge badge-blue">{STEP_LABELS[a.step_number] ?? a.step_role}</span></td>
                  <td>{userMap[a.reviewer_id] ?? "—"}</td>
                  <td>
                    {a.status === "approved" ? (
                      <span className="badge badge-green">Approved</span>
                    ) : (
                      <span className="badge badge-red">Rejected</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.remarks || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20, alignItems: "center" }}>
            {page > 1 && (
              <a href={`/admin/activity?page=${page - 1}`} className="btn btn-outline btn-sm">Previous</a>
            )}
            <span style={{ fontSize: 14, color: "#6b7280" }}>Page {page} of {totalPages}</span>
            {page < totalPages && (
              <a href={`/admin/activity?page=${page + 1}`} className="btn btn-outline btn-sm">Next</a>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
