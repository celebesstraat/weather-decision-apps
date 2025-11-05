import React from 'react';

interface SunriseIconProps extends React.SVGProps<SVGSVGElement> {}

const SunriseIcon: React.FC<SunriseIconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM12 15.75h.007v.008H12v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 21 3-3 3 3" />
  </svg>
);

export default SunriseIcon;