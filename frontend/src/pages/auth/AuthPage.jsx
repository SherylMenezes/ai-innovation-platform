import { useEffect, useState } from "react";
import "./AuthPage.css";
import { generateOtp, register, login } from "../../api/authClient";
import { useAuth } from "../../context/AuthContext";

// Must match backend/app/config.py's otp_resend_cooldown_seconds default —
// purely for the UI countdown; the server enforces the real cooldown.
const RESEND_COOLDOWN_SECONDS = 60;

export default function AuthPage({ onBack }) {
  const { loginWithTokens } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [channel, setChannel] = useState("email"); // "email" | "phone"
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [academicTier, setAcademicTier] = useState("Graduate");
  const [institutionName, setInstitutionName] = useState("");

  const [step, setStep] = useState("form"); // "form" | "otp"
  const [otpPurpose, setOtpPurpose] = useState("login");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const resetToForm = () => {
    setStep("form");
    setCode("");
    setError("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetToForm();
  };

  const sendCode = async (purpose) => {
    setError("");
    setIsSubmitting(true);
    try {
      await generateOtp(identifier.trim(), channel, purpose);
      setOtpPurpose(purpose);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCode = (e) => {
    e.preventDefault();
    if (!identifier.trim() || isSubmitting) return;
    if (mode === "signup" && !name.trim()) return;
    sendCode(mode === "signup" ? "registration" : "login");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim() || isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      if (otpPurpose === "registration") {
        const account = await register({
          name: name.trim(),
          email: channel === "email" ? identifier.trim() : undefined,
          phone: channel === "phone" ? identifier.trim() : undefined,
          channel,
          code: code.trim(),
          academicTier,
          institutionName: institutionName.trim(),
        });
        await loginWithTokens({
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          user: {
            id: account.user_id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            role: account.role,
            academic_tier: account.academic_tier,
            institution_name: account.institution_name,
            is_verified: account.is_verified,
          },
        });
        return;
      }

      const tokens = await login(identifier.trim(), channel, code.trim());
      await loginWithTokens(tokens);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {onBack && (
        <button type="button" className="auth-back-btn" onClick={onBack}>
          ← Back to Home
        </button>
      )}

      <div className="auth-card">
        <h1 className="auth-title">AI Innovation Platform</h1>

        {step === "form" && (
          <>
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => switchMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => switchMode("signup")}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleRequestCode} className="auth-form">
              {mode === "signup" && (
                <label className="auth-field">
                  Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </label>
              )}

              <div className="auth-channel-toggle">
                <button
                  type="button"
                  className={channel === "email" ? "active" : ""}
                  onClick={() => {
                    setChannel("email");
                    setIdentifier("");
                  }}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={channel === "phone" ? "active" : ""}
                  onClick={() => {
                    setChannel("phone");
                    setIdentifier("");
                  }}
                >
                  Phone
                </button>
              </div>

              {channel === "phone" && (
                <p className="auth-hint">
                  Only phone numbers verified with our SMS provider can receive a code right now.
                  If yours isn't verified yet, use Email instead.
                </p>
              )}

              <label className="auth-field">
                {channel === "email" ? "Email address" : "Phone number"}
                <input
                  type={channel === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={channel === "email" ? "you@example.com" : "+91XXXXXXXXXX"}
                  required
                />
              </label>

              {mode === "signup" && (
                <>
                  <label className="auth-field">
                    Academic tier
                    <select
                      value={academicTier}
                      onChange={(e) => setAcademicTier(e.target.value)}
                    >
                      <option value="Grade 8-10">Grade 8-10</option>
                      <option value="Grade 11-12">Grade 11-12</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </label>
                  <label className="auth-field">
                    Institution (optional)
                    <input
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="School or company"
                    />
                  </label>
                </>
              )}

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send code"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerify} className="auth-form">
            <p className="auth-hint">
              We sent a {otpPurpose === "registration" ? "verification" : "login"} code to{" "}
              <strong>{identifier}</strong> via {channel === "email" ? "email" : "SMS"}.
            </p>

            <label className="auth-field">
              Enter code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                inputMode="numeric"
                autoFocus
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify & continue"}
            </button>

            <div className="auth-otp-actions">
              <button
                type="button"
                className="auth-link-button"
                disabled={cooldown > 0 || isSubmitting}
                onClick={() => sendCode(otpPurpose)}
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>
              <button type="button" className="auth-link-button" onClick={resetToForm}>
                Use a different {channel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}