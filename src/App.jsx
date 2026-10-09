
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8081/api/students";

const icons = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  students: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  attendance: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15l2 2 5-5"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/></>,
  brain: <><path d="M12 18V5a3 3 0 0 0-5.8-1A4 4 0 0 0 4 11a4 4 0 0 0 2 7 3 3 0 0 0 6 0"/><path d="M12 18V5a3 3 0 0 1 5.8-1A4 4 0 0 1 20 11a4 4 0 0 1-2 7 3 3 0 0 1-6 0M8 9a3 3 0 0 0 4 3m4-3a3 3 0 0 1-4 3"/></>,
  reports: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.5-2.6 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h3l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.5 2.6-1.4 1.1a8 8 0 0 1 0 2Z"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2Z"/></>,
  chevron: <><path d="m9 18 6-6-6-6"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></>,
};

function Icon({ name, size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {icons[name] || icons.overview}
    </svg>
  );
}

const navItems = [
  { label: "Overview", icon: "overview" },
  { label: "Students", icon: "students" },
  { label: "Attendance", icon: "attendance" },
  { label: "Performance", icon: "chart" },
  { label: "AI Predictions", icon: "brain" },
  { label: "Reports", icon: "reports" },
];

const initialForm = {
  rollNumber: "",
  fullName: "",
  email: "",
  department: "AIML",
  academicYear: "2",
  section: "A",
};

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function loadStudents() {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setStudents(data);
      setApiOnline(true);
      setError("");
    } catch {
      setApiOnline(false);
      setError("Could not connect to Spring Boot. Make sure the backend is running on port 8081 and CORS is enabled.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return students;
    return students.filter((student) =>
      [student.fullName, student.rollNumber, student.email, student.department]
        .some((value) => (value || "").toLowerCase().includes(term))
    );
  }, [students, query]);

  const departments = new Set(students.map((s) => s.department).filter(Boolean));
  const sections = new Set(students.map((s) => s.section).filter(Boolean));

  function openCreateModal() {
    setEditingStudent(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEditModal(student) {
    setEditingStudent(student);
    setForm({
      rollNumber: student.rollNumber || "",
      fullName: student.fullName || "",
      email: student.email || "",
      department: student.department || "AIML",
      academicYear: String(student.academicYear || "2"),
      section: student.section || "A",
    });
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      academicYear: form.academicYear ? Number(form.academicYear) : null,
      email: form.email.trim() || null,
    };

    try {
      const response = await fetch(
        editingStudent ? `${API_URL}/${editingStudent.id}` : API_URL,
        {
          method: editingStudent ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("That roll number or email may already exist.");
        }
        throw new Error(`Request failed (${response.status}). Check the student details.`);
      }

      await loadStudents();
      setModalOpen(false);
      setToast(editingStudent ? "Student updated successfully." : "Student added successfully.");
      window.setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "Unable to save student.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student) {
    if (!window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_URL}/${student.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Delete failed (${response.status}).`);
      await loadStudents();
      setToast("Student deleted successfully.");
      window.setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "Unable to delete student.");
    }
  }

  const isStudentsPage = activePage === "Students";
  const supportedPage = activePage === "Overview" || isStudentsPage;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E<span>.</span></div>
          <div className="brand-copy">
            <strong>Edu<span>Insight</span></strong>
            <small>ACADEMIC INTELLIGENCE</small>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activePage === item.label ? "active" : ""}`}
              onClick={() => setActivePage(item.label)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "AI Predictions" && <span className="nav-new">AI</span>}
            </button>
          ))}
        </nav>

        <div className="workspace-label manage-label">MANAGE</div>
        <button
          className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => setActivePage("Settings")}
        >
          <Icon name="settings" />
          <span>Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Icon name="sparkles" size={19} /></div>
            <strong>Your academic insights</strong>
            <p>Turn student data into meaningful progress.</p>
            <span className="help-status"><span /> AI analytics coming soon</span>
          </div>
          <div className="profile">
            <div className="profile-avatar">VS</div>
            <div className="profile-copy">
              <strong>Faculty Workspace</strong>
              <small>Academic administrator</small>
            </div>
            <span className="profile-dots">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span><Icon name="chevron" size={14}/>
            <strong>{activePage}</strong>
          </div>
          <div className="topbar-right">
            <div className={`connection-pill ${apiOnline ? "online" : "offline"}`}>
              <span className="connection-dot" />
              {apiOnline ? "Backend connected" : loading ? "Connecting..." : "Backend offline"}
            </div>
            <div className="top-avatar">VS</div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={loadStudents}><Icon name="refresh" size={16}/> Retry</button>
            </div>
          )}

          {supportedPage ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" /> YOUR ACADEMIC OVERVIEW</div>
                  <h1>{isStudentsPage ? "Student directory" : "Make every student count."}</h1>
                  <p className="page-subtitle">
                    {isStudentsPage
                      ? "Manage student profiles and keep academic records organized."
                      : "A clearer view of student records, progress, and academic opportunity."}
                  </p>
                </div>
                <button className="primary-button" onClick={openCreateModal}>
                  <Icon name="plus" size={18}/> Add student
                </button>
              </section>

              {!isStudentsPage && (
                <section className="hero-banner">
                  <div className="hero-content">
                    <div className="hero-tag"><Icon name="sparkles" size={15}/> INTELLIGENT ACADEMIC ANALYTICS</div>
                    <h2>Every student has the potential<br/>to <span>perform beyond limits.</span></h2>
                    <p>Bring academic records together and turn them into clearer decisions for student success.</p>
                    <button className="hero-button" onClick={() => setActivePage("Students")}>
                      Explore students <Icon name="arrow" size={16}/>
                    </button>
                  </div>
                  <div className="hero-art" aria-hidden="true">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <div className="orbit orbit-three" />
                    <div className="orb-core"><Icon name="brain" size={42}/></div>
                    <div className="floating-chip chip-top"><span className="chip-dot teal" /> Data connected</div>
                    <div className="floating-chip chip-bottom"><Icon name="chart" size={15}/> Insights, made clearer</div>
                  </div>
                </section>
              )}

              <section className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-top"><span className="metric-icon purple"><Icon name="students"/></span><span className="metric-caption">CURRENT DATABASE</span></div>
                  <div className="metric-value">{loading ? "—" : students.length}</div>
                  <div className="metric-label">Registered students</div>
                  <div className="metric-foot">Student profiles stored</div>
                </div>
                <div className="metric-card">
                  <div className="metric-top"><span className="metric-icon blue"><Icon name="overview"/></span><span className="metric-caption">ORGANIZATION</span></div>
                  <div className="metric-value">{loading ? "—" : departments.size}</div>
                  <div className="metric-label">Departments represented</div>
                  <div className="metric-foot">Based on student records</div>
                </div>
                <div className="metric-card">
                  <div className="metric-top"><span className="metric-icon teal"><Icon name="attendance"/></span><span className="metric-caption">CLASS STRUCTURE</span></div>
                  <div className="metric-value">{loading ? "—" : sections.size}</div>
                  <div className="metric-label">Sections represented</div>
                  <div className="metric-foot">Unique sections in the database</div>
                </div>
                <div className="metric-card">
                  <div className="metric-top"><span className="metric-icon orange"><Icon name="chart"/></span><span className="metric-caption">SYSTEM STATUS</span></div>
                  <div className={`metric-value status-value ${apiOnline ? "good" : ""}`}>{loading ? "…" : apiOnline ? "Online" : "Offline"}</div>
                  <div className="metric-label">Academic data service</div>
                  <div className="metric-foot">Spring Boot · MySQL</div>
                </div>
              </section>

              {!isStudentsPage && (
                <section className="insights-grid">
                  <div className="panel performance-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="section-kicker">ACADEMIC INTELLIGENCE</span>
                        <h3>Performance analytics</h3>
                      </div>
                      <span className="coming-badge">NEXT MODULE</span>
                    </div>
                    <div className="empty-chart">
                      <div className="chart-illustration">
                        <div className="chart-grid-lines"><i/><i/><i/><i/></div>
                        <div className="chart-bars"><span/><span/><span/><span/><span/><span/><span/></div>
                        <div className="chart-spark"><Icon name="chart" size={23}/></div>
                      </div>
                      <strong>Your next insight starts with academic data.</strong>
                      <p>Attendance and marks analytics will appear here once those modules are connected.</p>
                    </div>
                  </div>

                  <div className="panel ai-panel">
                    <div className="ai-panel-top">
                      <span className="ai-icon"><Icon name="sparkles" size={21}/></span>
                      <span className="ai-label">EDUINSIGHT AI</span>
                      <span className="ai-pulse"/>
                    </div>
                    <h3>Better support starts with better insight.</h3>
                    <p>Our planned prediction engine will help identify academic patterns and students who may benefit from additional support.</p>
                    <div className="ai-feature-list">
                      <div><span className="feature-check">✓</span> Performance prediction</div>
                      <div><span className="feature-check">✓</span> Early risk identification</div>
                      <div><span className="feature-check">✓</span> Personalized recommendations</div>
                    </div>
                    <div className="ai-footer"><span>PLANNED MODULE</span><span>In development <Icon name="arrow" size={14}/></span></div>
                  </div>
                </section>
              )}

              <section className="panel students-panel">
                <div className="students-heading">
                  <div>
                    <span className="section-kicker">STUDENT RECORDS</span>
                    <h3>{isStudentsPage ? "All students" : "Recently registered students"}</h3>
                    <p>Manage student information from one place.</p>
                  </div>
                  <div className="table-toolbar">
                    <label className="search-box">
                      <Icon name="search" size={17}/>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search students..."
                        aria-label="Search students"
                      />
                    </label>
                    <button className="secondary-button" onClick={loadStudents} title="Refresh student list">
                      <Icon name="refresh" size={17}/>
                    </button>
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>STUDENT</th>
                        <th>ROLL NUMBER</th>
                        <th>DEPARTMENT</th>
                        <th>YEAR / SECTION</th>
                        <th className="actions-heading">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="5" className="table-message">Loading student records…</td></tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="5">
                            <div className="table-empty">
                              <div className="empty-icon"><Icon name="students" size={25}/></div>
                              <strong>{query ? "No matching students" : "Your student list is ready"}</strong>
                              <p>{query ? "Try another name, roll number, email, or department." : "Add your first student to start building your academic database."}</p>
                              {!query && <button className="primary-button compact" onClick={openCreateModal}><Icon name="plus" size={16}/> Add first student</button>}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.slice(0, isStudentsPage ? undefined : 5).map((student, index) => (
                          <tr key={student.id}>
                            <td>
                              <div className="student-cell">
                                <div className={`student-avatar avatar-${index % 5}`}>
                                  {(student.fullName || "S").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="student-cell-copy">
                                  <strong>{student.fullName}</strong>
                                  <span>{student.email || "No email provided"}</span>
                                </div>
                              </div>
                            </td>
                            <td><span className="roll-number">{student.rollNumber}</span></td>
                            <td><span className="department-pill">{student.department || "Not set"}</span></td>
                            <td><span className="year-section">Year {student.academicYear || "—"} <i/> Section {student.section || "—"}</span></td>
                            <td>
                              <div className="row-actions">
                                <button className="action-button edit-action" onClick={() => openEditModal(student)} title="Edit student"><Icon name="edit" size={16}/></button>
                                <button className="action-button delete-action" onClick={() => handleDelete(student)} title="Delete student"><Icon name="trash" size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">
                  <span>Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> student records</span>
                  {!isStudentsPage && students.length > 5 && <button className="text-button" onClick={() => setActivePage("Students")}>View all students <Icon name="chevron" size={15}/></button>}
                </div>
              </section>

              <footer className="page-footer">
                <span>© 2026 EduInsight · Intelligent Academic Analytics</span>
                <span><i className={`footer-dot ${apiOnline ? "connected" : ""}`}/> {apiOnline ? "Data service connected" : "Waiting for data service"}</span>
              </footer>
            </>
          ) : (
            <section className="module-placeholder">
              <div className="placeholder-icon"><Icon name={navItems.find((item) => item.label === activePage)?.icon || "settings"} size={30}/></div>
              <span className="section-kicker">EDUINSIGHT WORKSPACE</span>
              <h1>{activePage}</h1>
              <p>This module is part of our project roadmap. We'll build it after the student management foundation is complete.</p>
              <button className="primary-button" onClick={() => setActivePage("Overview")}>Back to overview <Icon name="arrow" size={16}/></button>
            </section>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <form className="student-modal" onSubmit={handleSubmit}>
            <div className="modal-heading">
              <div>
                <span className="section-kicker">STUDENT DIRECTORY</span>
                <h2>{editingStudent ? "Edit student" : "Add a new student"}</h2>
                <p>Enter the student's academic and contact details.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close"><Icon name="close"/></button>
            </div>

            <div className="form-grid">
              <label className="form-field full-field">
                <span>Full name *</span>
                <input required value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} placeholder="e.g. Aanya Sharma"/>
              </label>
              <label className="form-field">
                <span>Roll number *</span>
                <input required value={form.rollNumber} onChange={(e) => setForm({...form, rollNumber: e.target.value})} placeholder="e.g. 24EG107F60"/>
              </label>
              <label className="form-field">
                <span>Email address</span>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="student@example.com"/>
              </label>
              <label className="form-field">
                <span>Department</span>
                <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}>
                  <option value="AIML">Artificial Intelligence & ML</option>
                  <option value="CSE">Computer Science</option>
                  <option value="ECE">Electronics & Communication</option>
                  <option value="EEE">Electrical & Electronics</option>
                  <option value="IT">Information Technology</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="form-field">
                <span>Academic year</span>
                <select value={form.academicYear} onChange={(e) => setForm({...form, academicYear: e.target.value})}>
                  <option value="1">First year</option>
                  <option value="2">Second year</option>
                  <option value="3">Third year</option>
                  <option value="4">Fourth year</option>
                </select>
              </label>
              <label className="form-field">
                <span>Section</span>
                <select value={form.section} onChange={(e) => setForm({...form, section: e.target.value})}>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </label>
            </div>

            {error && <div className="modal-error">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>
                <Icon name="plus" size={17}/>{saving ? "Saving..." : editingStudent ? "Save changes" : "Create student"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="toast-message"><span>✓</span>{toast}</div>}
    </div>
  );
}

export default App;
