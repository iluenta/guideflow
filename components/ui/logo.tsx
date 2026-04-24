import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    /** 'dark' for use on dark/navy backgrounds (strokes white), 'light' for white backgrounds (strokes navy) */
    variant?: 'dark' | 'light';
}

export function Logo({ size = 40, variant = 'light', ...props }: LogoProps) {
    const stroke = variant === 'dark' ? '#ffffff' : '#1e3a8a';
    const mintDot = '#2dd4bf';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            {/* Pin / heart shape */}
            <path
                d="M32 6 C19 6 9 16 9 28 C9 41 22 53 32 60 C42 53 55 41 55 28 C55 16 45 6 32 6 Z"
                stroke={stroke}
                strokeWidth="4.5"
                strokeLinejoin="round"
                fill="none"
            />
            {/* WiFi waves */}
            <path d="M19 22 Q23 19 27 22" stroke={stroke} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M16 18 Q23 13 30 18" stroke={stroke} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Checkmark */}
            <path
                d="M22 34 L29 41 L46 26"
                stroke={stroke}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            {/* Mint accent dot */}
            <circle cx="48" cy="20" r="3" fill={mintDot} />
        </svg>
    );
}
