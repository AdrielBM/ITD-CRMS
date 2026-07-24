"use client";

import { useEffect, useState } from "react";
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from "./actions";

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrganizations().then((data) => {
      if (!data) return;
      setOrgs(data.orgs ?? []);
      setPrograms(data.programs ?? []);
      setLeaders(data.leaders ?? []);
    }).catch((e: Error) => setError(e.message));
  }, []);

  async function refetch() {
    const data = await getOrganizations();
    if (!data) return;
    setOrgs(data.orgs ?? []);
    setPrograms(data.programs ?? []);
    setLeaders(data.leaders ?? []);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await createOrganization(new FormData(e.target as HTMLFormElement));
      e.currentTarget.reset();
      await refetch();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await updateOrganization(new FormData(e.target as HTMLFormElement));
      setEditingId(null);
      await refetch();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this organization?")) return;
    try {
      const fd = new FormData();
      fd.set("id", String(id));
      await deleteOrganization(fd);
      await refetch();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Organizations</h1>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Add Organization</h2>
        <form onSubmit={handleCreate} className="system-form" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label className="form-label">Name</label>
            <input name="name" required className="system-input" />
          </div>
          <div>
            <label className="form-label">Acronym</label>
            <input name="acronym" className="system-input" style={{ width: 100 }} />
          </div>
          <div>
            <label className="form-label">Program</label>
            <select name="program_id" className="system-input">
              <option value="">None</option>
              {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>

      <div className="card">
        <table className="system-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Acronym</th>
              <th>Program</th>
              <th>Org Leader</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org: any) =>
              editingId === org.id ? (
                <tr key={org.id}>
                  <td colSpan={5}>
                    <form onSubmit={handleUpdate} className="system-form" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <input type="hidden" name="id" value={org.id} />
                      <div>
                        <label className="form-label">Name</label>
                        <input name="name" defaultValue={org.name} required className="system-input" />
                      </div>
                      <div>
                        <label className="form-label">Acronym</label>
                        <input name="acronym" defaultValue={org.acronym ?? ""} className="system-input" style={{ width: 100 }} />
                      </div>
                      <div>
                        <label className="form-label">Program</label>
                        <select name="program_id" defaultValue={org.program_id ?? ""} className="system-input">
                          <option value="">None</option>
                          {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Org Leader</label>
                        <select name="org_leader_id" defaultValue={org.org_leader_id ?? ""} className="system-input">
                          <option value="">None</option>
                          {leaders.map((l: any) => <option key={l.id} value={l.id}>{l.full_name ?? l.email}</option>)}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm">Save</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={org.id}>
                  <td>{org.name}</td>
                  <td>{org.acronym ?? "\u2014"}</td>
                  <td>{org.program?.name ?? "\u2014"}</td>
                  <td>{org.leader?.full_name ?? org.leader?.email ?? "\u2014"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(org.id)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(org.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}