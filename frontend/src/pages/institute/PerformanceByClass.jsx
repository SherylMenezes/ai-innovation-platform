import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGroupStudents, getGroupSummary } from "../../api/institutionClient";
import Icon from "./InstituteIcons";
import { sampleGroupStudents, sampleGroupSummary } from "./sampleData";

const METRICS = [
  { key: "completion_percent", label: "Completion", header: "Done", format: (v) => `${Math.round(v)}%` },
  { key: "avg_ai_score", label: "Avg AI score", header: "Score", format: (v) => `${Math.round(v)}` },
  { key: "avg_xp", label: "Avg XP", header: "XP", format: (v) => Math.round(v).toLocaleString("en-IN") },
];

function weightedSummary(rows) {
  const students = rows.reduce((sum, r) => sum + (r.student_count ?? 0), 0);
  if (!students) return null;
  const avg = (key) => rows.reduce((sum, r) => sum + r[key] * r.student_count, 0) / students;
  return {
    student_count: students,
    completion_percent: avg("completion_percent"),
    avg_ai_score: avg("avg_ai_score"),
    avg_xp: avg("avg_xp"),
  };
}

// rootGroup comes from the class filter: null means the whole institution.
// refreshKey changes when groups are added, so the current level reloads.
// onFocusChange receives the id of the grade/section being viewed (null for the whole institution).
export default function PerformanceByClass({ rootGroup, refreshKey, onFocusChange }) {
  const { accessToken } = useAuth();
  const [path, setPath] = useState([]);
  const [metricKey, setMetricKey] = useState("completion_percent");
  const [view, setView] = useState({ levelLabel: "Grade", rows: [], isStudents: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => setPath([]), [rootGroup?.id]);

  const current = path.length ? path[path.length - 1] : rootGroup;
  const showStudents = current ? current.has_children === false : false;

  useEffect(() => onFocusChange?.(current?.id ?? null), [current?.id, onFocusChange]);

  useEffect(() => {
    if (!accessToken) {
      const summary = sampleGroupSummary(current?.id);
      setView(showStudents
        ? { levelLabel: "Student", rows: sampleGroupStudents(current.id).students, isStudents: true }
        : { levelLabel: summary.level_label, rows: summary.groups, isStudents: false });
      setIsLoading(false);
      setError("");
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError("");

    const request = showStudents
      ? getGroupStudents(accessToken, current.id).then((d) => ({
          levelLabel: "Student", rows: d.students, isStudents: true,
        }))
      : getGroupSummary(accessToken, current?.id).then((d) => ({
          levelLabel: d.level_label, rows: d.groups, isStudents: false,
        }));

    request
      .then((next) => !cancelled && setView(next))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setIsLoading(false));

    return () => { cancelled = true; };
  }, [accessToken, current?.id, showStudents, refreshKey]);

  const metric = METRICS.find((m) => m.key === metricKey);
  const values = view.rows.map((r) => r[metricKey]);
  const high = Math.max(...values);
  const low = Math.min(...values);
  const scaleMax = metricKey === "avg_xp" ? Math.max(high, 1) * 1.1 : 100;

  const summary = useMemo(
    () =>
      weightedSummary(
        view.isStudents ? view.rows.map((r) => ({ ...r, student_count: 1 })) : view.rows,
      ),
    [view],
  );

  const crumbs = [{ id: rootGroup?.id ?? "root", name: rootGroup?.name ?? "All grades" }, ...path];

  return (
    <section className="inst-card inst-perf" aria-labelledby="inst-perf-title">
      <div className="inst-card-head">
        <div>
          <h2 id="inst-perf-title" className="inst-card-title">Performance by class</h2>
          <p className="inst-card-sub">Select a row to see what's inside it.</p>
        </div>
        <div className="inst-segmented" role="group" aria-label="Metric">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={m.key === metricKey}
              className={m.key === metricKey ? "is-on" : ""}
              onClick={() => setMetricKey(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="inst-perf-meta">
        <nav aria-label="Breadcrumb" className="inst-crumbs">
          {crumbs.map((crumb, i) =>
            i < crumbs.length - 1 ? (
              <span key={crumb.id}>
                <button type="button" onClick={() => setPath(path.slice(0, i))}>{crumb.name}</button>
                <span aria-hidden="true" className="inst-crumb-sep">/</span>
              </span>
            ) : (
              <span key={crumb.id} aria-current="page" className="inst-crumb-current">{crumb.name}</span>
            ),
          )}
        </nav>
        {summary && (
          <span className="inst-perf-summary">
            {summary.student_count != null && `${summary.student_count} students · `}
            {Math.round(summary.completion_percent)}% completion · avg score {Math.round(summary.avg_ai_score)} · avg{" "}
            {Math.round(summary.avg_xp).toLocaleString("en-IN")} XP
          </span>
        )}
      </div>

      <div className="inst-table-scroll">
        <div className="inst-table inst-table-body">
          <div className="inst-row inst-row--head">
            <span>{view.levelLabel}</span>
            <span>Distribution</span>
            <span className="inst-num">{metric.header}</span>
            <span className="inst-num">Students</span>
            <span />
          </div>

          {error && <p className="inst-error">Couldn't load class performance. {error}</p>}
          {isLoading && !error && <div className="inst-skeleton" style={{ height: 220 }} />}

          {!isLoading && !error && view.rows.map((row) => {
            const value = row[metricKey];
            const isLow = view.rows.length > 1 && value === low;
            const isTop = view.rows.length > 1 && value === high && !isLow;
            const cells = (
              <>
                <span className="inst-row-name">
                  {row.name}
                  {isTop && <span className="inst-tag inst-tag--top">Top</span>}
                  {isLow && <span className="inst-tag inst-tag--low">Needs help</span>}
                </span>
                <span className="inst-bar-track">
                  <span
                    className={`inst-bar-fill${isLow ? " is-low" : ""}`}
                    style={{ width: `${Math.round((value / scaleMax) * 100)}%` }}
                  />
                </span>
                <span className="inst-num inst-strong">{metric.format(value)}</span>
                <span className="inst-num inst-muted">{row.student_count ?? "—"}</span>
              </>
            );

            return view.isStudents ? (
              <div key={row.id} className="inst-row">{cells}<span /></div>
            ) : (
              <button
                key={row.id}
                type="button"
                className="inst-row inst-row--click"
                onClick={() => setPath([...path, row])}
                aria-label={`Open ${row.name}, ${metric.format(value)}`}
              >
                {cells}
                <Icon name="chevron" size={16} />
              </button>
            );
          })}

          {!isLoading && !error && view.rows.length === 0 && (
            <p className="inst-empty">No groups yet. Add grades and sections from the Groups page.</p>
          )}
        </div>
      </div>
    </section>
  );
}
