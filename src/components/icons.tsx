import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconDashboard = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7.5" height="9" rx="1.6" />
    <rect x="13" y="3.5" width="7.5" height="5.5" rx="1.6" />
    <rect x="13" y="11.5" width="7.5" height="9" rx="1.6" />
    <rect x="3.5" y="15.5" width="7.5" height="5" rx="1.6" />
  </svg>
);

export const IconUsers = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
    <circle cx="17" cy="7.5" r="2.6" />
    <path d="M15.5 14.6c2.7.2 4.9 2.3 4.9 5.4" />
  </svg>
);

export const IconFolder = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 6.2c0-.94.76-1.7 1.7-1.7h4l1.8 2.2h7.3c.94 0 1.7.76 1.7 1.7v9.1c0 .94-.76 1.7-1.7 1.7H5.2c-.94 0-1.7-.76-1.7-1.7z" />
  </svg>
);

export const IconBuilding = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="4" y="3.5" width="11" height="17" rx="1" />
    <rect x="16.5" y="9" width="4" height="11.5" rx="1" />
    <path d="M7.2 7h1.6M11.2 7h1.6M7.2 10.5h1.6M11.2 10.5h1.6M7.2 14h1.6M11.2 14h1.6" />
  </svg>
);

export const IconGrid = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.3" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.3" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.3" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.3" />
  </svg>
);

export const IconChevronRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const IconAlert = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.8 2.5 20.2h19z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
  </svg>
);

export const IconPhoneOut = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M15 3.5h5.5V9" />
    <path d="M20.5 3.5 14 10" />
    <path d="M4.5 4.5c0 8.8 6.2 15 15 15l.5-3.4-4.6-1.6-2 2c-2.7-1.4-4.9-3.6-6.3-6.3l2-2L7.5 4z" />
  </svg>
);

export const IconPhoneIn = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20.5 3.5 14 10" />
    <path d="M14.5 3.5H20V9" />
    <path d="M4.5 4.5c0 8.8 6.2 15 15 15l.5-3.4-4.6-1.6-2 2c-2.7-1.4-4.9-3.6-6.3-6.3l2-2L7.5 4z" />
  </svg>
);

export const IconVisit = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 20V10.5L12 4l8 6.5V20" />
    <path d="M9.5 20v-6h5v6" />
  </svg>
);

export const IconNote = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 3.5h12v17H6z" />
    <path d="M9 8h6M9 12h6M9 16h3.5" />
  </svg>
);

export const IconMail = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.6" />
    <path d="m4 6.5 8 6.5 8-6.5" />
  </svg>
);

export const IconWeb = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.4 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.4-3.6-8.5S9.6 5.9 12 3.5Z" />
  </svg>
);

export const IconMessage = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 4.5h16v11H9l-4 3.5v-3.5H4z" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconArrowUpRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export const IconCoins = (p: IconProps) => (
  <svg {...base} {...p}>
    <ellipse cx="9" cy="7" rx="5.5" ry="3" />
    <path d="M3.5 7v4c0 1.66 2.46 3 5.5 3s5.5-1.34 5.5-3V7" />
    <path d="M3.5 11v4c0 1.66 2.46 3 5.5 3 .5 0 .98-.04 1.44-.11" />
    <path d="M14.5 12.3c3 .2 5.5 1.5 5.5 3.1 0 1.66-2.46 3-5.5 3S9 17.06 9 15.4c0-.6.33-1.16.9-1.62" />
  </svg>
);

export const IconTrendUp = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m3.5 16.5 6-6 4 4 7-7.5" />
    <path d="M15 6.5h5.5V12" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 19 6v6c0 5-3 8-7 9-4-1-7-4-7-9V6z" />
    <path d="m9 12 2 2 4-4.5" />
  </svg>
);

export const IconScale = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5v17M7 20.5h10" />
    <path d="M4 8h6M14 8h6" />
    <path d="M4 8 1.7 13a2.5 2.5 0 0 0 4.9 0zM20 8l-2.3 5a2.5 2.5 0 0 0 4.9 0z" />
  </svg>
);

export const IconGift = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="9" width="17" height="4" rx="0.8" />
    <rect x="4.5" y="13" width="15" height="7.5" rx="0.8" />
    <path d="M12 9v11.5" />
    <path d="M12 9C9.5 9 8 7.6 8 6a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 1.6-1.5 3-4 3Z" />
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="1.6" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m4 12 6 6L20 6" />
  </svg>
);

export const IconHome = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 20V10.5L12 4l8 6.5V20" />
    <path d="M9.5 20v-6h5v6" />
  </svg>
);

export const IconIdCard = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="1.8" />
    <circle cx="8.5" cy="11" r="2" />
    <path d="M5.5 16c.6-1.6 1.8-2.4 3-2.4s2.4.8 3 2.4" />
    <path d="M14.5 9.5h4M14.5 13h4" />
  </svg>
);

export const IconAppsGrid = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="6" r="1.6" />
    <circle cx="12" cy="6" r="1.6" />
    <circle cx="18" cy="6" r="1.6" />
    <circle cx="6" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="12" cy="18" r="1.6" />
    <circle cx="18" cy="18" r="1.6" />
  </svg>
);

export const IconCart = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 4h2l1.2 11.2A2 2 0 0 0 8.7 17h8.6a2 2 0 0 0 2-1.7L20.5 8h-15" />
    <circle cx="9.5" cy="20.5" r="1.4" />
    <circle cx="17" cy="20.5" r="1.4" />
  </svg>
);

export const IconKey = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="7.5" cy="14.5" r="4" />
    <path d="m10.3 11.7 9.2-9.2M16 6l2.5 2.5M19 3l2 2" />
  </svg>
);

export const IconWrench = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.4L3 17.4l3.6 3.6 5.7-5.7a4.5 4.5 0 0 0 5.4-6l-3 3-2.6-2.6z" />
  </svg>
);

export const IconBank = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 9.5 12 4l8.5 5.5" />
    <path d="M4.5 9.5h15v2h-15zM6 11.5v7M10 11.5v7M14 11.5v7M18 11.5v7" />
    <path d="M3.5 20.5h17" />
  </svg>
);

export const IconCalculator = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="1.8" />
    <path d="M7.5 6.5h9v3.5h-9z" />
    <path d="M7.7 13.2h.02M12 13.2h.02M16.3 13.2h.02M7.7 16.6h.02M12 16.6h.02M16.3 16.6h.02" strokeWidth="2.4" />
  </svg>
);

export const IconSettings = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconMenu = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
  </svg>
);
