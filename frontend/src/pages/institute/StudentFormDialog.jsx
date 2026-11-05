import { useState } from "react";
import Icon from "./InstituteIcons";
import useModalDialog from "./useModalDialog";
import { emailTaken, getClassOptions } from "./studentsData";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Add mode creates an invited student; edit mode changes an existing one.
// onSubmit(fields, { sendInvite }) saves; the dialog closes itself afterwards.
export default function StudentFormDialog({ mode, student, instituteName, onSubmit, onClose }) {
  const ref = useModalDialog(onClose);
  const grades = getClassOptions();
  const isEdit = mode === "edit";

  const [name, setName] = useState(student?.name ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [gradeId, setGradeId] = useState(student?.gradeId ?? grades[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(
    student?.sectionId ?? grades.find((g) => g.id === (student?.gradeId ?? grades[0]?.id))?.sections[0]?.id ?? "",
  );
  const [sendInvite, setSendInvite] = useState(true);
  const [errors, setErrors] = useState({});

  const grade = grades.find((g) => g.id === gradeId);

  const changeGrade = (id) => {
    setGradeId(id);
    setSectionId(grades.find((g) => g.id === id)?.sections[0]?.id ?? "");
    setErrors((e) => ({ ...e, section: undefined }));
  };

  const validate = () => {
    const next = {};
    if (name.trim().length < 2) next.name = "Enter the student's full name.";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address.";
    else if (emailTaken(email, student?.id)) next.email = "Another student already uses this email.";
    if (!grade) next.grade = "Choose a grade.";
    else if (!sectionId) next.section = `${grade.name} has no sections yet. Add one from the dashboard first.`;
    return next;
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit({ name, email, gradeId, sectionId }, { sendInvite });
    ref.current?.close();
  };

  const fieldProps = (key) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `stu-form-${key}-error` : undefined,
  });

  return (
    <dialog ref={ref} className="inst-dialog stu-dialog" aria-labelledby="stu-form-title">
      <form onSubmit={submit} noValidate>
        <div className="stu-dialog-head">
          <div>
            <h2 id="stu-form-title" className="inst-card-title">{isEdit ? "Edit student" : "Add a student"}</h2>
            <p className="inst-subtitle">
              {isEdit
                ? "Update this student's details or move them to another class."
                : `Add one student to ${instituteName} and send them an invite to join.`}
            </p>
          </div>
          <button type="button" className="stu-icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="stu-form-grid">
          <label className="inst-field inst-field--full">
            <span>Full name</span>
            <input
              type="text" value={name} maxLength={80} autoComplete="off" placeholder="e.g. Aarav Mehta"
              onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }}
              {...fieldProps("name")}
            />
            {errors.name && <small id="stu-form-name-error" className="stu-field-error">{errors.name}</small>}
          </label>

          <label className="inst-field inst-field--full">
            <span>Email address</span>
            <input
              type="email" value={email} maxLength={120} autoComplete="off" placeholder="student@school.edu"
              onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }}
              {...fieldProps("email")}
            />
            {errors.email && <small id="stu-form-email-error" className="stu-field-error">{errors.email}</small>}
          </label>

          <label className="inst-field">
            <span>Grade</span>
            <select value={gradeId} onChange={(e) => changeGrade(e.target.value)} {...fieldProps("grade")}>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {errors.grade && <small id="stu-form-grade-error" className="stu-field-error">{errors.grade}</small>}
          </label>

          <label className="inst-field">
            <span>Section</span>
            <select
              value={sectionId} onChange={(e) => setSectionId(e.target.value)}
              disabled={!grade?.sections.length} {...fieldProps("section")}
            >
              {!grade?.sections.length && <option value="">No sections</option>}
              {grade?.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.section && <small id="stu-form-section-error" className="stu-field-error">{errors.section}</small>}
          </label>
        </div>

        {!isEdit && (
          <label className="stu-check">
            <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} />
            <span>
              <strong>Send an invite email now</strong>
              <small>They'll appear as Invited until they sign up with the link.</small>
            </span>
          </label>
        )}

        <div className="inst-dialog-actions">
          <button type="button" className="inst-btn inst-btn--outline" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="inst-btn inst-btn--primary">
            {isEdit ? "Save changes" : sendInvite ? "Add and send invite" : "Add student"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
