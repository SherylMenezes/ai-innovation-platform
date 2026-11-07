import { useState } from "react";
import Icon from "./InstituteIcons";
import useToast from "./useToast";
import { AwardDrawer, AwardFormDialog, CertificatePreview, GiveAwardDialog } from "./AwardDialogs";
import { ConfirmDialog } from "./GroupsShared";
import { NotificationLog, PageHero, Tabs, Toast } from "./InstituteShared";
import {
  AWARD_TYPES, awardById, awardTypeLabel, createAward, deleteAward, giveAward, issueCertificate, listAwards,
  listRecognitions, recipientInfo, revokeRecognition,
} from "./awardsData";
import { average } from "./groupsData";
import { rankings } from "./leaderboardData";
import { listNotifications } from "./notificationsData";
import { sampleDashboard } from "./sampleData";
import { avatarTone, formatDate, formatXp, initials } from "./studentFormat";
import "./Students.css";
import "./Groups.css";
import "./InstituteModules.css";

const ICON = { innovation: "bolt", "top-student": "star", team: "students" };

export default function AwardsPage() {
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState("awards");
  const [creating, setCreating] = useState(false);
  const [giving, setGiving] = useState(null); // { awardId?, recipient? }
  const [openId, setOpenId] = useState(null);
  const [preview, setPreview] = useState(null); // recognition id
  const [confirm, setConfirm] = useState(null); // { title, body, label, action }
  const [query, setQuery] = useState("");
  const [toast, showToast] = useToast();
  const instituteName = sampleDashboard.institute_name;

  const refresh = (message) => {
    setVersion((v) => v + 1);
    if (message) showToast(message);
  };

  const awards = listAwards();
  const recs = listRecognitions();
  const certificates = recs.filter((r) => r.certificateNo).sort((a, b) => b.awardedOn - a.awardedOn);
  const open = awards.find((a) => a.id === openId);
  const previewRec = recs.find((r) => r.id === preview);
  const recipientsOf = (awardId) => recs.filter((r) => r.awardId === awardId);
  const awardsFor = (id) => recs.filter((r) => r.recipient.id === id).map((r) => awardById(r.awardId)?.name).filter(Boolean);
  // Recognise starts on an award the recipient doesn't already hold, preferring `preferType`.
  const freshAward = (recipient, preferType) => {
    const held = new Set(recs.filter((r) => r.recipient.id === recipient.id).map((r) => r.awardId));
    const fits = awards.filter((a) => (recipient.kind === "team") === (a.type === "team") && !held.has(a.id));
    return (fits.find((a) => a.type === preferType) ?? fits[0])?.id;
  };
  const recognise = (recipient, preferType) => setGiving({ recipient, awardId: freshAward(recipient, preferType) });

  const topStudents = rankings("institution", { metric: "xp" }).slice(0, 10);
  const topTeams = rankings("team", { metric: "score" });
  const q = query.trim().toLowerCase();
  const shownCerts = certificates.filter((r) => {
    if (!q) return true;
    return recipientInfo(r.recipient).name.toLowerCase().includes(q) || r.certificateNo.toLowerCase().includes(q) || awardById(r.awardId)?.name.toLowerCase().includes(q);
  });

  const onGive = (fields) => {
    const rec = giveAward(fields);
    const who = recipientInfo(fields.recipient);
    refresh(`${awardById(fields.awardId)?.name} given to ${who.name}${rec.certificateNo ? ` · certificate ${rec.certificateNo}` : ""}.`);
  };

  return (
    <div className="stu-page">
      <PageHero
        eyebrow={`Insights · ${instituteName}`}
        title="Awards"
        summary={`${awards.length} awards · ${recs.length} given · ${certificates.length} certificates issued`}
        description="Create innovation awards, recognise top students and teams, and issue PDF certificates."
        actions={
          <>
            <button type="button" className="inst-btn inst-btn--outline" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} strokeWidth={2.4} /> Create award
            </button>
            <button type="button" className="inst-btn inst-btn--primary" onClick={() => setGiving({})}>
              <Icon name="awards" size={18} /> Give award
            </button>
          </>
        }
      />

      <Tabs
        tabs={[
          { key: "awards", label: "Awards", icon: "awards", count: awards.length },
          { key: "recognition", label: "Recognition", icon: "star" },
          { key: "certificates", label: "Certificates", icon: "file", count: certificates.length },
        ]}
        value={tab} onChange={setTab} label="Awards" idPrefix="awd"
      />

      <div id="awd-panel" role="tabpanel" aria-labelledby={`awd-tab-${tab}`} className="stu-page">
        {tab === "awards" && (
          <>
            {AWARD_TYPES.map((type) => {
              const list = awards.filter((a) => a.type === type.key);
              return (
                <section key={type.key} aria-labelledby={`awd-type-${type.key}`}>
                  <h2 id={`awd-type-${type.key}`} className="rep-heading">{type.label}s <span className="stu-count">{list.length}</span></h2>
                  <div className="awd-grid">
                    {list.map((a) => {
                      const given = recipientsOf(a.id);
                      return (
                        <article key={a.id} className="inst-card awd-card">
                          <div className="awd-card-head">
                            <span className={`awd-badge awd-badge--${a.type}`} aria-hidden="true"><Icon name={ICON[a.type]} size={20} /></span>
                            <div>
                              <h3><button type="button" onClick={() => setOpenId(a.id)}>{a.name}</button></h3>
                              <small>{awardTypeLabel(a.type)}</small>
                            </div>
                          </div>
                          <p className="awd-card-text">{a.description}</p>
                          {a.criteria && <p className="awd-criteria"><Icon name="target" size={14} /> {a.criteria}</p>}
                          <div className="awd-card-foot">
                            <span className="grp-avatars" aria-label={`${given.length} recipients`}>
                              {given.slice(0, 4).map((r) => (
                                <span key={r.id} className={`stu-avatar grp-mini-avatar ${r.recipient.kind === "team" ? "grp-team-badge" : `stu-avatar--${avatarTone(r.recipient.id)}`}`} title={recipientInfo(r.recipient).name} aria-hidden="true">
                                  {initials(recipientInfo(r.recipient).name)}
                                </span>
                              ))}
                              <span className="grp-member-count">{given.length ? `${given.length} given` : "Not given yet"}</span>
                            </span>
                            <button type="button" className="inst-pill-btn" onClick={() => setGiving({ awardId: a.id })}>Give</button>
                          </div>
                        </article>
                      );
                    })}
                    <button type="button" className="grp-team-new awd-new" onClick={() => setCreating(true)}>
                      <span className="stu-drop-icon"><Icon name="plus" size={20} /></span>
                      <strong>New {type.label.toLowerCase()}</strong>
                    </button>
                  </div>
                </section>
              );
            })}
            <section className="inst-card awd-log" aria-labelledby="awd-log-title">
              <h2 id="awd-log-title" className="inst-card-title">Award notifications</h2>
              <p className="inst-card-sub">Recipients are told in the app, by email and by push when they receive an award.</p>
              <NotificationLog items={listNotifications().filter((n) => n.kind === "award").slice(0, 6)} empty="No award notifications yet." />
            </section>
          </>
        )}

        {tab === "recognition" && (
          <div className="rep-grid">
            <section className="inst-card stu-list" aria-labelledby="awd-top-students">
              <header className="ch-card-head rep-perf-head">
                <div>
                  <h2 id="awd-top-students" className="inst-card-title">Top students</h2>
                  <p className="inst-card-sub">Highest XP in the institute right now.</p>
                </div>
              </header>
              <ol className="awd-rank-list">
                {topStudents.map((s) => (
                  <li key={s.id}>
                    <span className={`lb-rank${s.rank <= 3 ? ` lb-rank--${s.rank}` : ""}`}>{s.rank}</span>
                    <span className={`stu-avatar stu-avatar--${avatarTone(s.id)}`} aria-hidden="true">{initials(s.name)}</span>
                    <span className="grp-person-text">
                      <strong>{s.name}</strong>
                      <small>{s.detail} · {formatXp(s.xp)} XP · score {s.score ?? "—"}</small>
                      {awardsFor(s.id).length > 0 && <span className="awd-held">{awardsFor(s.id).map((n) => <em key={n}>{n}</em>)}</span>}
                    </span>
                    <button type="button" className="inst-pill-btn" onClick={() => recognise({ kind: "student", id: s.id }, "top-student")}>
                      Recognise
                    </button>
                  </li>
                ))}
              </ol>
            </section>
            <section className="inst-card stu-list" aria-labelledby="awd-top-teams">
              <header className="ch-card-head rep-perf-head">
                <div>
                  <h2 id="awd-top-teams" className="inst-card-title">Top teams</h2>
                  <p className="inst-card-sub">Highest average score across team members.</p>
                </div>
              </header>
              <ol className="awd-rank-list">
                {topTeams.map((t) => (
                  <li key={t.id}>
                    <span className={`lb-rank${t.rank <= 3 ? ` lb-rank--${t.rank}` : ""}`}>{t.rank}</span>
                    <span className="stu-avatar grp-team-badge" aria-hidden="true">{initials(t.name)}</span>
                    <span className="grp-person-text">
                      <strong>{t.name}</strong>
                      <small>{t.detail} · avg score {t.score ?? "—"} · {formatXp(t.xp)} XP</small>
                      {awardsFor(t.id).length > 0 && <span className="awd-held">{awardsFor(t.id).map((n) => <em key={n}>{n}</em>)}</span>}
                    </span>
                    <button type="button" className="inst-pill-btn" onClick={() => recognise({ kind: "team", id: t.id }, "team")}>
                      Recognise
                    </button>
                  </li>
                ))}
              </ol>
              <p className="ch-note rep-perf-note">Team averages: {average(topTeams.map((t) => t.score)) ?? "—"} across {topTeams.length} teams.</p>
            </section>
          </div>
        )}

        {tab === "certificates" && (
          <section className="inst-card stu-list" aria-label="Certificates">
            <div className="stu-toolbar">
              <label className="stu-search">
                <Icon name="search" size={18} />
                <span className="inst-sr-only">Search certificates</span>
                <input type="search" value={query} placeholder="Search by name, award or certificate number" onChange={(e) => setQuery(e.target.value)} />
              </label>
              <span className="stu-results">{shownCerts.length} of {certificates.length}</span>
            </div>
            <div className="stu-table-wrap">
              <table className="stu-table awd-table">
                <thead>
                  <tr>
                    <th scope="col">Certificate no.</th>
                    <th scope="col">Recipient</th>
                    <th scope="col">Award</th>
                    <th scope="col">Issued</th>
                    <th scope="col" className="asg-col-actions"><span className="inst-sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shownCerts.map((r) => {
                    const who = recipientInfo(r.recipient);
                    const award = awardById(r.awardId);
                    return (
                      <tr key={r.id} onClick={() => setPreview(r.id)}>
                        <td><strong className="asg-target awd-cert-no">{r.certificateNo}</strong></td>
                        <td>
                          <div className="stu-person">
                            <span className={`stu-avatar ${r.recipient.kind === "team" ? "grp-team-badge" : `stu-avatar--${avatarTone(r.recipient.id)}`}`} aria-hidden="true">{initials(who.name)}</span>
                            <div><strong className="asg-target">{who.name}</strong><span className="stu-email">{who.detail}</span></div>
                          </div>
                        </td>
                        <td>{award?.name}<span className="stu-email">{awardTypeLabel(award?.type)}</span></td>
                        <td>{formatDate(r.awardedOn)}</td>
                        <td className="stu-col-actions" onClick={(e) => e.stopPropagation()}>
                          <div className="stu-row-actions">
                            <button type="button" className="inst-pill-btn" onClick={() => setPreview(r.id)}>
                              <Icon name="download" size={14} /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!shownCerts.length && (
                <div className="stu-empty">
                  <span className="stu-drop-icon"><Icon name="file" size={22} /></span>
                  <strong>{q ? "No certificates match" : "No certificates issued yet"}</strong>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {open && (
        <AwardDrawer
          award={open}
          onGive={(a) => setGiving({ awardId: a.id })}
          onPreview={(r) => setPreview(r.id)}
          onIssue={(r) => { const issued = issueCertificate(r.id); refresh(`Certificate ${issued?.certificateNo} issued.`); }}
          onRevoke={(r) => setConfirm({
            title: `Revoke ${open.name} from ${recipientInfo(r.recipient).name}?`,
            body: "The award and its certificate are removed from their profile.",
            label: "Revoke award",
            action: () => { revokeRecognition(r.id); refresh("Award revoked."); },
          })}
          onDelete={(a) => setConfirm({
            title: `Delete ${a.name}?`,
            body: `This removes the award and the ${recipientsOf(a.id).length} times it was given, including their certificates.`,
            label: "Delete award",
            action: () => { deleteAward(a.id); setOpenId(null); refresh(`Deleted ${a.name}.`); },
          })}
          onClose={() => setOpenId(null)}
        />
      )}
      {creating && (
        <AwardFormDialog
          onSubmit={(fields) => { const a = createAward(fields); setTab("awards"); refresh(`Created ${a.name}.`); }}
          onClose={() => setCreating(false)}
        />
      )}
      {giving && (
        <GiveAwardDialog
          presetAwardId={giving.awardId}
          presetRecipient={giving.recipient}
          onSubmit={onGive}
          onClose={() => setGiving(null)}
        />
      )}
      {previewRec && (
        <CertificatePreview
          rec={previewRec}
          award={awardById(previewRec.awardId)}
          instituteName={instituteName}
          onDownloaded={(file) => showToast(`Downloaded ${file}`)}
          onClose={() => setPreview(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title} body={confirm.body} confirmLabel={confirm.label}
          onConfirm={confirm.action} onClose={() => setConfirm(null)}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
