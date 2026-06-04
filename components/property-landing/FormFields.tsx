'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Shared field wrapper ────────────────────────────────────────────────────

interface WrapperProps {
  label: string;
  error?: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
  charCount?: { current: number; max: number };
}

function FieldWrapper({ label, error, help, required, children, charCount }: WrapperProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: error ? '#dc2626' : '#374151', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {label}{required && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
        </label>
        {charCount && (
          <span style={{ fontSize: 11, color: charCount.current > charCount.max * 0.9 ? '#dc2626' : '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
            {charCount.current}/{charCount.max}
          </span>
        )}
      </div>
      {children}
      {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</p>}
      {help && !error && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{help}</p>}
    </div>
  );
}

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '9px 12px',
  background: '#fff',
  border: `1px solid ${hasError ? '#dc2626' : '#e5e7eb'}`,
  borderRadius: 8,
  fontSize: 14,
  color: '#111827',
  outline: 'none',
  transition: 'border-color .15s',
  boxSizing: 'border-box',
});

// ─── FormTextInput ───────────────────────────────────────────────────────────

interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  help?: string;
  required?: boolean;
  maxLength?: number;
  type?: 'text' | 'email' | 'tel';
}

export function FormTextInput({ label, value, onChange, placeholder, error, help, required, maxLength, type = 'text' }: TextInputProps) {
  return (
    <FieldWrapper label={label} error={error} help={help} required={required} charCount={maxLength ? { current: value.length, max: maxLength } : undefined}>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={inputStyle(!!error)}
        onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? '#dc2626' : '#e5e7eb'; }}
      />
    </FieldWrapper>
  );
}

// ─── FormNumberInput ─────────────────────────────────────────────────────────

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  error?: string;
  help?: string;
}

export function FormNumberInput({ label, value, onChange, min = 0, max, step = 0.01, suffix, error, help }: NumberInputProps) {
  return (
    <FieldWrapper label={label} error={error} help={help}>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(Number(e.target.value))}
          style={{ ...inputStyle(!!error), paddingRight: suffix ? 36 : 12 }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? '#dc2626' : '#e5e7eb'; }}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#6b7280', pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
}

// ─── FormTextarea ────────────────────────────────────────────────────────────

interface TextareaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  error?: string;
  help?: string;
}

export function FormTextarea({ label, value, onChange, placeholder, rows = 4, maxLength, error, help }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error} help={help} charCount={maxLength ? { current: value.length, max: maxLength } : undefined}>
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle(!!error), resize: 'vertical', minHeight: rows * 24 }}
        onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? '#dc2626' : '#e5e7eb'; }}
      />
    </FieldWrapper>
  );
}

// ─── FormSelect ──────────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string; }

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  error?: string;
  help?: string;
}

export function FormSelect({ label, value, onChange, options, error, help }: SelectProps) {
  return (
    <FieldWrapper label={label} error={error} help={help}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle(!!error), cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32 }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldWrapper>
  );
}

// ─── FormToggle ──────────────────────────────────────────────────────────────

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function FormToggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        style={{
          width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: value ? '#6366f1' : '#d1d5db',
          position: 'relative', flexShrink: 0, transition: 'background .2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s',
        }} />
      </button>
    </div>
  );
}

// ─── FormSection ─────────────────────────────────────────────────────────────

interface SectionProps { title: string; children: React.ReactNode; }

