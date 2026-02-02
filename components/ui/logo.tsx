import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

export function Logo({ size = 40, ...props }: LogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect width="100" height="100" rx="20" fill="#316263" />

            <path d="M25 45L50 25L75 45V75H25V45Z" fill="#F0EEE9" />

            <rect x="44" y="58" width="12" height="17" rx="2" fill="#316263" />

            <path d="M72 15L75.5 24.5L85 28L75.5 31.5L72 41L68.5 31.5L59 28L68.5 24.5L72 15Z" fill="#C36A4A" />

            <path d="M82 42L84 47.5L89.5 49.5L84 51.5L82 57L80 51.5L74.5 49.5L80 47.5L82 42Z" fill="#C36A4A" opacity="0.8" />
        </svg>
    );
}
