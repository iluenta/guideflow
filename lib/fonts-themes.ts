import localFont from 'next/font/local';

export const playfair = localFont({
  src: [
    { path: '../public/fonts/playfair-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/playfair-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/playfair-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/playfair-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-playfair',
  display: 'swap',
});

export const oswald = localFont({
  src: [
    { path: '../public/fonts/oswald-300.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/oswald-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/oswald-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/oswald-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/oswald-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-oswald',
  display: 'swap',
});

export const nunito = localFont({
  src: [
    { path: '../public/fonts/nunito-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/nunito-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/nunito-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/nunito-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-nunito',
  display: 'swap',
});

export const cormorant = localFont({
  src: [
    { path: '../public/fonts/cormorant-300.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/cormorant-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/cormorant-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/cormorant-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/cormorant-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-cormorant',
  display: 'swap',
});

export const jost = localFont({
  src: [
    { path: '../public/fonts/jost-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/jost-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/jost-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/jost-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-jost',
  display: 'swap',
});
