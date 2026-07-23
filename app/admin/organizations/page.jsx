"use client";

import { useEffect, useState } from "react";
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from "./actions";

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrganizations().then((data) => {
      if (!data) return;
      setOrgs(data.orgs ?? []);
      setPrograms(data.programs ?? []);
      setLeaders(data.leaders ?? []);
    }).catch((e) => setError(e.message));
  }, []);

  async function refetch() {
    const data = await getOrganizations();
    if (!data) return;
    setOrgs(data.orgs ?? []);
    setPrograms(data.programs ?? []);
    setLeaders(data.leaders ?? []);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createOrganization(new FormData(e.target));
      e.target.reset();
      await refetch();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await updateOrganization(new FormData(e.target));
      setEditingId(null);
      await refetch();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this organization?")) return;
    try {
      const fd = new FormData();
      fd.set("id", id);
      await deleteOrganization(fd);
      await refetch();
    } catch (e) {
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
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
            {orgs.map((org) =>
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
                          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Org Leader</label>
                        <select name="org_leader_id" defaultValue={org.org_leader_id ?? ""} className="system-input">
                          <option value="">None</option>
                          {leaders.map((l) => <option key={l.id} value={l.id}>{l.full_name ?? l.email}</option>)}
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
                  <td>{org.acronym ?? "—"}</td>
                  <td>{org.program?.name ?? "—"}</td>
                  <td>{org.leader?.full_name ?? org.leader?.email ?? "—"}</td>
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
