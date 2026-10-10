import { useCallback, useEffect, useState } from "react";

function Metric({ label, value, note }) {
  return <article className="metric-card"><div className="metric-top"><span className="metric-caption">DATABASE SUMMARY</span></div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-foot">{note}</div></article>;
}

export default function AnalyticsPanel({ apiBaseUrl, token }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/analytics/summary`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || result.message || `Analytics request failed (${response.status}).`);
      setSummary(result);
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <section className="module-page">
    <div className="module-page-heading"><div><span className="section-kicker">LIVE DATABASE ANALYTICS</span><h1>Academic performance</h1><p>Summary values and student support flags are calculated from recorded attendance and marks.</p></div><button className="secondary-button" onClick={load}>Refresh</button></div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {loading ? <div className="panel portal-loading">Calculating analytics from database records…</div> : summary && <>
      <div className="metrics-grid analytics-metrics">
        <Metric label="Registered students" value={summary.studentCount} note="All student profiles" />
        <Metric label="Average attendance" value={summary.averageAttendancePercent == null ? "—" : `${summary.averageAttendancePercent}%`} note={`${summary.attendanceEntryCount} attendance entries`} />
        <Metric label="Average marks" value={summary.averageMarksPercent == null ? "—" : `${summary.averageMarksPercent}%`} note={`${summary.markEntryCount} assessment results`} />
        <Metric label="Students flagged" value={summary.atRiskCount} note="Based on the displayed policy" />
      </div>
      <section className="panel risk-panel">
        <div className="panel-heading"><div><span className="section-kicker">STUDENT SUPPORT</span><h3>At-risk review queue</h3></div><span className="module-count">{summary.atRiskCount} students</span></div>
        <p className="risk-policy">{summary.riskPolicy}</p>
        {summary.atRiskStudents.length === 0 ? <div className="table-message">{summary.studentsWithAcademicData === 0 ? "No attendance or marks have been recorded yet, so risk status is unavailable." : "No students currently meet the at-risk thresholds."}</div>
          : <div className="table-scroll"><table className="student-table"><thead><tr><th>STUDENT</th><th>ATTENDANCE</th><th>MARKS</th><th>LEVEL</th><th>REASONS & NEXT STEP</th></tr></thead><tbody>
            {summary.atRiskStudents.map((student) => <tr key={student.studentId}>
              <td><strong>{student.fullName}</strong><small className="record-subline">{student.rollNumber}</small></td>
              <td>{student.attendancePercent == null ? "No data" : `${student.attendancePercent}%`}</td>
              <td>{student.averageMarksPercent == null ? "No data" : `${student.averageMarksPercent}%`}</td>
              <td><span className={`status-tag ${student.riskLevel.toLowerCase()}`}>{student.riskLevel}</span></td>
              <td><div className="risk-reasons">{student.reasons.join(" ")}<small>{student.recommendation}</small></div></td>
            </tr>)}
          </tbody></table></div>}
      </section>
    </>}
  </section>;
}
