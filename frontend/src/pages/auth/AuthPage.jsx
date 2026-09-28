import { useEffect, useState } from "react";

import "./AuthPage.css";

import {
  generateOtp,
  register,
  login,
} from "../../api/authClient";

import { useAuth } from "../../context/AuthContext";


const RESEND_COOLDOWN_SECONDS = 60;


function AuthPage() {
  const { loginWithTokens } = useAuth();


  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [academicTier, setAcademicTier] =
    useState("Graduate");

  const [institutionName, setInstitutionName] =
    useState("");


  const [step, setStep] = useState("form");

  const [code, setCode] = useState("");

  const [error, setError] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [cooldown, setCooldown] = useState(0);


  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(
      () =>
        setCooldown((current) =>
          Math.max(0, current - 1)
        ),
      1000
    );

    return () =>
      clearInterval(timer);
  }, [cooldown]);


  const resetForm = () => {
    setStep("form");
    setCode("");
    setError("");
    setCooldown(0);
  };


  const switchMode = (nextMode) => {
    setMode(nextMode);

    setPassword("");
    setConfirmPassword("");

    resetForm();
  };


  const sendRegistrationCode = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await generateOtp(
        email.trim().toLowerCase(),
        "email",
        "registration"
      );

      setStep("otp");
      setCooldown(
        RESEND_COOLDOWN_SECONDS
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleLogin = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");


    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }


    if (!password) {
      setError("Please enter your password.");
      return;
    }


    setIsSubmitting(true);

    try {
      const tokens = await login(
        email.trim().toLowerCase(),
        password
      );

      await loginWithTokens(tokens);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSignupRequest = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");


    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }


    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }


    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }


    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }


    await sendRegistrationCode();
  };


  const handleVerifyRegistration = async (
    event
  ) => {
    event.preventDefault();

    if (
      !code.trim() ||
      isSubmitting
    ) {
      return;
    }


    setError("");
    setIsSubmitting(true);


    try {
      const account = await register({
        name: name.trim(),

        email:
          email.trim().toLowerCase(),

        password,

        code: code.trim(),

        academicTier,

        institutionName:
          institutionName.trim(),
      });


      await loginWithTokens({
        access_token:
          account.access_token,

        refresh_token:
          account.refresh_token,

        token_type:
          account.token_type,

        user: {
          id: account.user_id,
          name: account.name,
          email: account.email,
          phone: account.phone,
          role: account.role,
          academic_tier:
            account.academic_tier,
          institution_name:
            account.institution_name,
          is_verified:
            account.is_verified,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const resendRegistrationCode = async () => {
    if (cooldown > 0 || isSubmitting) {
      return;
    }

    await sendRegistrationCode();
  };


  return (
    <div className="auth-page">
      <div className="auth-card">

        <h1 className="auth-title">
          AI Innovation Platform
        </h1>


        <div className="auth-mode-tabs">

          <button
            type="button"
            className={
              mode === "login"
                ? "active"
                : ""
            }
            onClick={() =>
              switchMode("login")
            }
          >
            Log in
          </button>


          <button
            type="button"
            className={
              mode === "signup"
                ? "active"
                : ""
            }
            onClick={() =>
              switchMode("signup")
            }
          >
            Sign up
          </button>

        </div>


        {mode === "login" && (
          <form
            onSubmit={handleLogin}
            className="auth-form"
          >

            <label className="auth-field">
              Email address

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>


            <label className="auth-field">
              Password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>


            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}


            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Logging in..."
                : "Log in"}
            </button>

          </form>
        )}


        {mode === "signup" &&
          step === "form" && (
            <form
              onSubmit={handleSignupRequest}
              className="auth-form"
            >

              <label className="auth-field">
                Name

                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </label>


              <label className="auth-field">
                Email address

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>


              <label className="auth-field">
                Password

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>


              <label className="auth-field">
                Confirm password

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>


              <label className="auth-field">
                Academic tier

                <select
                  value={academicTier}
                  onChange={(event) =>
                    setAcademicTier(
                      event.target.value
                    )
                  }
                >
                  <option value="Grade 8-10">
                    Grade 8-10
                  </option>

                  <option value="Grade 11-12">
                    Grade 11-12
                  </option>

                  <option value="Graduate">
                    Graduate
                  </option>

                  <option value="Professional">
                    Professional
                  </option>
                </select>
              </label>


              <label className="auth-field">
                Institution (optional)

                <input
                  value={institutionName}
                  onChange={(event) =>
                    setInstitutionName(
                      event.target.value
                    )
                  }
                  placeholder="School or company"
                />
              </label>


              {error && (
                <p className="auth-error">
                  {error}
                </p>
              )}


              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Sending..."
                  : "Send verification code"}
              </button>

            </form>
          )}


        {mode === "signup" &&
          step === "otp" && (
            <form
              onSubmit={
                handleVerifyRegistration
              }
              className="auth-form"
            >

              <p className="auth-hint">
                We sent a verification code
                to{" "}
                <strong>{email}</strong>.
              </p>


              <label className="auth-field">
                Verification code

                <input
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                    )
                  }
                  placeholder="6-digit code"
                  inputMode="numeric"
                  autoFocus
                  required
                />
              </label>


              {error && (
                <p className="auth-error">
                  {error}
                </p>
              )}


              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Creating account..."
                  : "Verify & create account"}
              </button>


              <div className="auth-otp-actions">

                <button
                  type="button"
                  className="auth-link-button"
                  disabled={
                    cooldown > 0 ||
                    isSubmitting
                  }
                  onClick={
                    resendRegistrationCode
                  }
                >
                  {cooldown > 0
                    ? `Resend code (${cooldown}s)`
                    : "Resend code"}
                </button>


                <button
                  type="button"
                  className="auth-link-button"
                  onClick={resetForm}
                >
                  Back
                </button>

              </div>

            </form>
          )}

      </div>
    </div>
  );
}


export default AuthPage;