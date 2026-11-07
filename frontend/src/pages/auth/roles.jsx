// Roles shown on the public login / sign-up screens.
// Admin is deliberately not in PUBLIC_ROLES: admins never sign up, and only
// reach their login through the small "Platform admin" link.

const icon = (paths) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

export const ROLES = {
  student: {
    key: "student",
    label: "Student",
    tagline: "Solve challenges, earn XP and build your portfolio",
    loginTitle: "Welcome back, innovator",
    signupTitle: "Start your innovation journey",
    perks: [
      "Real-world challenges for your level",
      "AI mentor at every step",
      "XP, badges and leaderboards",
    ],
    icon: icon(
      <>
        <path d="M22 10L12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" />
      </>
    ),
  },
  institution: {
    key: "institution",
    label: "Institution",
    tagline: "Schools, colleges and incubators managing students",
    loginTitle: "Sign in to your institute panel",
    signupTitle: "Bring your institution on board",
    perks: [
      "Assign challenges to classes and sections",
      "Track participation and AI scores",
      "Recognise top students and teams",
    ],
    icon: icon(
      <>
        <path d="M3 21h18" />
        <path d="M5 21V10l7-5 7 5v11" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
  company: {
    key: "company",
    label: "Company",
    tagline: "Post industry challenges and discover talent",
    loginTitle: "Sign in to your company panel",
    signupTitle: "Post your first innovation challenge",
    perks: [
      "Publish challenges to students nationwide",
      "AI-ranked submissions and shortlists",
      "Award winners and offer internships",
    ],
    icon: icon(
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M3 13h18" />
      </>
    ),
  },
  admin: {
    key: "admin",
    label: "Platform admin",
    tagline: "Restricted access",
    loginTitle: "Admin console",
    signupTitle: "",
    perks: [
      "Approve institutions, companies and challenges",
      "Manage users across every role",
      "Every admin action is audit-logged",
    ],
    icon: icon(
      <>
        <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
};

export const PUBLIC_ROLES = [ROLES.student, ROLES.institution, ROLES.company];
