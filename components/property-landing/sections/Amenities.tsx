/** Map amenity name keywords → SVG path (24x24 Lucide-style) */
const ICON_MAP: { keywords: string[]; path: string }[] = [
  { keywords: ['wifi', 'internet', 'fibra'], path: 'M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01' },
  { keywords: ['piscina', 'pool', 'jacuzzi'], path: 'M2 12h20M2 16h20M2 8h20M3 4h18a1 1 0 011 1v2H2V5a1 1 0 011-1z' },
  { keywords: ['parking', 'garaje', 'coche', 'aparcamiento'], path: 'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v7a2 2 0 01-2 2h-5m-2 0H9m2 0a2 2 0 002 2 2 2 0 002-2m-4 0a2 2 0 01-2-2 2 2 0 01-2-2' },
  { keywords: ['aire', 'ac', 'acondicionado', 'calefacción'], path: 'M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1110 16H2m15.73-8.27A2 2 0 1119 12H2' },
  { keywords: ['lavadora', 'secadora'], path: 'M3 9a9 9 0 1018 0M3 9V6a3 3 0 013-3h12a3 3 0 013 3v3M3 9h18m-9 4a2 2 0 100-4 2 2 0 000 4z' },
  { keywords: ['cocina', 'kitchen', 'horno', 'microondas'], path: 'M9 3h6l3 7H6L9 3zM2 10h20v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9z' },
  { keywords: ['terraza', 'balcón', 'jardín', 'patio', 'olivo'], path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' },
  { keywords: ['tv', 'televisión', 'netflix', 'smart'], path: 'M21 3H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zM7 21h10M12 17v4' },
  { keywords: ['gym', 'gimnasio'], path: 'M18 8h1a4 4 0 010 8h-1M2 8h16v8H2zM6 8V4M18 8V4M6 16v4M18 16v4' },
  { keywords: ['escritorio', 'trabajo', 'monitor', 'remote', 'teletra'], path: 'M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21H8M12 17v4' },
  { keywords: ['barbacoa', 'bbq', 'grill'], path: 'M12 2a7 7 0 00-7 7c0 3.87 3.13 7 7 7s7-3.13 7-7a7 7 0 00-7-7zM5 9h14M9 21l3-12 3 12M9 21H5m12 0h-4' },
  { keywords: ['mascota', 'pet', 'perro', 'gato'], path: 'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75zM4.867 19.125c1.661.139 3.767-.374 5.133-2M19.133 19.125c-1.661.139-3.767-.374-5.133-2M12 20c-1.962 0-3.5-1.343-3.5-3 0-.405.105-.785.29-1.125' },
  { keywords: ['seguridad', 'caja', 'safe', 'cerradura'], path: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' },
  { keywords: ['check-in', 'autónomo', 'llave', 'acceso'], path: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' },
  { keywords: ['hostbot', 'asistente', '24h', 'soporte'], path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { keywords: ['anfitrión', 'host', 'local'], path: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
];

const DEFAULT_PATH = 'M5 13l4 4L19 7';

function getIcon(name: string): string {
  const lower = name.toLowerCase();
  return ICON_MAP.find(({ keywords }) => keywords.some(k => lower.includes(k)))?.path ?? DEFAULT_PATH;
}

function AmenityIcon({ name }: { name: string }) {
  return (
    <span style={{ width: 32, height: 32, background: 'var(--bg-deep)', borderRadius: 'var(--r-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
        <path d={getIcon(name)} />
      </svg>
    </span>
  );
}

interface Props {
  amenities: string[];
}

/** 2-column amenities grid with auto-matched SVG icons. */
export function Amenities({ amenities }: Props) {
  if (!amenities || amenities.length === 0) return null;
  return (
    <div className="lp-section">
      <h2 className="lp-section-title">Lo que ofrece este alojamiento</h2>
      <div className="lp-amenities">
        {amenities.map((a, i) => (
          <div key={i} className="lp-amenity">
            <AmenityIcon name={a} />
            {a}
          </div>
        ))}
      </div>
    </div>
  );
}
