import { useState } from "react";
import { ROLES } from "./roles";
import "./RoleAuthPage.css";

/**
 * Login / sign-up screen for one role. UI only for now: onSubmit receives
 * the form values so the real API calls can be wired in later.
 *
 * Props:
 *   role          "student" | "institution" | "company" | "admin"
 *   mode          "login" | "signup"   (admin is always login)
 *   onModeChange  (mode) => void
 *   onChangeRole  () => void           back to the role picker
 *   onBack        () => void           back to the landing page
 *   onSubmit      ({ role, mode, method, values }) => void
 */

const LEVELS = [
  { value: "grade_8_10", label: "Grade 8–10" },
  { value: "grade_11_12", label: "Grade 11–12" },
  { value: "graduate", label: "Graduate" },
  { value: "professional", label: "Professional" },
];

const INSTITUTION_TYPES = [
  { value: "school", label: "School" },
  { value: "college", label: "College" },
  { value: "university", label: "University" },
  { value: "incubator", label: "Incubator" },
];

function Field({ id, label, hint, children }) {
  return (
    <div className="ra-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <span className="ra-hint">{hint}</span>}
    </div>
  );
}

function SignupFields({ role }) {
  const common = (
    <>
      <div className="ra-row">
        <Field id="email" label="Email">
          <input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field id="phone" label="Phone">
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91" required />
        </Field>
      </div>
      <Field id="password" label="Password" hint="At least 8 characters">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
    </>
  );

  if (role === "student") {
    return (
      <>
        <Field id="name" label="Full name">
          <input id="name" name="name" autoComplete="name" required />
        </Field>
        {common}
        <div className="ra-row">
          <Field id="level" label="Learning level">
            <select id="level" name="academic_tier" defaultValue="" required>
              <option value="" disabled>Select your level</option>
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Field>
          <Field id="invite" label="Institution code" hint="Optional, from your school or college">
            <input id="invite" name="invite_code" autoComplete="off" placeholder="e.g. SXC-4821" />
          </Field>
        </div>
      </>
    );
  }

  if (role === "institution") {
    return (
      <>
        <div className="ra-row">
          <Field id="org" label="Institution name">
            <input id="org" name="institution_name" autoComplete="organization" required />
          </Field>
          <Field id="type" label="Type">
            <select id="type" name="institution_type" defaultValue="" required>
              <option value="" disabled>Select type</option>
              {INSTITUTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="ra-row">
          <Field id="name" label="Your name">
            <input id="name" name="name" autoComplete="name" required />
          </Field>
          <Field id="city" label="City">
            <input id="city" name="city" autoComplete="address-level2" required />
          </Field>
        </div>
        {common}
      </>
    );
  }

  // company
  return (
    <>
      <div className="ra-row">
        <Field id="org" label="Company name">
          <input id="org" name="company_name" autoComplete="organization" required />
        </Field>
        <Field id="industry" label="Industry">
          <input id="industry" name="industry" placeholder="e.g. Healthcare" required />
        </Field>
      </div>
      <div className="ra-row">
        <Field id="name" label="Your name">
          <input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field id="website" label="Website">
          <input id="website" name="website" type="url" autoComplete="url" placeholder="https://" />
        </Field>
      </div>
      {common}
    </>
  );
}

export default function RoleAuthPage({ role = "student", mode = "login", onModeChange, onChangeRole, onBack, onSubmit }) {
  const meta = ROLES[role] ?? ROLES.student;
  const isAdmin = role === "admin";
  const isSignup = mode === "signup" && !isAdmin;
  const [method, setMethod] = useState("password"); // "password" | "otp"; admins always use password + code
  const [otpSent, setOtpSent] = useState(false);
  const [notice, setNotice] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (onSubmit) {
      onSubmit({ role, mode: isSignup ? "signup" : "login", method, values });
    } else {
      setNotice("UI preview only: connect this form to the auth API.");
    }
  };

  const sendOtp = () => {
    setOtpSent(true);
    setNotice("A 6-digit code has been sent (preview only).");
  };

  const needsApproval = isSignup && (role === "institution" || role === "company");

  return (
    <div className={`ra-page ra-page--${meta.key}`}>
      <aside className="ra-side">
        <button type="button" className="ra-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          Back to home
        </button>

        <div className="ra-side-body">
          <span className="ra-side-icon">{meta.icon}</span>
          <span className="ra-side-role">{meta.label}</span>
          <h1 className="ra-side-title">{isSignup ? meta.signupTitle : meta.loginTitle}</h1>
          <ul className="ra-perks">
            {meta.perks.map((p) => (
              <li key={p}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="ra-side-foot">AI Innovation Platform</p>
      </aside>

      <main className="ra-main">
        <div className="ra-card">
          <div className="ra-card-head">
            <span className="ra-chip">
              {meta.label}
              {!isAdmin && (
                <button type="button" onClick={onChangeRole}>Change</button>
              )}
            </span>
            <h2>{isSignup ? "Create your account" : "Sign in"}</h2>
            {!isAdmin && (
              <p className="ra-switch">
                {isSignup ? "Already have an account? " : "New here? "}
                <button type="button" onClick={() => onModeChange?.(isSignup ? "login" : "signup")}>
                  {isSignup ? "Log in" : "Create an account"}
                </button>
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="ra-banner ra-banner--admin" role="note">
              Restricted area. Admins confirm a one-time code on every sign-in, and all activity is logged.
            </div>
          )}

          {needsApproval && (
            <div className="ra-banner" role="note">
              Your {role} account will be reviewed by our team. You can sign in straight away and your panel opens once it's approved.
            </div>
          )}

          <form className="ra-form" onSubmit={handleSubmit} noValidate={false}>
            {isSignup ? (
              <SignupFields role={role} />
            ) : (
              <>
                {!isAdmin && (
                  <div className="ra-method" role="tablist" aria-label="Sign-in method">
                    <button type="button" role="tab" aria-selected={method === "password"}
                      className={method === "password" ? "is-active" : ""}
                      onClick={() => { setMethod("password"); setOtpSent(false); setNotice(""); }}>
                      Password
                    </button>
                    <button type="button" role="tab" aria-selected={method === "otp"}
                      className={method === "otp" ? "is-active" : ""}
                      onClick={() => { setMethod("otp"); setNotice(""); }}>
                      One-time code
                    </button>
                  </div>
                )}

                <Field id="identifier" label={method === "otp" ? "Email or phone" : "Email"}>
                  <input id="identifier" name="identifier" type={method === "otp" ? "text" : "email"}
                    autoComplete={method === "otp" ? "username" : "email"} required />
                </Field>

                {method === "password" && (
                  <Field id="password" label="Password">
                    <input id="password" name="password" type="password" autoComplete="current-password" required />
                  </Field>
                )}

                {(method === "otp" || isAdmin) && (
                  <div className="ra-otp">
                    <Field id="otp" label="6-digit code">
                      <input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code"
                        pattern="[0-9]{6}" maxLength={6} placeholder="••••••" required={otpSent} />
                    </Field>
                    <button type="button" className="ra-btn ra-btn--ghost" onClick={sendOtp}>
                      {otpSent ? "Resend code" : "Send code"}
                    </button>
                  </div>
                )}

                {method === "password" && !isAdmin && (
                  <button type="button" className="ra-text-link">Forgot password?</button>
                )}
              </>
            )}

            {notice && <p className="ra-notice" role="status">{notice}</p>}

            <button type="submit" className="ra-btn ra-btn--primary">
              {isSignup ? `Create ${meta.label.toLowerCase()} account` : "Sign in"}
            </button>

            {isSignup && (
              <p className="ra-legal">
                By creating an account you agree to the Terms of Service and Privacy Policy.
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
