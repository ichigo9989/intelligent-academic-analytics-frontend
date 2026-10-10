import { useState } from "react";

export default function AdminSettingsPanel({ apiBaseUrl, token, user }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function createFaculty(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || result.message || `Account creation failed (${response.status}).`);
      setNotice(`Faculty account created for ${result.email}. Provide the initial password to them securely.`);
      setForm({ fullName: "", email: "", password: "" });
    } catch (err) {
      setError(err.message || "Unable to create the account.");
    } finally {
      setSaving(false);
    }
  }

  if (user.role !== "ADMIN") return <section className="module-placeholder"><span className="section-kicker">EDUINSIGHT WORKSPACE</span><h1>Settings</h1><p>Only an administrator can manage faculty accounts.</p></section>;

  return <section className="module-page">
    <div className="module-page-heading"><div><span className="section-kicker">ADMINISTRATION</span><h1>Workspace settings</h1><p>Create faculty logins for staff who manage student records and academic data.</p></div></div>
    <form className="panel training-panel faculty-form" onSubmit={createFaculty}>
      <div><span className="section-kicker">FACULTY ACCESS</span><h3>Create faculty account</h3><p>Faculty can manage student, attendance, and marks records. They cannot create administrator accounts.</p></div>
      <div className="record-form-grid">
        <label className="form-field"><span>Full name</span><input required maxLength="150" autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
        <label className="form-field"><span>Email address</span><input required type="email" maxLength="254" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="form-field"><span>Temporary password (12–72 characters)</span><input required type="password" minLength="12" maxLength="72" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
      </div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {notice && <div className="training-result" role="status">{notice}</div>}
      <button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create faculty account"}</button>
    </form>
  </section>;
}
