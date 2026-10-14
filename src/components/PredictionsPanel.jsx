import { useCallback, useEffect, useMemo, useState } from "react";

function messageFrom(result, fallback) {
  const detail = result?.detail;
  return typeof detail === "string" ? detail : detail?.message || result?.message || fallback;
}

const FEATURE_LABELS = {
  study_hours: "Study hours",
  number_courses: "Number of courses",
  time_study: "Study time",
  attendance_percent: "Attendance (%)",
  average_marks_percent: "Current marks (%)",
};

function Metrics({ metrics = {} }) {
  return <span>Rows {metrics.datasetRows ?? "—"} · holdout MAE {metrics.mae ?? "—"} · RMSE {metrics.rmse ?? "—"} · R² {metrics.r2 ?? "—"} · CV MAE {metrics.cvMae ?? "—"}</span>;
}

export default function PredictionsPanel({ apiBaseUrl, token, user, students }) {
  const [catalog, setCatalog] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [trainingFiles, setTrainingFiles] = useState([]);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");
  const [trainingResult, setTrainingResult] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [selectedModelKey, setSelectedModelKey] = useState("");
  const [featureValues, setFeatureValues] = useState({});
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentPrediction, setStudentPrediction] = useState(null);

  const loadCatalog = useCallback(async () => {
    setStatusError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/predictions/models`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, `Model status request failed (${response.status}).`));
      setCatalog(result);
      setSelectedModelKey((current) => current || result.models?.[0]?.modelKey || "");
    } catch (err) {
      setStatusError(err.message || "Model status is unavailable.");
    }
  }, [apiBaseUrl, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCatalog(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  const selectedModel = useMemo(
    () => catalog?.models?.find((model) => model.modelKey === selectedModelKey) || null,
    [catalog, selectedModelKey],
  );

  async function train(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!trainingFiles.length) return;
    setTraining(true);
    setError("");
    setTrainingResult(null);
    try {
      const body = new FormData();
      trainingFiles.forEach((file) => body.append("files", file));
      const response = await fetch(`${apiBaseUrl}/api/predictions/train`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, `Training failed (${response.status}).`));
      setTrainingResult(result);
      setTrainingFiles([]);
      formElement.reset();
      await loadCatalog();
    } catch (err) {
      setError(err.message || "Unable to train the models.");
    } finally {
      setTraining(false);
    }
  }

  async function runPrediction(event) {
    event.preventDefault();
    if (!selectedModel) return;
    setPredicting(true);
    setError("");
    setPrediction(null);
    try {
      const inputs = Object.fromEntries(selectedModel.features.map((name) => [name, Number(featureValues[name])]));
      if (Object.values(inputs).some((value) => !Number.isFinite(value) || value < 0)) {
        throw new Error("Enter a valid non-negative number for every model input.");
      }
      const response = await fetch(`${apiBaseUrl}/api/predictions/estimate/${encodeURIComponent(selectedModel.modelKey)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
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

  async function runStudentPrediction(event) {
    event.preventDefault();
    if (!selectedStudent) return;
    setPredicting(true);
    setError("");
    setStudentPrediction(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/predictions/${selectedStudent}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, `Prediction failed (${response.status}).`));
      setStudentPrediction(result);
    } catch (err) {
      setError(err.message || "Unable to generate a student estimate.");
    } finally {
      setPredicting(false);
    }
  }

  const models = catalog?.models || [];

  return <section className="module-page">
    <div className="module-page-heading"><div><span className="section-kicker">SUPERVISED MACHINE LEARNING</span><h1>Performance predictions</h1><p>Models are trained and evaluated separately for their own datasets. Estimates support academic review and should be considered alongside individual context.</p></div><button className="secondary-button" onClick={loadCatalog}>Refresh models</button></div>
    {statusError && <div className="error-banner" role="alert">{statusError}</div>}
    <div className="model-status-card panel">
      <span className={`model-status-dot ${models.length ? "trained" : ""}`} />
      <div><strong>{models.length ? `${models.length} trained model${models.length === 1 ? "" : "s"} available` : catalog?.configured ? "ML service connected · no trained models yet" : "ML service is not configured"}</strong>
        <p>{models.length ? models.map((model) => `${model.label} (${model.algorithm})`).join(" · ") : "An administrator can upload the labeled academic datasets below. Each supported CSV trains its own model profile."}</p></div>
    </div>

    {user.role === "ADMIN" && <form className="panel training-panel" onSubmit={train}>
      <div><span className="section-kicker">ADMINISTRATOR ACTION</span><h3>Train or replace prediction models</h3>
        <p>Choose one or both CSVs. Supported formats are <code>study_hours, student_marks</code>, <code>number_courses, time_study, Marks</code>, or the existing <code>attendance_percent, average_marks_percent, final_score</code> format. At least 30 complete numeric rows are required per file. Missing rows are dropped; names and direct identifiers are not used. The service compares three regressors using cross-validation, then reports performance on a separate holdout set.</p>
        <div className="dataset-template-links"><a href="/student-info-template.csv" download>Study hours template</a><a href="/student-marks-template.csv" download>Courses and study time template</a><a href="/dataset-template.csv" download>Attendance and marks template</a></div></div>
      <label className="form-field"><span>CSV files (up to 5 files, 10 MB each)</span><input type="file" accept=".csv,text/csv" multiple onChange={(event) => setTrainingFiles(Array.from(event.target.files || []))} /></label>
      {trainingFiles.length > 0 && <small className="selected-file-list">Selected: {trainingFiles.map((file) => file.name).join(" · ")}</small>}
      <button className="primary-button" disabled={training || !trainingFiles.length}>{training ? "Training models…" : `Train ${trainingFiles.length || "selected"} dataset${trainingFiles.length === 1 ? "" : "s"}`}</button>
      {trainingResult?.models?.length > 0 && <div className="training-result" role="status"><strong>Training complete. Separate models were saved:</strong>{trainingResult.models.map((model) => <div key={model.modelKey}><b>{model.label}</b> · {model.algorithm} v{model.modelVersion} · <Metrics metrics={model.metrics} /></div>)}</div>}
    </form>}

    {models.length > 0 && <form className="panel prediction-panel" onSubmit={runPrediction}>
      <div><span className="section-kicker">MODEL ESTIMATE</span><h3>Predict a mark from study inputs</h3><p>Select a trained profile and enter values in the same units used by its training dataset.</p></div>
      <label className="form-field"><span>Model profile</span><select value={selectedModelKey} onChange={(event) => { const nextKey = event.target.value; setSelectedModelKey(nextKey); const nextModel = models.find((model) => model.modelKey === nextKey); setFeatureValues(Object.fromEntries((nextModel?.features || []).map((name) => [name, ""]))); setPrediction(null); }}>{models.map((model) => <option key={model.modelKey} value={model.modelKey}>{model.label}</option>)}</select></label>
      {selectedModel && <div className="record-form-grid">{selectedModel.features.map((name) => <label className="form-field" key={name}><span>{FEATURE_LABELS[name] || name}</span><input required type="number" min="0" step="any" value={featureValues[name] || ""} onChange={(event) => setFeatureValues((current) => ({ ...current, [name]: event.target.value }))} /></label>)}</div>}
      <button className="primary-button" disabled={predicting || !selectedModel}>{predicting ? "Estimating…" : "Generate estimate"}</button>
    </form>}

    {models.some((model) => model.modelKey === "active") && <form className="panel prediction-panel" onSubmit={runStudentPrediction}>
      <div><span className="section-kicker">STUDENT RECORD ESTIMATE</span><h3>Estimate from recorded attendance and marks</h3><p>Requires a model trained with the attendance and marks template, plus recorded data for the student.</p></div>
      <div className="prediction-controls"><label className="form-field"><span>Student</span><select required value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}><option value="">Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.rollNumber}</option>)}</select></label><button className="primary-button" disabled={predicting || !selectedStudent}>{predicting ? "Estimating…" : "Generate student estimate"}</button></div>
    </form>}

    {error && <div className="error-banner" role="alert">{error}</div>}
    {prediction && <section className="panel prediction-result"><span className="section-kicker">MODEL OUTPUT · {prediction.target}</span><h2>{Number(prediction.predictedValue).toFixed(2)}<small> {prediction.target}</small></h2><p>{prediction.label}: {Object.entries(prediction.inputs || {}).map(([name, value]) => `${FEATURE_LABELS[name] || name} ${value}`).join(" · ")}.</p><div className="prediction-metrics">{prediction.algorithm} v{prediction.modelVersion} · Holdout MAE {prediction.metrics?.mae} · RMSE {prediction.metrics?.rmse} · R² {prediction.metrics?.r2}</div><small>Model trained at {prediction.trainedAt}. This is a statistical estimate, not a guaranteed score.</small></section>}
    {studentPrediction && <section className="panel prediction-result"><span className="section-kicker">MODEL OUTPUT · {studentPrediction.target}</span><h2>{Number(studentPrediction.predictedFinalScore).toFixed(1)}<small> / 100</small></h2><p>{studentPrediction.studentName}: attendance {studentPrediction.attendancePercent}% · current marks {studentPrediction.averageMarksPercent}%.</p><div className="prediction-metrics">{studentPrediction.algorithm} v{studentPrediction.modelVersion} · Holdout MAE {studentPrediction.modelMetrics?.mae} · RMSE {studentPrediction.modelMetrics?.rmse} · R² {studentPrediction.modelMetrics?.r2}</div><small>Predicted at {studentPrediction.predictedAt}. Model trained at {studentPrediction.trainedAt}. Consider the estimate alongside individual context.</small></section>}
  </section>;
}
