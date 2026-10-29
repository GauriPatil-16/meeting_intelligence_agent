import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {Activity, ArrowRight, BarChart3,
  Check, CheckSquare, CircleHelp, Copy, Download, FileText, History,
  LayoutDashboard, ListTodo, LoaderCircle, Pencil, Plus, Save, Search,
  Moon, Sparkles, Sun, Target, UploadCloud, Users, X,
} from "lucide-react";
import "./App.css";
import { downloadMeetingReport, meetingReportText } from "./report";

const API = import.meta.env.VITE_API_URL || "/api";
const pages = [
  { name: "Overview", path: "/", icon: LayoutDashboard },
  { name: "Analyze meeting", path: "/analyze", icon: FileText },
  { name: "Meeting history", path: "/history", icon: History },
  { name: "Action items", path: "/actions", icon: CheckSquare },
  { name: "Insights", path: "/analytics", icon: BarChart3 },
];

function useMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/meetings`);
      if (!response.ok) throw new Error("Could not load meeting history.");
      const data = await response.json();
      setMeetings(data.meetings || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, []);
  const updateAction = useCallback(async (meetingId, actionIndex, action) => {
    const response = await fetch(`${API}/meetings/${meetingId}/actions/${actionIndex}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not update this action item.");
    await refresh();
  }, [refresh]);
  useEffect(() => { refresh(); }, [refresh]);
  return { meetings, loading, error, refresh, updateAction };
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function meetingName(meeting) {
  return meeting.title || meeting.analysis?.meeting_summary?.[0]?.slice(0, 74) || "Meeting notes";
}

function Empty({ title, detail, action }) {
  return <div className="empty-state"><span className="empty-icon"><FileText size={21} /></span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}

function Stat({ icon: Icon, label, value, caption, tone = "blue" }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={19} /></span><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-caption">{caption}</span></article>;
}

function DeskIllustration() {
  return <svg className="desk-illustration" viewBox="0 0 620 340" role="img" aria-label="A calm desk with a laptop, plant, notebook, and coffee">
    <rect x="14" y="12" width="590" height="290" rx="16" className="scene-window" />
    <path d="M210 12v290M406 12v290M14 157h590" className="scene-window-frame" />
    <path d="M25 260 95 177l54 62 72-98 83 108 65-72 73 69 65-90 87 104v35H25z" className="scene-skyline" />
    <rect x="34" y="234" width="30" height="68" rx="3" className="scene-building" />
    <rect x="71" y="211" width="40" height="91" rx="3" className="scene-building" />
    <rect x="119" y="245" width="36" height="57" rx="3" className="scene-building" />
    <rect x="459" y="222" width="31" height="80" rx="3" className="scene-building" />
    <rect x="497" y="195" width="42" height="107" rx="3" className="scene-building" />
    <path d="M0 294h620v34H0z" className="scene-desk" />
    <path d="M165 290h283l-18 13H183z" className="scene-desk-edge" />
    <path d="M239 163h180a8 8 0 0 1 8 8v112H231V171a8 8 0 0 1 8-8z" className="scene-laptop" />
    <rect x="243" y="175" width="172" height="91" rx="3" className="scene-screen" />
    <rect x="254" y="186" width="78" height="7" rx="3" className="scene-ui-sage" />
    <rect x="254" y="201" width="145" height="4" rx="2" className="scene-ui-line" />
    <rect x="254" y="211" width="123" height="4" rx="2" className="scene-ui-line" />
    <rect x="254" y="226" width="43" height="26" rx="4" className="scene-ui-card" />
    <rect x="304" y="226" width="43" height="26" rx="4" className="scene-ui-card" />
    <rect x="354" y="226" width="45" height="26" rx="4" className="scene-ui-card" />
    <path d="M223 282h212l16 9H207z" className="scene-laptop-base" />
    <path d="M82 290c2-40 8-70 27-93 2 31-4 57-17 77 12-29 34-47 60-54-9 32-30 54-63 62 20-20 44-28 70-23-19 23-43 33-74 31" className="scene-plant" />
    <path d="M88 287h68l-8 20H96z" className="scene-pot" />
    <path d="M159 282h51l-6 8h-45z" className="scene-notebook" />
    <path d="M166 277h49l-6 8h-45z" className="scene-notebook-top" />
    <path d="M454 279h40l-5 12h-31z" className="scene-book" />
    <path d="M459 272h39l-4 11h-37z" className="scene-book-top" />
    <path d="M528 264h45v27h-45z" className="scene-mug" />
    <path d="M573 270c18-2 18 15 0 16" className="scene-mug-handle" />
    <path d="M537 257c-3-8 4-10 1-17M550 257c-3-8 4-10 1-17" className="scene-steam" />
    <text x="486" y="68" className="scene-note">Less follow-up</text>
    <text x="500" y="93" className="scene-note">More progress</text>
    <path d="M498 107c24-9 44-8 65-1" className="scene-note-line" />
  </svg>;
}

