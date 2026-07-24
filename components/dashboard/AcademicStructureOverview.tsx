"use client";

import { useState, type FC } from "react";
import { ChevronDown, ChevronRight, Building2, Calendar, Layers } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Program = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AcademicYear = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Semester = any;

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  programs: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  academicYears: any[];
}

const AcademicStructureOverview: FC<Props> = ({ programs, academicYears }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!programs?.length && !academicYears?.length) {
    return <p style={{ color: "#9ca3af", fontSize: 14 }}>No academic structure configured yet.</p>;
  }

  return (
    <div style={{ fontSize: 14 }}>
      {/* Programs */}
      {programs?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Building2 size={16} /> Programs
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {programs.map((p: Program) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f9fafb", borderRadius: 6 }}>
                <span style={{ fontWeight: 600, color: "#1f2937", fontSize: 13 }}>{p.code}</span>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>{p.name}</span>
                <span className="badge badge-blue" style={{ marginLeft: "auto", fontSize: 11 }}>
                  {p.faculty_count ?? 0} faculty
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Academic Years & Semesters */}
      {academicYears?.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={16} /> Academic Years & Semesters
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {academicYears.map((ay: AcademicYear) => (
              <div key={ay.id}>
                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [ay.id]: !prev[ay.id] }))}
                  style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "6px 10px", background: expanded[ay.id] ? "#f3f4f6" : "#f9fafb", borderRadius: 6, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: 13 }}
                >
                  {expanded[ay.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span style={{ fontWeight: 600, color: "#1f2937" }}>{ay.label}</span>
                  {ay.is_active && <span className="badge badge-green" style={{ fontSize: 10 }}>Active</span>}
                  <span style={{ color: "#9ca3af", marginLeft: "auto", fontSize: 12 }}>{ay.semesters?.length ?? 0} semesters</span>
                </button>
                {expanded[ay.id] && ay.semesters?.length > 0 && (
                  <div style={{ marginLeft: 24, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                    {ay.semesters.map((sem: Semester) => (
                      <div key={sem.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#f9fafb", borderRadius: 6, fontSize: 12 }}>
                        <Layers size={14} style={{ color: "#9ca3af" }} />
                        <span style={{ color: "#374151" }}>{sem.name}</span>
                        {sem.is_active && <span className="badge badge-green" style={{ fontSize: 10 }}>Active</span>}
                        <span style={{ color: "#9ca3af", marginLeft: "auto" }}>{sem.instance_count ?? 0} requirement instances</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicStructureOverview;