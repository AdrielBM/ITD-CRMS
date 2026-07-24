"use client";

import { useEffect, useState, type FC } from "react";
import { X } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Submission = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Approval = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Version = any;

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submission: any;
  facultyName: string;
  requirementName: string;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Pending",
  submitted: "Under Review",
  needs_revision: "Returned",
  completed: "Approved",
};

const WORKFLOW_LABELS = ["IT / CS Coordinator", "Records", "Secretary", "Chair"];

const SubmissionDetailModal: FC<Props> = ({ submission, facultyName, requirementName, onClose }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    if (!submission) return;
    fetch(`/api/submission-detail?id=${submission.id}`)
      .then((r) => r.json())
      .then((d: { versions?: Version[]; approvals?: Approval[] }) => {
        setVersions(d.versions ?? []);
        setApprovals(d.approvals ?? []);
      })
      .catch(() => {});
  }, [submission]);

  if (!submission) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 16, maxWidth: 600, width: "100%",
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
          position: "sticky", top: 0, background: "white", zIndex: 10,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{requirementName}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{facultyName}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Status badge */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</span>
            <div style={{ marginTop: 6 }}>
              <span className={`badge ${submission.status === "completed" ? "badge-green" : submission.status === "needs_revision" ? "badge-red" : submission.status === "submitted" ? "badge-blue" : "badge-gray"}`}>
                {STATUS_LABEL[submission.status] ?? submission.status}
              </span>
              {submission.status === "submitted" && submission.current_step < 4 && (
                <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>
                  @ {WORKFLOW_LABELS[submission.current_step]}
                </span>
              )}
            </div>
          </div>

          {/* Approval History */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Approval History</span>
            {approvals.length === 0 ? (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9ca3af" }}>No approvals yet.</p>
            ) : (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {approvals.map((a, i) => (
                  <div key={a.id ?? i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, fontSize: 13 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: a.status === "approved" ? "#16a34a" : "#dc2626" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: "#374151" }}>{a.step_role ?? a.step_number ? `Step ${a.step_number}` : "Review"}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        {a.status === "approved" ? "Approved" : "Returned"}
                        {a.created_at ? ` · ${new Date(a.created_at).toLocaleDateString()}` : ""}
                      </div>
                      {a.remarks && <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2, fontStyle: "italic" }}>&ldquo;{a.remarks}&rdquo;</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revision History */}
          <div>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Revision History</span>
            {versions.length === 0 ? (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9ca3af" }}>No revisions yet.</p>
            ) : (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {versions.map((v, i) => (
                  <div key={v.id ?? i} style={{ padding: "8px 12px", background: "#f9fafb", borderRadius: 8, fontSize: 13 }}>
                    <div style={{ fontWeight: 500, color: "#374151" }}>v{v.version_number}</div>
                    {v.notes && <div style={{ color: "#6b7280", fontSize: 12 }}>{v.notes}</div>}
                    <div style={{ color: "#9ca3af", fontSize: 11 }}>{v.created_at ? new Date(v.created_at).toLocaleDateString() : ""}</div>
                    {v.submission_files?.length > 0 && (
                      <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {v.submission_files.map((f: any) => (
                          <span key={f.id} className="badge badge-gray" style={{ fontSize: 11 }}>{f.file_name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailModal;