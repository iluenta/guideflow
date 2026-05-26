'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  show: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  fullAddress?: string;
}

/**
 * Opens the best maps app for the current platform.
 *
 * We prefer the full text address as the destination query so that Google/Apple
 * Maps displays the correct place name instead of reverse-geocoding the
 * coordinates and potentially matching a nearby wrong property.
 * Coordinates are used as fallback when no address is available.
 */
function openDirections(lat: number, lng: number, address?: string) {
  // Use address text when available; it yields a more accurate name match.
  const destination = address
    ? encodeURIComponent(address)
    : `${lat},${lng}`;

  const ua = navigator.userAgent;
  const isIOS     = /iP(hone|ad|od)/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    // Apple Maps — daddr accepts both address strings and "lat,lng"
    window.open(
      `https://maps.apple.com/?daddr=${destination}&dirflg=d`,
      '_blank', 'noopener',
    );
  } else if (isAndroid) {
    // geo: URI with label; Android prompts the user to choose their maps app
    window.open(
      `geo:${lat},${lng}?q=${destination}`,
      '_blank', 'noopener',
    );
  } else {
    // Desktop → Google Maps directions with address as destination
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank', 'noopener',
    );
  }
}

export function Location({ show, latitude, longitude, city, fullAddress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  const handleDirections = useCallback(() => {
    if (!hasCoords) return;
    openDirections(latitude!, longitude!, fullAddress || city);
  }, [hasCoords, latitude, longitude, fullAddress, city]);

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

          {/* Directions row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, color: 'var(--ink-mute)', margin: 0 }}>
              La dirección exacta se comparte tras la confirmación de la reserva.
            </p>
            <button
              onClick={handleDirections}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'var(--brand)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {/* Map pin icon (inline SVG, no extra deps) */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Cómo llegar
            </button>
          </div>
        </>
      ) : (
        <div style={{ borderRadius: 'var(--r-lg)', height: 200, background: 'var(--bg-deep)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>
          {city}
        </div>
      )}
    </div>
  );
}
