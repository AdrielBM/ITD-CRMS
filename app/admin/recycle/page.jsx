import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";
import AppShell from "@/components/AppShell";
import { restoreItem, permanentDelete } from "./actions";

const TABLES = [
  { name: "programs", label: "Programs" },
  { name: "academic_years", label: "Academic Years" },
  { name: "semesters", label: "Semesters" },
  { name: "requirement_categories", label: "Categories" },
  { name: "requirement_templates", label: "Templates" },
  { name: "requirement_instances", label: "Instances" },
  { name: "assignments", label: "Assignments" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getNameColumn(table) {
  switch (table) {
    case "programs": return "name";
    case "academic_years": return "label";
    case "semesters": return "name";
    case "requirement_categories": return "name";
    case "requirement_templates": return "name";
    case "requirement_instances": return "id";
    case "assignments": return "id";
    default: return "id";
  }
}

export default async function RecycleBinPage() {
  const supabase = await createClient();
  const { user, role, roles, profile } = await getCurrentUserAccess(supabase);
  if (!user) redirect("/login");
  if (!roles.includes("Chair")) redirect("/dashboard");

  const allItems = [];

  for (const t of TABLES) {
    const { data } = await supabase
      .from(t.name)
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(20);

    for (const item of data ?? []) {
      const nameCol = getNameColumn(t.name);
      allItems.push({
        table: t.name,
        tableLabel: t.label,
        id: item.id,
        name: item[nameCol] ?? `#${item.id}`,
        deletedAt: item.deleted_at,
      });
    }
  }

  allItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

  return (
    <AppShell fullName={profile?.full_name} email={user.email} role={role} roles={roles} currentPath="/admin/recycle">
      <div className="page-header">
        <h1>Recycle Bin</h1>
        <p>Recently deleted items — restore or permanently delete</p>
      </div>
      <div className="page-body">
        {allItems.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "#9ca3af", margin: 0 }}>The recycle bin is empty. Deleted items will appear here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name / Identifier</th>
                  <th>Deleted</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item, i) => (
                  <tr key={`${item.table}-${item.id}-${i}`}>
                    <td><span className="badge badge-gray">{item.tableLabel}</span></td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td style={{ fontSize: 13, color: "#6b7280" }}>{formatDate(item.deletedAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <form action={restoreItem}>
                          <input type="hidden" name="table" value={item.table} />
                          <input type="hidden" name="id" value={item.id} />
                          <button className="btn btn-sm btn-primary">Restore</button>
                        </form>
                        <form action={permanentDelete}>
                          <input type="hidden" name="table" value={item.table} />
                          <input type="hidden" name="id" value={item.id} />
                          <button className="btn btn-sm btn-danger">Delete forever</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
