"use client";

import { useState, type FC } from "react";
import SubmissionDetailModal from "@/components/SubmissionDetailModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Submission = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Faculty = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CategoryGroup = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instance = any;

interface ModalState {
  submission: Submission;
  facultyName: string;
  requirementName: string;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faculty: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortedInstances: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissionMap: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categoryGroups: any[];
}

const STATUS_CONFIG: Record<string, { class: string; label: string }> = {
  draft: { class: "badge badge-gray", label: "Pending" },
  submitted: { class: "badge badge-blue", label: "Under Review" },
  needs_revision: { class: "badge badge-red", label: "Returned" },
  completed: { class: "badge badge-green", label: "Approved" },
};

const WORKFLOW_LABELS = ["IT / CS Coordinator", "Records", "Secretary", "Chair"];

const MatrixTable: FC<Props> = ({ faculty, sortedInstances, submissionMap, categoryGroups }) => {
  const [modal, setModal] = useState<ModalState | null>(null);

  return (
    <>
      <div className="table-wrap" style={{ overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, background: "#f9fafb", zIndex: 10, minWidth: 180 }}>Name of Faculty</th>
              {categoryGroups.map((g: any) => (
                <th key={g.name} colSpan={g.instances.length} style={{ textAlign: "center", background: "#f3f4f6", color: "#374151", fontSize: 12, borderLeft: "2px solid #e5e7eb" }}>
                  {g.name}
                </th>
              ))}
            </tr>
            <tr>
              {categoryGroups.map((g: any) =>
                g.instances.map((inst: any, idx: number) => (
                  <th key={inst.id} style={{ minWidth: 130, fontWeight: 500, fontSize: 12, color: "#6b7280", borderLeft: idx === 0 ? "2px solid #e5e7eb" : undefined }}>
                    {inst.requirement_templates?.name}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {(faculty ?? []).map((f: any) => (
              <tr key={f.id}>
                <td style={{ position: "sticky", left: 0, background: "white", zIndex: 5, fontWeight: 500, borderRight: "1px solid #e5e7eb" }}>
                  {f.full_name}
                </td>
                {sortedInstances.map((inst: any) => {
                  const sub = submissionMap[`${f.id}-${inst.id}`];
                  if (!sub) return <td key={inst.id} style={{ cursor: "default" }}><span className="badge badge-gray" style={{ opacity: 0.4 }}>N/A</span></td>;

                  const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.draft;
                  const step = sub.current_step < 4 ? WORKFLOW_LABELS[sub.current_step] : null;

                  return (
                    <td
                      key={inst.id}
                      onClick={() => setModal({ submission: sub, facultyName: f.full_name, requirementName: inst.requirement_templates?.name })}
                      style={{ cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { if (sub) e.currentTarget.style.background = "#f3f4f6"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span className={cfg.class}>{cfg.label}</span>
                        {sub.status === "submitted" && step && (
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>@{step}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <SubmissionDetailModal
          submission={modal.submission}
          facultyName={modal.facultyName}
          requirementName={modal.requirementName}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
};

export default MatrixTable;