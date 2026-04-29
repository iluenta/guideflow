/* global window */
const Icon = ({ name, size = 18, stroke = 2 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'pin':
      return <svg {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'map':
      return <svg {...props}><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/></svg>;
    case 'key':
      return <svg {...props}><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 11-11"/><path d="m17 6 3 3"/><path d="m14 9 3 3"/></svg>;
    case 'wifi':
      return <svg {...props}><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
    case 'lock':
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'car':
      return <svg {...props}><path d="M5 17h14l-2-7H7l-2 7Z"/><path d="M5 17v3"/><path d="M19 17v3"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg>;
    case 'phone':
      return <svg {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>;
    case 'whatsapp':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-1.5-.7-2.4-1.3-3.4-3-.3-.4.3-.4.8-1.4.1-.2 0-.4 0-.5-.1-.1-.7-1.5-.9-2.1-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1.1 1.1-1.1 2.6 1.1 3 1.3 3.2c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M20.5 3.5C18.3 1.2 15.3 0 12.1 0 5.5 0 .1 5.4.1 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.7 1.4 5.6 1.4 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.3-8.3zm-8.4 18.4c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5.1C2.5 6.7 6.8 2.4 12 2.4c2.5 0 4.9 1 6.7 2.8 1.8 1.8 2.8 4.2 2.8 6.7-.1 5.4-4.4 9.7-9.4 10z"/></svg>;
    case 'arrow':
      return <svg {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case 'arrow-back':
      return <svg {...props}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
    case 'copy':
      return <svg {...props}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case 'check':
      return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case 'star':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 .5-5.5 4.5L18 21l-6-4-6 4 1.5-7L2 9.5 9 9l3-7Z"/></svg>;
    case 'sun':
      return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>;
    case 'cloud':
      return <svg {...props}><path d="M17.5 19a4.5 4.5 0 0 0 .5-9 7 7 0 0 0-13.7 2A4 4 0 0 0 5 19h12.5Z"/></svg>;
    case 'gate':
      return <svg {...props}><path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16"/><path d="M3 21h18"/><path d="M9 21V9"/><path d="M15 21V9"/></svg>;
    case 'walk':
      return <svg {...props}><circle cx="13" cy="4" r="2"/><path d="m7 22 3-9 3 4 4 3"/><path d="M10 13l-2-3 3-3 4 1 2 4"/></svg>;
    case 'door':
      return <svg {...props}><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/><path d="M2 21h20"/><circle cx="15" cy="13" r="1" fill="currentColor"/></svg>;
    case 'home':
      return <svg {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z"/></svg>;
    case 'sparkle':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 14 9l7 1-5.5 4 1.5 8L12 18l-5 4 1.5-8L3 10l7-1 2-7Z"/></svg>;
    case 'utensils':
      return <svg {...props}><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/><path d="M5 11v11"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
    case 'compass':
      return <svg {...props}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
    case 'send':
      return <svg {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case 'heart':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9.5C.8 7.6 3 4 6.5 4 9 4 10.5 5.5 12 7c1.5-1.5 3-3 5.5-3 3.5 0 5.7 3.6 4 7.5C19 16.5 12 21 12 21Z"/></svg>;
    default:
      return null;
  }
};

window.Icon = Icon;
