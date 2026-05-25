'use client';

import { useState } from 'react';

interface Props {
  images: string[];
  propertyName: string;
}

/** 7-slot gallery grid (1 main + 3×2 right) with lightbox overlay. */
export function Gallery({ images, propertyName }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  // 5-slot grid: 1 main + 2×2 right (3 columns — right column reserved for booking overlay)
  const slots = Array.from({ length: 5 }, (_, i) => images[i] ?? null);

  return (
    <>
      <div className="lp-gallery" style={{ position: 'relative' }}>
        <div className="lp-gallery-main" onClick={() => setLightbox(0)} style={{ cursor: 'pointer' }}>
          {slots[0]
            ? <img src={slots[0]} alt={propertyName} />
            : <div className="lp-gallery-placeholder">Foto principal</div>
          }
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} onClick={() => slots[i] && setLightbox(i)} style={{ cursor: slots[i] ? 'pointer' : 'default' }}>
            {slots[i]
              ? <img src={slots[i]!} alt={`${propertyName} ${i + 1}`} />
              : <div className="lp-gallery-placeholder">{i + 1}</div>
            }
          </div>
        ))}
        {images.length > 0 && (
          <button
            onClick={() => setLightbox(0)}
            style={{ position: 'absolute', bottom: 20, left: 20, background: 'white', border: '1px solid var(--rule)', padding: '10px 18px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px -8px rgba(0,0,0,.15)', zIndex: 5 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'inherit'; e.currentTarget.style.borderColor = 'var(--rule)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={7} height={7}/></svg>
            Ver las {images.length} fotos
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontSize: 20 }}
          >
            ×
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLightbox(Math.max(0, lightbox - 1)); }}
            disabled={lightbox === 0}
            style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: '50%', cursor: lightbox === 0 ? 'not-allowed' : 'pointer', fontSize: 22, opacity: lightbox === 0 ? .4 : 1 }}
          >
            ‹
          </button>
          {images[lightbox] && (
            <img
              src={images[lightbox]}
              alt={`${propertyName} ${lightbox + 1}`}
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
              onClick={e => e.stopPropagation()}
            />
          )}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(Math.min(images.length - 1, lightbox + 1)); }}
            disabled={lightbox === images.length - 1}
            style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: '50%', cursor: lightbox === images.length - 1 ? 'not-allowed' : 'pointer', fontSize: 22, opacity: lightbox === images.length - 1 ? .4 : 1 }}
          >
            ›
          </button>
          <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,.6)', fontSize: 13 }}>
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
