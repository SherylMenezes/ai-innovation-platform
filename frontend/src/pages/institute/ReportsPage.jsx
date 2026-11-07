import { useState } from "react";
import Icon from "./InstituteIcons";
import useToast from "./useToast";
import { BarList, ChartCard, Columns, LineChart, StackedBars } from "./Charts";
import { PageHero, Toast } from "./InstituteShared";
import { NEUTRAL, SERIES, STATUS } from "./chartPalette";
import { RANGES, buildReport, reportTables } from "./reportsData";
import { exportReportExcel, exportReportPdf } from "./reportExport";
import { sampleDashboard } from "./sampleData";
import { getClassOptions } from "./studentsData";
import "./Students.css";
import "./Groups.css";
import "./InstituteModules.css";

const SUBMISSION_SERIES = [
  { key: "submitted", label: "Submitted", color: STATUS.submitted },
  { key: "in-progress", label: "In progress", color: STATUS["in-progress"] },
  { key: "not-started", label: "Not started", color: STATUS["not-started"] },
];

function Kpi({ kpi }) {
  const up = kpi.delta > 0;
  return (
    <div className="stu-tile grp-tile rep-kpi">
      <span className="stu-tile-text">
        <span>{kpi.label}</span>
        <strong>{kpi.value}</strong>
        {kpi.delta != null ? (
          <small className={`rep-delta rep-delta--${up ? "up" : kpi.delta < 0 ? "down" : "flat"}`}>
            <Icon name={up ? "sortUp" : kpi.delta < 0 ? "sortDown" : "sort"} size={13} strokeWidth={2.6} />
            {up ? "+" : ""}{kpi.delta.toLocaleString("en-IN")}{kpi.deltaUnit}
          </small>
        ) : <small>{kpi.note}</small>}
      </span>
    </div>
  );
}

