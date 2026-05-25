'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  show: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  fullAddress?: string;
}

export function Location({ show, latitude, longitude, city, fullAddress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  useEffect(() => {
    if (!show || !hasCoords || !containerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [longitude!, latitude!],
      zoom: 14,
    });

    // Custom marker using brand color
    const el = document.createElement('div');
    el.style.cssText = `
      width: 40px; height: 40px; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: #8B6F47;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(139,111,71,.45);
    `;

    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([longitude!, latitude!])
      .addTo(map);

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => setLoaded(true));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, hasCoords]);

  if (!show || (!hasCoords && !city)) return null;

  return (
    <div className="lp-section" id="location">
      <h2 className="lp-section-title">¿Dónde se encuentra?</h2>

      {city && (
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 16 }}>
          {fullAddress || city}
        </p>
      )}

      {hasCoords ? (
        <>
          <div style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', height: 300, border: '1px solid var(--rule)' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            {!loaded && (
              <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
                Cargando mapa…
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 10 }}>
            La dirección exacta se comparte tras la confirmación de la reserva.
          </p>
        </>
      ) : (
        <div style={{ borderRadius: 'var(--r-lg)', height: 200, background: 'var(--bg-deep)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>
          {city}
        </div>
      )}
    </div>
  );
}
