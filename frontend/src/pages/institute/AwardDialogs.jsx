import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { ChannelPicker } from "./InstituteShared";
import { AWARD_TYPES, awardNameTaken, awardTypeLabel, listAwards, listRecognitions, recipientInfo } from "./awardsData";
import { certificateHeading, downloadCertificate } from "./certificate";
import { listTeams } from "./groupsData";
import { DEFAULT_CHANNELS } from "./notificationsData";
import { listStudents } from "./studentsData";
import { avatarTone, formatDate, initials } from "./studentFormat";

function DialogHead({ id, title, subtitle, onClose }) {
  return (
    <div className="stu-dialog-head">
      <div>
        <h2 id={id} className="inst-card-title">{title}</h2>
        {subtitle && <p className="inst-subtitle">{subtitle}</p>}
      </div>
      <button type="button" className="stu-icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
    </div>
  );
}

// Create an innovation award or recognition (BRD 12.5, AI088).
export function AwardFormDialog({ onSubmit, onClose }) {
  const ref = useModalDialog(onClose);
  const [name, setName] = useState("");
  const [type, setType] = useState("innovation");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length < 3) return setError("Give the award a name.");
    if (awardNameTaken(name)) return setError("An award with this name already exists.");
    if (description.trim().length < 10) return setError("Describe what the award is for.");
    onSubmit({ name, type, description, criteria });
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog" aria-labelledby="awd-form-title">
      <form onSubmit={submit} noValidate>
        <DialogHead id="awd-form-title" title="Create an award" subtitle="Awards can be given to students or teams and come with a certificate." onClose={() => ref.current?.close()} />
        <div className="stu-form-grid">
          <label className="inst-field inst-field--full">
            <span>Award name</span>
            <input type="text" value={name} maxLength={60} placeholder="e.g. Most Creative Prototype" onChange={(e) => { setName(e.target.value); setError(""); }} />
          </label>
          <fieldset className="inst-field--full awd-types">
            <legend>Type</legend>
            {AWARD_TYPES.map((t) => (
              <label key={t.key} className={type === t.key ? "is-on" : undefined}>
                <input type="radio" name="awd-type" checked={type === t.key} onChange={() => setType(t.key)} />
                <span><strong>{t.label}</strong><small>{t.blurb} Given to {t.recipient === "team" ? "teams" : "students"}.</small></span>
              </label>
            ))}
          </fieldset>
          <label className="inst-field inst-field--full">
            <span>What it's for</span>
            <textarea rows={2} value={description} maxLength={200} placeholder="Shown on the certificate if no personal note is added." onChange={(e) => { setDescription(e.target.value); setError(""); }} />
          </label>
          <label className="inst-field inst-field--full">
            <span>How winners are chosen (optional)</span>
            <input type="text" value={criteria} maxLength={120} placeholder="e.g. Highest mentor rating this term" onChange={(e) => setCriteria(e.target.value)} />
          </label>
        </div>
        {error && <p className="inst-form-error" role="alert">{error}</p>}
        <div className="inst-dialog-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="inst-btn inst-btn--primary">Create award</button>
        </div>
      </form>
    </dialog>
  );
}

