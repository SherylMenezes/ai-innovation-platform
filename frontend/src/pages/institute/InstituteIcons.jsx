const PATHS = {
  dashboard: <><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /></>,
  students: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></>,
  groups: <><path d="M12 4l-8 4l8 4l8 -4l-8 -4" /><path d="M4 12l8 4l8 -4" /><path d="M4 16l8 4l8 -4" /></>,
  assignments: <><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14l2 2l4 -4" /></>,
  challenges: <><path d="M5 21v-16" /><path d="M5 5h11l-2 4l2 4h-11" /></>,
  leaderboard: <><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1 -10 0z" /><path d="M5 9a2 2 0 0 1 0 -4h2" /><path d="M19 9a2 2 0 0 0 0 -4h-2" /></>,
  reports: <><path d="M3 3v18h18" /><path d="M8 16v-4" /><path d="M12 16v-8" /><path d="M16 16v-6" /></>,
  awards: <><circle cx="12" cy="9" r="6" /><path d="M9 14.5l-1.5 6.5l4.5 -2.5l4.5 2.5l-1.5 -6.5" /></>,
  settings: <><path d="M4 6h3" /><path d="M11 6h9" /><circle cx="9" cy="6" r="2" /><path d="M4 12h9" /><path d="M17 12h3" /><circle cx="15" cy="12" r="2" /><path d="M4 18h1" /><path d="M9 18h11" /><circle cx="7" cy="18" r="2" /></>,
  completion: <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2l4 -4" /></>,
  star: <path d="M12 3l2.6 5.3l5.9 .9l-4.3 4.1l1 5.8l-5.2 -2.8l-5.2 2.8l1 -5.8l-4.3 -4.1l5.9 -.9z" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  chevron: <path d="M9 6l6 6l-6 6" />,
};

export default function Icon({ name, size = 18, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
