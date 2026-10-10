import { useCallback, useEffect, useState } from "react";

function messageFrom(result, fallback) {
  const detail = result?.detail;
  return typeof detail === "string" ? detail : detail?.message || result?.message || fallback;
}

export default function PredictionsPanel({ apiBaseUrl, token, user, students }) {
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [trainingFile, setTrainingFile] = useState(null);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");
  const [trainingResult, setTrainingResult] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const loadStatus = useCallback(async () => {
    setStatusError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/predictions/status`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, `Model status request failed (${response.status}).`));
      setStatus(result);
    } catch (err) {
      setStatusError(err.message || "Model status is unavailable.");
    }
  }, [apiBaseUrl, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadStatus(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  async function train(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!trainingFile) return;
    setTraining(true);
    setError("");
    setTrainingResult(null);
    try {
      const body = new FormData();
      body.append("file", trainingFile);
      const response = await fetch(`${apiBaseUrl}/api/predictions/train`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, `Training failed (${response.status}).`));
      setTrainingResult(result);
      setTrainingFile(null);
      formElement.reset();
      await loadStatus();
    } catch (err) {
      setError(err.message || "Unable to train the model.");
    } finally {
      setTraining(false);
    }
  }

  async function runPrediction(event) {
    event.preventDefault();
    if (!selectedStudent) return;
    setPredicting(true);
    setError("");
    setPrediction(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/predictions/${selectedStudent}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, `Prediction failed (${response.status}).`));
      setPrediction(result);
    } catch (err) {
      setError(err.message || "Unable to generate a prediction.");
    } finally {
      setPredicting(false);
    }
  }

  return <section className="module-page">
    <div className="module-page-heading"><div><span className="section-kicker">SUPERVISED MACHINE LEARNING</span><h1>Performance predictions</h1><p>Predictions use a trained model and a held-out evaluation set. They are estimates to support review, not decisions about a student.</p></div><button className="secondary-button" onClick={loadStatus}>Refresh model</button></div>
    {statusError && <div className="error-banner" role="alert">{statusError}</div>}
    <div className="model-status-card panel">
      <span className={`model-status-dot ${status?.modelTrained ? "trained" : ""}`} />
      <div><strong>{status?.modelTrained ? status.configured ? "A trained model is available" : "A trained model is stored · ML service is not configured" : status?.configured ? "ML service connected · no trained model" : "ML service is not configured"}</strong>
        <p>{status?.modelTrained ? `Model trained ${status.trainedAt || ""}.` : "Predictions remain unavailable until an administrator trains a model with real labeled student-term data."}</p></div>
    </div>

    {user.role === "ADMIN" && <form className="panel training-panel" onSubmit={train}>
      <div><span className="section-kicker">ADMINISTRATOR ACTION</span><h3>Train or replace the model</h3>
        <p>Upload CSV with <code>attendance_percent</code>, <code>average_marks_percent</code>, and <code>final_score</code> columns. Use at least 30 real historical student-term rows; exclude names and direct identifiers. 25% is held out for evaluation.</p></div>
      <label className="form-field"><span>Labeled CSV file (10 MB max)</span><input type="file" accept=".csv,text/csv" onChange={(event) => setTrainingFile(event.target.files?.[0] || null)} /></label>
      <button className="primary-button" disabled={training || !trainingFile}>{training ? "Training model…" : "Train model"}</button>
      {trainingResult && <div className="training-result" role="status">Trained on {trainingResult.metrics?.trainRows} rows; evaluated on {trainingResult.metrics?.testRows}. MAE {trainingResult.metrics?.mae}, RMSE {trainingResult.metrics?.rmse}, R² {trainingResult.metrics?.r2}.</div>}
    </form>}

    <form className="panel prediction-panel" onSubmit={runPrediction}>
      <div><span className="section-kicker">STUDENT ESTIMATE</span><h3>Estimate a student's final score</h3><p>Requires recorded attendance and marks plus a trained model.</p></div>
      <div className="prediction-controls"><label className="form-field"><span>Student</span><select required value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}><option value="">Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.rollNumber}</option>)}</select></label>
        <button className="primary-button" disabled={predicting || !status?.modelTrained || !status?.configured || !selectedStudent}>{predicting ? "Estimating…" : "Generate estimate"}</button></div>
    </form>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {prediction && <section className="panel prediction-result"><span className="section-kicker">MODEL OUTPUT · {prediction.target}</span><h2>{prediction.predictedFinalScore.toFixed(1)}<small> / 100</small></h2><p>{prediction.studentName}: attendance {prediction.attendancePercent}% · current marks {prediction.averageMarksPercent}%.</p><div className="prediction-metrics">Holdout MAE {prediction.modelMetrics?.mae} · RMSE {prediction.modelMetrics?.rmse} · R² {prediction.modelMetrics?.r2}</div><small>Model trained at {prediction.trainedAt}. Consider the estimate alongside individual context.</small></section>}
  </section>;
}