// Give an award to a student or team, with an optional certificate and notification (AI088–AI090).
export function GiveAwardDialog({ presetAwardId, presetRecipient, onSubmit, onClose }) {
  const ref = useModalDialog(onClose);
  const awards = listAwards();
  const [awardId, setAwardId] = useState(presetAwardId ?? (presetRecipient?.kind === "team" ? awards.find((a) => a.type === "team")?.id : awards.find((a) => a.type !== "team")?.id) ?? "");
  const award = awards.find((a) => a.id === awardId);
  const kind = award?.type === "team" ? "team" : "student";
  const [recipientId, setRecipientId] = useState(presetRecipient?.id ?? "");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [certificate, setCertificate] = useState(true);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [error, setError] = useState("");

  const already = new Set(listRecognitions().filter((r) => r.awardId === awardId).map((r) => r.recipient.id));
  const q = query.trim().toLowerCase();
  const options = kind === "team"
    ? listTeams().map((t) => ({ id: t.id, name: t.name, detail: `${t.memberIds.length} members` }))
    : listStudents().filter((s) => s.status === "active").map((s) => ({ id: s.id, name: s.name, detail: `${s.gradeName} · ${s.sectionName} · ${s.xp.toLocaleString("en-IN")} XP`, xp: s.xp })).sort((a, b) => b.xp - a.xp);
  const shown = options.filter((o) => !q || o.name.toLowerCase().includes(q)).slice(0, 60);
  const chosen = options.find((o) => o.id === recipientId);

  const submit = (e) => {
    e.preventDefault();
    if (!award) return setError("Choose an award.");
    if (!chosen) return setError(`Choose a ${kind} to receive it.`);
    if (already.has(chosen.id)) return setError(`${chosen.name} already has this award.`);
    onSubmit({ awardId, recipient: { kind, id: chosen.id }, note, certificate, channels });
    ref.current?.close();
  };

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog stu-dialog--wide" aria-labelledby="awd-give-title">
      <form onSubmit={submit} noValidate>
        <DialogHead id="awd-give-title" title="Give an award" subtitle="The recipient is notified and can download their certificate." onClose={() => ref.current?.close()} />
        <div className="grp-team-form">
          <div className="grp-team-picker">
            <label className="inst-field">
              <span>Award</span>
              <select value={awardId} onChange={(e) => {
                const next = awards.find((a) => a.id === e.target.value);
                setAwardId(e.target.value);
                if ((next?.type === "team") !== (kind === "team")) setRecipientId("");
                setError("");
              }}>
                {AWARD_TYPES.map((t) => (
                  <optgroup key={t.key} label={t.label}>
                    {awards.filter((a) => a.type === t.key).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="grp-picker-tools">
              <label className="stu-search">
                <Icon name="search" size={16} />
                <span className="inst-sr-only">Search {kind === "team" ? "teams" : "students"}</span>
                <input type="search" value={query} placeholder={`Search ${kind === "team" ? "teams" : "students"}`} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
            <ul className="grp-people grp-people--picker" aria-label={kind === "team" ? "Teams" : "Students, highest XP first"}>
              {shown.map((o) => (
                <li key={o.id}>
                  <label className={`${o.id === recipientId ? "is-selected" : ""}${already.has(o.id) ? " is-disabled" : ""}`}>
                    <input type="radio" name="awd-recipient" checked={o.id === recipientId} disabled={already.has(o.id)} onChange={() => { setRecipientId(o.id); setError(""); }} />
                    <span className={`stu-avatar ${kind === "team" ? "grp-team-badge grp-mini-avatar" : `stu-avatar--${avatarTone(o.id)}`}`} aria-hidden="true">{initials(o.name)}</span>
                    <span className="grp-person-text">
                      <strong>{o.name}</strong>
                      <small>{already.has(o.id) ? "Already received this award" : o.detail}</small>
                    </span>
                  </label>
                </li>
              ))}
              {!shown.length && <li className="stu-muted grp-none">No matches.</li>}
            </ul>
          </div>
          <div className="grp-team-summary">
            <h3>{chosen ? chosen.name : `Choose a ${kind}`}</h3>
            <p className="stu-muted awd-summary-award">{award ? `${award.name} · ${awardTypeLabel(award.type)}` : ""}</p>
            <label className="inst-field">
              <span>Personal note (optional)</span>
              <textarea rows={3} value={note} maxLength={160} placeholder="Printed on the certificate, e.g. For the waste-sorting prototype." onChange={(e) => setNote(e.target.value)} />
            </label>
            <label className="grp-check-all">
              <input type="checkbox" checked={certificate} onChange={(e) => setCertificate(e.target.checked)} />
              Issue a PDF certificate
            </label>
            <ChannelPicker value={channels} onChange={setChannels} legend={`Notify the ${kind === "team" ? "team" : "student"} by`} />
          </div>
        </div>
        {error && <p className="inst-form-error" role="alert">{error}</p>}
        <div className="inst-dialog-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="inst-btn inst-btn--primary"><Icon name="awards" size={16} /> Give award</button>
        </div>
      </form>
    </dialog>
  );
}

// On-screen preview of a certificate with a download button.
export function CertificatePreview({ rec, award, instituteName, onDownloaded, onClose }) {
  const ref = useModalDialog(onClose);
  const who = recipientInfo(rec.recipient);
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const file = await downloadCertificate({
        instituteName, award, recipientName: who.name, recipientDetail: who.detail,
        awardedOn: rec.awardedOn, certificateNo: rec.certificateNo, note: rec.note,
      });
      onDownloaded(file);
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog ref={ref} className="inst-dialog stu-dialog stu-dialog--wide" aria-labelledby="awd-preview-title">
      <DialogHead id="awd-preview-title" title="Certificate preview" subtitle={`${rec.certificateNo} · ${who.name}`} onClose={() => ref.current?.close()} />
      <div className="awd-cert" aria-label="Certificate">
        <div className="awd-cert-inner">
          <p className="awd-cert-school">{instituteName}</p>
          <p className="awd-cert-title">Certificate</p>
          <p className="awd-cert-kind">{certificateHeading(award.type).toLowerCase()}</p>
          <p className="awd-cert-small">This certificate is proudly presented to</p>
          <p className="awd-cert-name">{who.name}</p>
          {who.detail && <p className="awd-cert-small">{who.detail}</p>}
          <p className="awd-cert-for">in recognition of receiving the <strong>{award.name}</strong></p>
          <p className="awd-cert-note">{rec.note || award.description}</p>
          <div className="awd-cert-foot">
            <span>Principal</span>
            <span className="awd-cert-seal">Award</span>
            <span>Innovation Coordinator</span>
          </div>
          <div className="awd-cert-meta"><span>Awarded {formatDate(rec.awardedOn)}</span><span>Certificate no. {rec.certificateNo}</span></div>
        </div>
      </div>
      <div className="inst-dialog-actions">
        <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Close</button>
        <button type="button" className="inst-btn inst-btn--primary" onClick={download} disabled={busy}>
          <Icon name="download" size={16} /> {busy ? "Preparing…" : "Download PDF"}
        </button>
      </div>
    </dialog>
  );
}

// Recipients of one award, with certificate actions.
export function AwardDrawer({ award, onGive, onPreview, onIssue, onRevoke, onDelete, onClose }) {
  const ref = useModalDialog(onClose);
  const recs = listRecognitions().filter((r) => r.awardId === award.id).sort((a, b) => b.awardedOn - a.awardedOn);
  return (
    <dialog ref={ref} className="stu-drawer" aria-labelledby="awd-drawer-title"
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <div className="stu-drawer-inner">
        <header className="stu-drawer-head chl-drawer-head">
          <button type="button" className="stu-icon-btn stu-drawer-close" aria-label="Close" onClick={() => ref.current?.close()}><Icon name="close" size={18} /></button>
          <span className={`awd-badge awd-badge--${award.type} awd-badge--lg`} aria-hidden="true"><Icon name={award.type === "team" ? "students" : award.type === "innovation" ? "bolt" : "star"} size={26} /></span>
          <div className="stu-drawer-id">
            <h2 id="awd-drawer-title">{award.name}</h2>
            <p>{awardTypeLabel(award.type)}</p>
          </div>
        </header>
        <div className="stu-drawer-body">
          <section className="stu-section">
            <h3>About this award</h3>
            <p className="chl-summary">{award.description}</p>
            {award.criteria && <p className="stu-section-sub chl-reward">Chosen by: {award.criteria}</p>}
          </section>
          <section className="stu-section">
            <h3>Recipients <span className="stu-count">{recs.length}</span></h3>
            {recs.length ? (
              <ul className="grp-members">
                {recs.map((r) => {
                  const who = recipientInfo(r.recipient);
                  return (
                    <li key={r.id}>
                      <span className={`stu-avatar ${r.recipient.kind === "team" ? "grp-team-badge" : `stu-avatar--${avatarTone(r.recipient.id)}`}`} aria-hidden="true">{initials(who.name)}</span>
                      <span className="grp-person-text">
                        <strong>{who.name}</strong>
                        <small>{formatDate(r.awardedOn)} · {r.certificateNo ?? "No certificate"}</small>
                      </span>
                      {r.certificateNo ? (
                        <button type="button" className="stu-icon-btn" title="View certificate" aria-label={`View ${who.name}'s certificate`} onClick={() => onPreview(r)}><Icon name="file" size={16} /></button>
                      ) : (
                        <button type="button" className="inst-pill-btn" onClick={() => onIssue(r)}>Issue certificate</button>
                      )}
                      <button type="button" className="stu-icon-btn stu-icon-btn--danger" title="Revoke" aria-label={`Revoke ${who.name}'s award`} onClick={() => onRevoke(r)}><Icon name="close" size={16} /></button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="stu-muted">Nobody has received this award yet.</p>}
          </section>
        </div>
        <footer className="stu-drawer-foot">
          <button type="button" className="inst-btn stu-btn-danger" onClick={() => onDelete(award)}><Icon name="ban" size={16} /> Delete award</button>
          <button type="button" className="inst-btn inst-btn--primary" onClick={() => onGive(award)}><Icon name="awards" size={16} /> Give this award</button>
        </footer>
      </div>
    </dialog>
  );
}
