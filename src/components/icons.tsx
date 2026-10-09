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
