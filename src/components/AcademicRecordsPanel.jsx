import { useCallback, useEffect, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

export default function AcademicRecordsPanel({ page, apiBaseUrl, token, students }) {
  const isAttendance = page === "Attendance";
  const endpoint = `${apiBaseUrl}/api/${isAttendance ? "attendance" : "marks"}`;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    studentId: "", subjectCode: "", subjectName: "", classDate: today(), status: "PRESENT",
    assessmentName: "", score: "", maxScore: "100", assessedAt: today(),
  });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => []);
      if (!response.ok) throw new Error(result.detail || result.message || `Could not load records (${response.status}).`);
      setRecords(result);
    } catch (err) {
      setError(err.message || "Unable to load academic records.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!students.length) {
      setError("Add a student record before entering academic data.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = isAttendance
      ? { ...form, studentId: Number(form.studentId), status: form.status }
      : { ...form, studentId: Number(form.studentId), score: Number(form.score), maxScore: Number(form.maxScore) };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || result.message || `Save failed (${response.status}).`);
      await loadRecords();
      setForm((current) => isAttendance
        ? { ...current, classDate: today(), status: "PRESENT" }
        : { ...current, score: "", assessedAt: today() });
    } catch (err) {
      setError(err.message || "Unable to save this record.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(record) {
    if (!window.confirm(`Delete this ${isAttendance ? "attendance" : "marks"} record for ${record.studentName}?`)) return;
    try {
      const response = await fetch(`${endpoint}/${record.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Delete failed (${response.status}).`);
      await loadRecords();
    } catch (err) {
      setError(err.message || "Unable to delete this record.");
    }
  }

  return (
    <section className="module-page">
      <div className="module-page-heading">
        <div><span className="section-kicker">ACADEMIC RECORDS</span><h1>{isAttendance ? "Attendance management" : "Marks and assessments"}</h1>
          <p>{isAttendance ? "Record each class meeting and review attendance history." : "Enter assessment scores and compare performance against the maximum score."}</p></div>
        <span className="module-count">{records.length} records</span>
      </div>

      <form className="record-form panel" onSubmit={handleSubmit}>
        <div className="panel-heading"><div><span className="section-kicker">NEW ENTRY</span><h3>{isAttendance ? "Record attendance" : "Add assessment marks"}</h3></div></div>
        <div className="record-form-grid">
          <label className="form-field"><span>Student *</span><select required value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>
            <option value="">Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.rollNumber}</option>)}
          </select></label>
          <label className="form-field"><span>Subject code *</span><input required maxLength="30" value={form.subjectCode} onChange={(event) => setForm({ ...form, subjectCode: event.target.value })} placeholder="e.g. CS201" /></label>
          <label className="form-field"><span>Subject name *</span><input required maxLength="120" value={form.subjectName} onChange={(event) => setForm({ ...form, subjectName: event.target.value })} placeholder="e.g. Data Structures" /></label>
          {isAttendance ? <>
            <label className="form-field"><span>Class date *</span><input type="date" required value={form.classDate} onChange={(event) => setForm({ ...form, classDate: event.target.value })} /></label>
            <label className="form-field"><span>Status *</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="PRESENT">Present</option><option value="ABSENT">Absent</option></select></label>
          </> : <>
            <label className="form-field"><span>Assessment *</span><input required maxLength="100" value={form.assessmentName} onChange={(event) => setForm({ ...form, assessmentName: event.target.value })} placeholder="e.g. Midterm 1" /></label>
            <label className="form-field"><span>Score *</span><input required type="number" min="0" step="0.01" value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} /></label>
            <label className="form-field"><span>Maximum score *</span><input required type="number" min="0.01" step="0.01" value={form.maxScore} onChange={(event) => setForm({ ...form, maxScore: event.target.value })} /></label>
            <label className="form-field"><span>Assessment date *</span><input type="date" required value={form.assessedAt} onChange={(event) => setForm({ ...form, assessedAt: event.target.value })} /></label>
          </>}
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="record-form-actions"><button className="primary-button" type="submit" disabled={saving || students.length === 0}>{saving ? "Saving…" : isAttendance ? "Save attendance" : "Save marks"}</button></div>
      </form>

      <section className="panel record-list-panel">
        <div className="panel-heading"><div><span className="section-kicker">DATABASE RECORDS</span><h3>{isAttendance ? "Attendance history" : "Assessment results"}</h3></div><button className="secondary-button" onClick={loadRecords}>Refresh</button></div>
        <div className="table-scroll"><table className="student-table record-table">
          <thead><tr><th>STUDENT</th><th>SUBJECT</th>{isAttendance ? <><th>DATE</th><th>STATUS</th></> : <><th>ASSESSMENT</th><th>SCORE</th><th>DATE</th></>}<th>ACTIONS</th></tr></thead>
          <tbody>{loading ? <tr><td className="table-message" colSpan={isAttendance ? 5 : 6}>Loading records…</td></tr>
            : records.length === 0 ? <tr><td className="table-message" colSpan={isAttendance ? 5 : 6}>No records yet. Add the first entry above.</td></tr>
              : records.map((record) => <tr key={record.id}>
                <td><strong>{record.studentName}</strong><small className="record-subline">{record.rollNumber}</small></td>
                <td><strong>{record.subjectName}</strong><small className="record-subline">{record.subjectCode}</small></td>
                {isAttendance ? <><td>{record.classDate}</td><td><span className={`status-tag ${record.status.toLowerCase()}`}>{record.status}</span></td></>
                  : <><td>{record.assessmentName}</td><td>{record.score} / {record.maxScore}</td><td>{record.assessedAt}</td></>}
                <td><button className="action-button delete-action" onClick={() => deleteRecord(record)} title="Delete record" aria-label="Delete record">×</button></td>
              </tr>)}
          </tbody>
        </table></div>
      </section>
    </section>
  );
}