function ReportActions({ meeting }) {
  const [copied, setCopied] = useState(false);
  const report = { title: meetingName(meeting), createdAt: meeting.created_at, analysis: meeting.analysis || {} };
  async function copyReport() {
    try {
      await navigator.clipboard.writeText(meetingReportText(report));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return <div className="report-actions">
    <button type="button" className="icon-button" title="Copy report" aria-label="Copy meeting report" onClick={copyReport}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
    <button type="button" className="icon-button" title="Download PDF" aria-label="Download meeting report as PDF" onClick={() => downloadMeetingReport(report)}><Download size={15} /></button>
    {copied && <span className="copy-feedback" role="status">Copied</span>}
  </div>;
}

function MeetingRow({ meeting, showReports = false }) {
  const analysis = meeting.analysis || {};
  const tasks = analysis.action_items?.length || 0;
  return <article className="meeting-row"><span className="meeting-file"><FileText size={19} /></span><div className="meeting-main"><strong>{meetingName(meeting)}</strong><span>{formatDate(meeting.created_at)} <i /> {tasks} action {tasks === 1 ? "item" : "items"}</span></div><div className="meeting-topics">{(analysis.key_topics || []).slice(0, 2).map(topic => <span className="topic-chip" key={topic}>{topic}</span>)}</div>{showReports ? <ReportActions meeting={meeting} /> : <span className="row-arrow"><ArrowRight size={17} /></span>}</article>;
}

function Dashboard({ meetings, loading, error }) {
  const actions = meetings.flatMap(meeting => (meeting.analysis?.action_items || []).map(item => ({ ...item, meetingTitle: meetingName(meeting) })));
  const decisions = meetings.reduce((count, meeting) => count + (meeting.analysis?.decisions?.length || 0), 0);
  const unassigned = actions.filter(item => !item.owner).length;
  return <>
    <section className="welcome-banner"><div className="hero-copy"><h2>Turn your meetings<br />into action.</h2><p>Get clear summaries, decisions, and action items from every meeting transcript.</p><div className="hero-actions"><NavLink className="primary-button" to="/analyze"><UploadCloud size={16} /> Analyze a meeting</NavLink><NavLink className="secondary-button" to="/analytics"><BarChart3 size={16} /> Explore insights</NavLink></div></div><div className="hero-visual"><DeskIllustration /></div></section>
    {error && <p className="inline-error">{error}</p>}
    <div className="section-heading"><div><span className="eyebrow">AT A GLANCE</span><h2>Your meeting pulse</h2></div></div>
    <div className="stats-grid"><Stat icon={History} label="Meetings analyzed" value={loading ? "—" : meetings.length} caption="Saved in meeting history" /><Stat icon={CheckSquare} label="Action items" value={loading ? "—" : actions.length} caption={`${unassigned} without an owner`} tone="purple" /><Stat icon={Target} label="Decisions captured" value={loading ? "—" : decisions} caption="Confirmed in conversation" tone="green" /><Stat icon={Users} label="Owners identified" value={loading ? "—" : actions.filter(item => item.owner).length} caption="Across your action items" tone="amber" /></div>
    <div className="dashboard-columns"><section className="content-card"><div className="card-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Recent meetings</h3></div><NavLink to="/history" className="text-link">View all <ArrowRight size={15} /></NavLink></div>{loading ? <p className="muted">Loading meetings…</p> : meetings.length ? <div className="meeting-list">{meetings.slice(0, 4).map(meeting => <MeetingRow key={meeting.id} meeting={meeting} />)}</div> : <Empty title="Your first insight starts here" detail="Add a transcript and get a concise summary, decisions, and assigned next steps." action={<NavLink to="/analyze" className="text-link">Analyze a meeting <ArrowRight size={15} /></NavLink>} />}</section><section className="content-card focus-card"><div className="card-heading"><div><span className="eyebrow">FOLLOW THROUGH</span><h3>Action items</h3></div><ListTodo size={19} className="subtle-icon" /></div>{actions.length ? <div className="action-preview">{actions.slice(0, 5).map((item, index) => <div className="action-preview-row" key={`${item.meetingTitle}-${index}`}><span className="action-checkbox"><Check size={12} /></span><div><strong>{item.task}</strong><span>{item.owner || "Owner not assigned"} · {item.deadline || "No deadline"}</span></div></div>)}</div> : <Empty title="No action items yet" detail="Action items from analyzed meetings will show up here." />}</section></div>
  </>;
}

function Analyze({ onAnalyzed }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function analyze() {
    if (!pdfFile && !transcript.trim()) { setError("Upload a PDF or paste a transcript to continue."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      let response;
      if (pdfFile) { const body = new FormData(); body.append("file", pdfFile); response = await fetch(`${API}/analyze-pdf`, { method: "POST", body }); }
      else response = await fetch(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript }) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Meeting analysis failed. Check the backend and API key.");
      setResult(data.summary_and_analysis); onAnalyzed();
    } catch (err) { setError(err.message || "Unable to connect to the backend."); }
    finally { setLoading(false); }
  }
  return <><div className="page-intro"><span className="eyebrow">MEETING INTELLIGENCE</span><h2>Make every conversation count.</h2><p>Bring in a transcript and get the decisions, owners, and follow-through in one place.</p></div><div className="analyze-layout"><section className="content-card input-card"><div className="card-heading"><div><span className="eyebrow">START WITH YOUR TRANSCRIPT</span><h3>Meeting notes</h3></div><span className="secure-label"><Sparkles size={14} /> AI assisted</span></div><label className="upload-box"><input type="file" accept=".pdf,application/pdf" onChange={event => { const file = event.target.files?.[0]; setPdfFile(file || null); setError(""); }} /><UploadCloud size={23} /><strong>{pdfFile ? pdfFile.name : "Drop in a PDF transcript"}</strong><span>{pdfFile ? "PDF ready to analyze" : "or click to browse · PDF format"}</span></label><div className="divider"><span>OR PASTE TRANSCRIPT</span></div><textarea className="transcript-input" rows={9} placeholder="Paste your meeting transcript here…" value={transcript} onChange={event => { setTranscript(event.target.value); setPdfFile(null); setError(""); }} /><div className="form-footer"><span>{transcript.trim() ? `${transcript.trim().split(/\s+/).length} words` : "Your transcript is used to generate this report."}</span><button className="primary-button" onClick={analyze} disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Analyzing…</> : <><Sparkles size={16} /> Analyze meeting</>}</button></div>{error && <p className="inline-error" role="alert">{error}</p>}</section><aside className="content-card what-you-get"><span className="eyebrow">YOUR REPORT INCLUDES</span><h3>From conversation to clarity.</h3>{[[Target, "Meeting summary", "A quick read on what was discussed."], [CheckSquare, "Decisions made", "Confirmed choices with transcript evidence."], [ListTodo, "Action items & owners", "Tasks, owners, and deadlines when stated."], [CircleHelp, "Open questions", "Loose ends and blockers to revisit."]].map(([Icon, title, description]) => <div className="feature-row" key={title}><span><Icon size={17} /></span><div><strong>{title}</strong><p>{description}</p></div></div>)}</aside></div>{result && <AnalysisResult result={result} />}</>;
}

function AnalysisResult({ result }) {
  const actions = result.action_items || [];
  const report = { title: "Meeting report", createdAt: new Date().toISOString(), analysis: result };
  return <section className="content-card result-card"><div className="card-heading"><div><span className="eyebrow">ANALYSIS COMPLETE</span><h3>Your meeting brief</h3></div><div className="report-tools"><ReportActions meeting={report} /><span className="success-pill"><Check size={14} /> Saved to history</span></div></div><div className="result-grid"><div className="result-block summary-block"><h4><Sparkles size={16} /> Summary</h4><ul>{(result.meeting_summary || []).map((item, i) => <li key={i}>{item}</li>)}</ul></div><div className="result-block"><h4><Target size={16} /> Decisions <span className="count-badge">{result.decisions?.length || 0}</span></h4>{result.decisions?.length ? result.decisions.map((item, i) => <div className="decision-item" key={i}><strong>{item.decision}</strong>{item.evidence && <div className="decision-evidence"><span>Transcript evidence</span><p>“{item.evidence}”</p></div>}</div>) : <p className="muted">No confirmed decisions identified.</p>}</div><div className="result-block action-block"><h4><ListTodo size={16} /> Action items <span className="count-badge">{actions.length}</span></h4>{actions.length ? <div className="table-wrap"><table><thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Priority</th></tr></thead><tbody>{actions.map((item, i) => <tr key={i}><td className="result-task">{item.task}</td><td>{item.owner || <span className="unassigned">Unassigned</span>}</td><td>{item.deadline || "—"}</td><td>{item.priority ? <span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span> : <span className="muted-cell">Not set</span>}</td></tr>)}</tbody></table></div> : <p className="muted">No action items identified.</p>}</div><div className="result-block"><h4><CircleHelp size={16} /> Open questions</h4>{result.open_questions?.length ? <ul>{result.open_questions.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="muted">No open questions identified.</p>}</div></div></section>;
}

function HistoryPage({ meetings, loading, error }) {
  const [query, setQuery] = useState("");
  const filtered = meetings.filter(meeting => `${meetingName(meeting)} ${meeting.analysis?.key_topics?.join(" ") || ""}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="page-intro"><span className="eyebrow">YOUR LIBRARY</span><h2>Meeting history</h2><p>Every transcript you’ve analyzed, along with its decisions and next steps.</p></div><section className="content-card"><div className="list-toolbar"><div><h3>All meetings <span className="count-badge">{meetings.length}</span></h3></div><label className="search-box"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search meetings" /></label></div>{error && <p className="inline-error">{error}</p>}{loading ? <p className="muted">Loading meetings…</p> : filtered.length ? <div className="meeting-list history-list">{filtered.map(meeting => <MeetingRow meeting={meeting} key={meeting.id} showReports />)}</div> : <Empty title={query ? "No matching meetings" : "No meetings saved yet"} detail={query ? "Try a different search term." : "Analyze a transcript to start building your meeting library."} />}</section></>;
}

function EditableActionRow({ item, onSave }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(item);
  function change(field, value) { setDraft(current => ({ ...current, [field]: value })); }
  async function save() {
    setSaving(true); setError("");
    try { await onSave(item.meetingId, item.actionIndex, draft); setEditing(false); }
    catch (err) { setError(err.message || "Could not save changes."); }
    finally { setSaving(false); }
  }
  return <>
    <tr>
      <td>{editing ? <input className="compact-input task-edit" aria-label="Action item task" value={draft.task || ""} onChange={event => change("task", event.target.value)} /> : <span className="task-cell"><span className="task-dot" />{item.task}</span>}</td>
      <td>{editing ? <input className="compact-input" aria-label="Owner" placeholder="Unassigned" value={draft.owner || ""} onChange={event => change("owner", event.target.value)} /> : item.owner || <span className="unassigned">Unassigned</span>}</td>
      <td>{editing ? <input className="compact-input" aria-label="Deadline" placeholder="No deadline" value={draft.deadline || ""} onChange={event => change("deadline", event.target.value)} /> : item.deadline || "—"}</td>
      <td>{editing ? <select className="compact-input" aria-label="Priority" value={draft.priority || ""} onChange={event => change("priority", event.target.value || null)}><option value="">None</option><option>High</option><option>Medium</option><option>Low</option></select> : item.priority ? <span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span> : "—"}</td>
      <td>{editing ? <select className="compact-input" aria-label="Status" value={draft.status || "Open"} onChange={event => change("status", event.target.value)}><option>Open</option><option>In Progress</option><option>Done</option></select> : <span className={`status-chip ${(item.status || "Open").toLowerCase().replaceAll(" ", "-")}`}>{item.status || "Open"}</span>}</td>
      <td className="edit-cell">{editing ? <><button type="button" className="icon-button" title="Save changes" aria-label="Save changes" disabled={saving} onClick={save}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}</button><button type="button" className="icon-button" title="Cancel edit" aria-label="Cancel edit" onClick={() => { setDraft(item); setEditing(false); setError(""); }}><X size={15} /></button></> : <button type="button" className="icon-button" title="Edit action item" aria-label="Edit action item" onClick={() => setEditing(true)}><Pencil size={15} /></button>}</td>
    </tr>
    {error && <tr><td colSpan="6"><span className="inline-error edit-error">{error}</span></td></tr>}
  </>;
}

function ActionsPage({ meetings, loading, error, updateAction }) {
  const actions = useMemo(() => meetings.flatMap(meeting => (meeting.analysis?.action_items || []).map((item, index) => ({ ...item, meetingId: meeting.id, actionIndex: index, meetingTitle: meetingName(meeting), key: `${meeting.id}-${index}` }))), [meetings]);
  const [filter, setFilter] = useState("All items");
  const visible = filter === "Unassigned" ? actions.filter(item => !item.owner) : actions;
  return <><div className="page-intro"><span className="eyebrow">KEEP THINGS MOVING</span><h2>Action items</h2><p>Edit tasks, owners, deadlines, priorities, and status. Changes are saved to meeting history.</p></div><section className="content-card"><div className="list-toolbar"><div><h3>All action items <span className="count-badge">{actions.length}</span></h3></div><select className="filter-select" value={filter} onChange={event => setFilter(event.target.value)}><option>All items</option><option>Unassigned</option></select></div>{error && <p className="inline-error">{error}</p>}{loading ? <p className="muted">Loading action items…</p> : visible.length ? <div className="table-wrap"><table><thead><tr><th>Action item</th><th>Owner</th><th>Deadline</th><th>Priority</th><th>Status</th><th>Edit</th></tr></thead><tbody>{visible.map(item => <EditableActionRow key={item.key} item={item} onSave={updateAction} />)}</tbody></table></div> : <Empty title="No action items found" detail={filter === "Unassigned" ? "Every captured action item has an owner." : "Once you analyze a meeting, its action items will appear here."} />}</section></>;
}

function AnalyticsPage({ meetings, loading, error }) {
  const summary = useMemo(() => {
    const topics = new Map();
    let decisions = 0; let actions = 0; let assigned = 0;
    meetings.forEach(meeting => { const analysis = meeting.analysis || {}; decisions += analysis.decisions?.length || 0; (analysis.action_items || []).forEach(item => { actions += 1; if (item.owner) assigned += 1; }); (analysis.key_topics || []).forEach(topic => topics.set(topic, (topics.get(topic) || 0) + 1)); });
    return { decisions, actions, assigned, topics: [...topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6) };
  }, [meetings]);
  return <><div className="page-intro"><span className="eyebrow">PATTERNS & MOMENTUM</span><h2>Meeting insights</h2><p>A simple pulse check across the conversations you’ve analyzed.</p></div>{error && <p className="inline-error">{error}</p>}<div className="stats-grid analytics-stats"><Stat icon={History} label="Meetings" value={loading ? "—" : meetings.length} caption="Total analyzed" /><Stat icon={Target} label="Decisions" value={loading ? "—" : summary.decisions} caption="Captured from meetings" tone="green" /><Stat icon={ListTodo} label="Action items" value={loading ? "—" : summary.actions} caption="Tasks identified" tone="purple" /><Stat icon={Users} label="Owner coverage" value={loading || !summary.actions ? "—" : `${Math.round(summary.assigned / summary.actions * 100)}%`} caption={`${summary.assigned} of ${summary.actions} items assigned`} tone="amber" /></div><section className="content-card topics-card"><div className="card-heading"><div><span className="eyebrow">WHAT’S ON THE TABLE</span><h3>Most discussed topics</h3></div><Activity size={18} className="subtle-icon" /></div>{summary.topics.length ? <div className="topic-bars">{summary.topics.map(([topic, count], index) => <div className="topic-bar-row" key={topic}><span className="topic-rank">{String(index + 1).padStart(2, "0")}</span><strong>{topic}</strong><span className="bar-track"><i style={{ width: `${Math.max(12, count / summary.topics[0][1] * 100)}%` }} /></span><span className="bar-count">{count} {count === 1 ? "meeting" : "meetings"}</span></div>)}</div> : <Empty title="Insights are taking shape" detail="Analyze more meetings and recurring discussion topics will appear here." />}</section></>;
}

function App() {
  const { meetings, loading, error, refresh, updateAction } = useMeetings();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    try { return window.localStorage.getItem("meeting-intelligence-theme") === "dark" ? "dark" : "light"; }
    catch { return "light"; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("meeting-intelligence-theme", theme); }
    catch { /* Keep the theme active for this session if storage is unavailable. */ }
  }, [theme]);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span><strong>Meeting Intelligence</strong><small>MEETING AGENT</small></span>
        </NavLink>
        <nav className="navigation" aria-label="Main navigation">
          {pages.map(({ name, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === "/"} title={name} aria-label={name}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Icon size={18} /><span>{name}</span>
              {name === "Action items" && meetings.some(meeting => meeting.analysis?.action_items?.length) && <i className="nav-indicator" />}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><strong>
            <Routes><Route path="/" element="Overview" /><Route path="/analyze" element="Analyze meeting" /><Route path="/history" element="Meeting history" /><Route path="/actions" element="Action items" /><Route path="/analytics" element="Insights" /></Routes>
          </strong></div>
          <div className="topbar-right">
            <button type="button" className="theme-toggle" aria-pressed={theme === "dark"} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(current => current === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
            <button className="topbar-cta" onClick={() => navigate("/analyze")}><Plus size={16} /> New analysis</button>
          </div>
        </header>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard meetings={meetings} loading={loading} error={error} />} />
            <Route path="/analyze" element={<Analyze onAnalyzed={refresh} />} />
            <Route path="/history" element={<HistoryPage meetings={meetings} loading={loading} error={error} />} />
            <Route path="/actions" element={<ActionsPage meetings={meetings} loading={loading} error={error} updateAction={updateAction} />} />
            <Route path="/analytics" element={<AnalyticsPage meetings={meetings} loading={loading} error={error} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