export function FormSection({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #f3f4f6' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── FormRepeater (FAQs) ─────────────────────────────────────────────────────

interface FAQ { question: string; answer: string; }

interface RepeaterProps {
  label: string;
  items: FAQ[];
  onChange: (items: FAQ[]) => void;
}

export function FormRepeater({ label, items, onChange }: RepeaterProps) {
  const add = () => onChange([...items, { question: '', answer: '' }]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const update = (i: number, field: keyof FAQ, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{label}</div>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>FAQ {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
              aria-label="Eliminar FAQ"
            >
              ×
            </button>
          </div>
          <input
            placeholder="Pregunta"
            value={item.question}
            onChange={e => update(i, 'question', e.target.value)}
            style={{ ...inputStyle(), marginBottom: 8 }}
          />
          <textarea
            placeholder="Respuesta"
            value={item.answer}
            rows={2}
            onChange={e => update(i, 'answer', e.target.value)}
            style={{ ...inputStyle(), resize: 'vertical' }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{ width: '100%', padding: '8px 0', background: 'transparent', border: '1.5px dashed #d1d5db', borderRadius: 8, color: '#6b7280', fontSize: 13, cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
      >
        + Añadir pregunta
      </button>
    </div>
  );
}

// ─── FormRulesRepeater (Normas personalizadas) ────────────────────────────────

export interface HouseRule { title: string; note: string; }

interface RulesRepeaterProps {
  items: HouseRule[];
  onChange: (items: HouseRule[]) => void;
}

export function FormRulesRepeater({ items, onChange }: RulesRepeaterProps) {
  const add    = () => onChange([...items, { title: '', note: '' }]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const update = (i: number, field: keyof HouseRule, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Norma {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
              aria-label="Eliminar norma"
            >
              ×
            </button>
          </div>
          <input
            placeholder="Título (ej: No se permiten fiestas)"
            value={item.title}
            onChange={e => update(i, 'title', e.target.value)}
            style={{ ...inputStyle(), marginBottom: 8 }}
          />
          <input
            placeholder="Nota opcional (ej: Comunidad de vecinos tranquila)"
            value={item.note}
            onChange={e => update(i, 'note', e.target.value)}
            style={{ ...inputStyle() }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{ width: '100%', padding: '8px 0', background: 'transparent', border: '1.5px dashed #d1d5db', borderRadius: 8, color: '#6b7280', fontSize: 13, cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
      >
        + Añadir norma
      </button>
    </div>
  );
}

// ─── FormPlatformRatingsRepeater ──────────────────────────────────────────────

export interface PlatformRating { platform: string; rating: number; count: number; }

const PLATFORM_SUGGESTIONS = [
  'Booking.com', 'Airbnb', 'Google', 'TripAdvisor', 'Expedia', 'VRBO', 'Google Maps',
];

interface PlatformRatingsProps {
  items: PlatformRating[];
  onChange: (items: PlatformRating[]) => void;
}

export function FormPlatformRatingsRepeater({ items, onChange }: PlatformRatingsProps) {
  const add    = () => onChange([...items, { platform: '', rating: 9.0, count: 0 }]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const update = <K extends keyof PlatformRating>(i: number, field: K, value: PlatformRating[K]) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Plataforma {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
            >×</button>
          </div>
          {/* Platform name with suggestions */}
          <div style={{ marginBottom: 8 }}>
            <input
              list={`platform-suggestions-${i}`}
              placeholder="Nombre de la plataforma"
              value={item.platform}
              onChange={e => update(i, 'platform', e.target.value)}
              style={{ ...inputStyle(), width: '100%' }}
            />
            <datalist id={`platform-suggestions-${i}`}>
              {PLATFORM_SUGGESTIONS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          {/* Rating + Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Puntuación</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                placeholder="9.2"
                value={item.rating || ''}
                onChange={e => update(i, 'rating', parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle(), width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nº reseñas</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="1840"
                value={item.count || ''}
                onChange={e => update(i, 'count', parseInt(e.target.value) || 0)}
                style={{ ...inputStyle(), width: '100%' }}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{ width: '100%', padding: '8px 0', background: 'transparent', border: '1.5px dashed #d1d5db', borderRadius: 8, color: '#6b7280', fontSize: 13, cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
      >
        + Añadir plataforma
      </button>
    </div>
  );
}

// ─── FormGallery ─────────────────────────────────────────────────────────────

const BUCKET = 'property-images';

interface GalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  propertyId: string;
  tenantId: string;
}

export function FormGallery({ images, onChange, propertyId, tenantId }: GalleryProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remove = (i: number) => onChange(images.filter((_, j) => j !== i));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return;
    move(dragIdx, i);
    setDragIdx(null);
  };

  const MAX_IMAGES = 7;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_IMAGES - images.length;
    if (slots <= 0) return;
    setUploading(true);
    setUploadError('');
    const supabase = createClient();
    const added: string[] = [];

    for (const file of Array.from(files).slice(0, slots)) {
      if (!file.type.startsWith('image/')) continue;
      const ext = file.name.split('.').pop() ?? 'jpg';
      // Path must start with tenant_id to satisfy RLS policy
      const path = `${tenantId}/landings/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        setUploadError(`Error subiendo ${file.name}: ${error.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      added.push(publicUrl);
    }

    if (added.length > 0) onChange([...images, ...added]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Galería</div>

      {/* Upload button */}
      <div style={{ marginBottom: 12 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', padding: '10px 16px',
            background: (uploading || images.length >= MAX_IMAGES) ? '#e5e7eb' : '#6366f1',
            color: (uploading || images.length >= MAX_IMAGES) ? '#9ca3af' : 'white',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            cursor: (uploading || images.length >= MAX_IMAGES) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {uploading ? (
            <><UploadSpinner /> Subiendo…</>
          ) : images.length >= MAX_IMAGES ? (
            <>✓ Límite alcanzado (5 fotos)</>
          ) : (
            <>📷 Subir imágenes (JPG, PNG, WEBP) — {MAX_IMAGES - images.length} restantes</>
          )}
        </button>
        {uploadError && (
          <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{uploadError}</p>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              style={{
                position: 'relative', borderRadius: 8, overflow: 'hidden',
                border: dragIdx === i ? '2px dashed #6366f1' : '1px solid #e5e7eb',
                aspectRatio: '16/9', background: '#f3f4f6', cursor: 'grab',
              }}
            >
              <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 6, background: 'linear-gradient(to bottom, rgba(0,0,0,.4), transparent 40%)' }}>
                <span style={{ fontSize: 11, color: 'white', fontWeight: 600, background: 'rgba(0,0,0,.4)', padding: '2px 6px', borderRadius: 4 }}>
                  {i === 0 ? 'Principal' : `#${i + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  style={{ background: 'rgba(220,38,38,.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: 'white', cursor: 'pointer', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Eliminar imagen"
                >
                  ×
                </button>
              </div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: 2 }}>
                {i > 0 && (
                  <button type="button" onClick={() => move(i, i - 1)} style={{ background: 'rgba(0,0,0,.5)', border: 'none', color: 'white', borderRadius: 3, width: 20, height: 20, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>
                )}
                {i < images.length - 1 && (
                  <button type="button" onClick={() => move(i, i + 1)} style={{ background: 'rgba(0,0,0,.5)', border: 'none', color: 'white', borderRadius: 3, width: 20, height: 20, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: 8, color: '#9ca3af', fontSize: 13 }}>
          Sin imágenes. Sube fotos con el botón de arriba.
        </div>
      )}
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Arrastra para reordenar · La primera imagen es la principal · Máximo 7 fotos</p>
    </div>
  );
}

function UploadSpinner() {
  return (
    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'ff-spin .7s linear infinite' }}>
      <style>{`@keyframes ff-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