export default function ReportsPage() {
  const grades = getClassOptions();
  const [range, setRange] = useState("12w");
  const [classId, setClassId] = useState("");
  const [busy, setBusy] = useState("");
  const [toast, showToast] = useToast();

  const report = buildReport({ range, classId });
  const tables = reportTables(report);
  const table = (id) => tables.find((t) => t.id === id);
  const instituteName = sampleDashboard.institute_name;

  const doExport = async (kind) => {
    setBusy(kind);
    try {
      const payload = { instituteName, filters: report.filters, kpis: report.kpis, tables };
      const name = kind === "pdf" ? await exportReportPdf(payload) : await exportReportExcel(payload);
      showToast(`Downloaded ${name}`);
    } catch {
      showToast(`Couldn't create the ${kind === "pdf" ? "PDF" : "Excel file"}. Please try again.`);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="stu-page">
      <PageHero
        eyebrow={`Insights · ${instituteName}`}
        title="Reports"
        summary={`${report.filters.rangeLabel} · ${report.filters.classLabel}`}
        description="Submission, completion, score, badge and AI usage reports, benchmarked against the platform."
        actions={
          <>
            <button type="button" className="inst-btn inst-btn--outline" disabled={Boolean(busy)} onClick={() => doExport("pdf")}>
              <Icon name="download" size={16} /> {busy === "pdf" ? "Preparing…" : "Export PDF"}
            </button>
            <button type="button" className="inst-btn inst-btn--primary" disabled={Boolean(busy)} onClick={() => doExport("excel")}>
              <Icon name="download" size={16} /> {busy === "excel" ? "Preparing…" : "Export Excel"}
            </button>
          </>
        }
      />

      <div className="inst-card grp-team-toolbar rep-filters">
        <div className="inst-segmented" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.key} type="button" aria-pressed={range === r.key} className={range === r.key ? "is-on" : ""} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        <label className="stu-select">
          <span className="inst-sr-only">Class</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">All classes</option>
            {grades.map((g) => (
              <optgroup key={g.id} label={g.name}>
                <option value={g.id}>All of {g.name}</option>
                {g.sections.map((s) => <option key={s.id} value={s.id}>{g.name} · {s.name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <span className="stu-results">Filters apply to every report and export</span>
      </div>

      <div className="stu-tiles">{report.kpis.map((k) => <Kpi key={k.key} kpi={k} />)}</div>

      <h2 className="rep-heading">Institution analytics</h2>
      <div className="rep-grid">
        <ChartCard
          id="rep-trend" title="Participation trend" subtitle="Share of students active in a challenge each week"
          legend={[{ label: "Your institute", color: SERIES.blue, shape: "line" }, { label: "Platform average", color: NEUTRAL, shape: "line" }]}
          table={table("trend")}
        >
          <LineChart
            labels={report.trend.labels}
            max={100}
            format={(v) => `${Math.round(v)}%`}
            series={[
              { key: "you", label: "Your institute", short: "you", color: SERIES.blue, values: report.trend.participationTrend },
              { key: "platform", label: "Platform average", short: "platform", color: NEUTRAL, values: report.trend.platformTrend },
            ]}
          />
        </ChartCard>
        <ChartCard id="rep-completion" title="Completion rate by class" subtitle="Students who submitted, against the platform average" table={table("completion-by-class")}>
          <BarList
            data={report.groupStats.map((g) => ({ key: g.id, label: g.label, value: g.completion, valueLabel: `${g.completion}%` }))}
            color={SERIES.blue} max={100} unit="Completion" format={(v) => `${v}%`}
            benchmark={report.platformCompletion} benchmarkLabel="Platform average"
          />
        </ChartCard>
      </div>

      <h2 className="rep-heading">Submissions</h2>
      <div className="rep-grid">
        <ChartCard id="rep-submitted" title="Submitted vs not submitted" subtitle="Every assignment, by student status" legend={SUBMISSION_SERIES.map((s) => ({ label: s.label, color: s.color }))} table={table("submitted")}>
          <StackedBars data={report.submissions} series={SUBMISSION_SERIES} />
        </ChartCard>
        <ChartCard id="rep-challenges" title="Challenge completion" subtitle="Share of assigned students who submitted, per challenge" table={table("challenge-completion")}>
          <BarList
            data={report.challengeCompletion.map((c) => ({ ...c, valueLabel: `${c.value}%` }))}
            color={SERIES.green} max={100} unit="Completion" format={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      <h2 className="rep-heading">Scores &amp; performance</h2>
      <div className="rep-grid">
        <ChartCard id="rep-scores" title="Innovation score distribution" subtitle="Students by average AI evaluation score" table={table("scores")}>
          <Columns data={report.scoreBins} color={SERIES.purple} />
        </ChartCard>
        <ChartCard id="rep-class-scores" title="Average score by class" subtitle="Against the institution average" table={table("performance")}>
          <BarList
            data={report.groupStats.filter((g) => g.score != null).map((g) => ({ key: g.id, label: g.label, value: g.score }))}
            color={SERIES.purple} max={100} unit="Avg score"
            benchmark={report.institutionAvgScore} benchmarkLabel="Institution average"
          />
        </ChartCard>
      </div>

      <section className="inst-card stu-list" aria-labelledby="rep-perf-title">
        <header className="ch-card-head rep-perf-head">
          <div>
            <h2 id="rep-perf-title" className="inst-card-title">Performance analysis</h2>
            <p className="inst-card-sub">Each class against the institution and platform benchmarks.</p>
          </div>
        </header>
        <div className="stu-table-wrap">
          <table className="stu-table rep-table">
            <thead>
              <tr>{table("performance").columns.map((c, i) => <th key={c} scope="col" className={i && i < 6 ? "lb-num" : undefined}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {report.groupStats.map((g) => (
                <tr key={g.id}>
                  <td><strong className="asg-target">{g.label}</strong></td>
                  <td className="lb-num">{g.students}</td>
                  <td className="lb-num">{g.participation}%</td>
                  <td className="lb-num">
                    {g.completion}%{" "}
                    <span className={`rep-vs rep-vs--${g.completion >= report.platformCompletion ? "up" : "down"}`}>
                      {g.completion >= report.platformCompletion ? "+" : ""}{g.completion - report.platformCompletion}
                    </span>
                  </td>
                  <td className="lb-num">{g.score ?? "—"}</td>
                  <td className="lb-num">{g.xp.toLocaleString("en-IN")}</td>
                  <td>{g.top}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ch-note rep-perf-note">Completion difference is in percentage points against the platform average ({report.platformCompletion}%).</p>
      </section>

      <h2 className="rep-heading">Engagement</h2>
      <div className="rep-grid">
        <ChartCard id="rep-badges" title="Badge distribution" subtitle="Active students holding each badge" table={table("badges")}>
          <BarList data={report.badgeCounts} color={SERIES.amber} unit="Students" />
        </ChartCard>
        <ChartCard
          id="rep-ai" title="AI usage analytics" subtitle="AI mentor sessions and AI evaluations per week"
          legend={[{ label: "AI mentor sessions", color: SERIES.pink, shape: "line" }, { label: "AI evaluations", color: SERIES.blue, shape: "line" }]}
          table={table("ai")}
        >
          <div className="rep-ai-stats">
            <span><strong>{report.ai.totals.sessions.toLocaleString("en-IN")}</strong> mentor sessions</span>
            <span><strong>{report.ai.totals.evaluations.toLocaleString("en-IN")}</strong> evaluations</span>
            <span><strong>{report.ai.totals.ideas.toLocaleString("en-IN")}</strong> ideas generated</span>
            <span><strong>{report.ai.totals.perStudent}</strong> sessions per student</span>
          </div>
          <LineChart
            labels={report.ai.labels}
            series={[
              { key: "sessions", label: "AI mentor sessions", short: "sessions", color: SERIES.pink, values: report.ai.mentorSessions },
              { key: "evals", label: "AI evaluations", short: "evals", color: SERIES.blue, values: report.ai.aiEvaluations },
            ]}
          />
        </ChartCard>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
