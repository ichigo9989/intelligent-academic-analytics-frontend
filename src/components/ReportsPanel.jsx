import { useState } from "react";

function safeCsvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportsPanel({ apiBaseUrl, token }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function fetchJson(path) {
    const response = await fetch(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || result.message || `Report request failed (${response.status}).`);
    return result;
  }

  async function exportReport(type) {
    setBusy(type);
    setError("");
    setNotice("");
    try {
      if (type === "students") {
        const rows = await fetchJson("/api/students");
        downloadCsv("eduinsight-students.csv", ["Roll number", "Full name", "Department", "Academic year", "Section"],
          rows.map((student) => [student.rollNumber, student.fullName, student.department, student.academicYear, student.section]));
      } else if (type === "attendance") {
        const rows = await fetchJson("/api/attendance");
        downloadCsv("eduinsight-attendance.csv", ["Roll number", "Student", "Subject code", "Subject", "Date", "Status"],
          rows.map((record) => [record.rollNumber, record.studentName, record.subjectCode, record.subjectName, record.classDate, record.status]));
      } else if (type === "marks") {
        const rows = await fetchJson("/api/marks");
        downloadCsv("eduinsight-marks.csv", ["Roll number", "Student", "Subject code", "Subject", "Assessment", "Score", "Maximum score", "Date"],
          rows.map((record) => [record.rollNumber, record.studentName, record.subjectCode, record.subjectName, record.assessmentName, record.score, record.maxScore, record.assessedAt]));
      } else {
        const summary = await fetchJson("/api/analytics/summary");
        downloadCsv("eduinsight-at-risk-review.csv", ["Roll number", "Student", "Attendance percent", "Marks percent", "Risk level", "Reasons", "Recommendation"],
          summary.atRiskStudents.map((student) => [student.rollNumber, student.fullName, student.attendancePercent, student.averageMarksPercent, student.riskLevel, student.reasons.join(" "), student.recommendation]));
      }
      setNotice("CSV report downloaded.");
    } catch (err) {
      setError(err.message || "Could not create this report.");
    } finally {
      setBusy("");
    }
  }

  const reports = [
    ["students", "Student roster", "Student profile and organization fields."],
    ["attendance", "Attendance register", "Class date, subject, and present or absent status."],
    ["marks", "Marks register", "Assessment scores with maximum possible marks."],
    ["risk", "At-risk review", "Database-derived risk reasons and suggested support actions."],
  ];

  return <section className="module-page">
    <div className="module-page-heading"><div><span className="section-kicker">DATA EXPORTS</span><h1>Reports</h1><p>Download CSV reports built from your live student records. Only staff with access to academic records can export them.</p></div></div>
    {error && <div className="error-banner" role="alert">{error}</div>}{notice && <div className="training-result" role="status">{notice}</div>}
    <div className="report-grid">{reports.map(([key, title, description]) => <article className="panel report-card" key={key}><span className="report-icon">{key === "risk" ? "↗" : "↓"}</span><div><h3>{title}</h3><p>{description}</p></div><button className="secondary-button" onClick={() => exportReport(key)} disabled={busy !== ""}>{busy === key ? "Preparing…" : "Download CSV"}</button></article>)}</div>
  </section>;
}
