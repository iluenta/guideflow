'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { updatePropertyLandingConfig } from '@/app/actions/landing-config';
import type { PropertyLanding } from '@/lib/types/property';
import { LandingPreviewClient } from './LandingPreviewClient';
import {
  FormSection, FormTextInput, FormNumberInput, FormSelect,
  FormToggle, FormTextarea, FormRepeater, FormGallery,
} from './FormFields';
import { PricingEditor } from './pricing/PricingEditor';
import { BlockedPeriodsEditor } from './pricing/BlockedPeriodsEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  propertyId: string;
  tenantId: string;
  propertyName: string;
  propertySlug: string | null;
  propertyDescription: string;
  propertyAmenities: string[];
  initialConfig: PropertyLanding | null;
  /** Pre-filled from property welcome context */
  welcomeHostName?: string;
  welcomeMessage?: string;
}

type Config = Omit<PropertyLanding, 'property_id' | 'tenant_id'>;
type Errors = Partial<Record<keyof Config | 'general', string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTES: { value: PropertyLanding['palette']; label: string; color: string }[] = [
  { value: 'navy',     label: 'Navy',      color: '#1e3a8a' },
  { value: 'coastal',  label: 'Coastal',   color: '#0369a1' },
  { value: 'warm',     label: 'Warm',      color: '#b45309' },
  { value: 'warmsand', label: 'Warmsand',  color: '#8a5a2b' },
  { value: 'forest',   label: 'Forest',    color: '#14532d' },
  { value: 'ink',      label: 'Ink',       color: '#18181b' },
  { value: 'modern',   label: 'Modern',    color: '#6366f1' },
  { value: 'urban',    label: 'Urban',     color: '#374151' },
  { value: 'luxury',   label: 'Luxury',    color: '#854d0e' },
];

const CHECK_IN_TIMES  = ['11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const CHECK_OUT_TIMES = ['09:00','10:00','11:00','12:00','13:00'];

const DEFAULT: Config = {
  enabled: false,
  hero_title: '', hero_subtitle: '', custom_description: '',
  contact_email: '', contact_phone: '',
  price_per_night: 100, cleaning_fee: 0, service_fee_pct: 8,
  tourist_tax_per_night: 0, pet_fee_flat: 0,
  palette: 'warm', typography: 'modern', border_radius: 'soft',
  show_calendar: true, show_pricing: true, show_location: true, show_reviews: true,
  policies: { checkIn: '15:00', checkOut: '11:00', cancellation: 'Cancelación gratuita hasta 48h antes', minStay: 1 },
  faqs: [], gallery: [],
  host_name: '', host_bio: '',
  landing_amenities: [],
  reviews_rating: 0, reviews_count: 0, reviews_list: [],
  size_sqm: undefined,
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(config: Config, propertyName: string): Errors {
  const errors: Errors = {};
  const title = config.hero_title?.trim() || propertyName;
  if (!title) errors.hero_title = 'El título es obligatorio';
  if (!config.contact_email?.trim()) {
    errors.contact_email = 'El email de contacto es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contact_email)) {
    errors.contact_email = 'Email no válido';
  }
  if (config.price_per_night < 0) errors.price_per_night = 'Debe ser ≥ 0';
  if (config.cleaning_fee < 0) errors.cleaning_fee = 'Debe ser ≥ 0';
  if (config.service_fee_pct < 0 || config.service_fee_pct > 100) errors.service_fee_pct = 'Entre 0 y 100';
  if (config.tourist_tax_per_night < 0) errors.tourist_tax_per_night = 'Debe ser ≥ 0';
  if (config.pet_fee_flat < 0) errors.pet_fee_flat = 'Debe ser ≥ 0';
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LandingEditor({ propertyId, tenantId, propertyName, propertySlug, propertyDescription, propertyAmenities, initialConfig, welcomeHostName = '', welcomeMessage = '' }: Props) {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<Config>(() => {
    if (!initialConfig) {
      return {
        ...DEFAULT,
        hero_title: propertyName,
        custom_description: propertyDescription,
        host_name: welcomeHostName,
        host_bio: welcomeMessage,
      };
    }
    const { property_id: _, tenant_id: __, ...rest } = initialConfig;
    // Only use welcome defaults if fields are still empty in saved config
    return {
      ...rest,
      host_name: rest.host_name || welcomeHostName,
      host_bio:  rest.host_bio  || welcomeMessage,
    };
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const lastSavedRef = useRef(JSON.stringify(config));

  // Track unsaved changes
  useEffect(() => {
    const dirty = JSON.stringify(config) !== lastSavedRef.current;
    setIsDirty(dirty);
  }, [config]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const set = useCallback(<K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig(c => ({ ...c, [key]: value }));
    setErrors(e => { const next = { ...e }; delete next[key as keyof Errors]; return next; });
  }, []);

  const setPolicy = useCallback(<K extends keyof Config['policies']>(key: K, value: Config['policies'][K]) => {
    setConfig(c => ({ ...c, policies: { ...c.policies, [key]: value } }));
  }, []);

  const handleSave = useCallback(() => {
    const errs = validate(config, propertyName);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Corrige los errores antes de guardar');
      return;
    }
    startTransition(async () => {
      try {
        await updatePropertyLandingConfig(propertyId, config as Partial<PropertyLanding>);
        lastSavedRef.current = JSON.stringify(config);
        setIsDirty(false);
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 2500);
        toast.success('Cambios guardados correctamente');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar');
      }
    });
  }, [config, propertyId, propertyName, startTransition]);

  const copyUrl = useCallback(() => {
    if (propertySlug) navigator.clipboard.writeText(`${window.location.origin}/l/${propertySlug}`);
  }, [propertySlug]);

  const publicUrl = propertySlug ? `/l/${propertySlug}` : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 520px) 1fr', minHeight: '100vh', margin: '-24px', background: '#f9fafb' }}>
      {/* ── Left panel: Editor ─────────────────────────────────────────────── */}
      <div style={{ borderRight: '1px solid #e5e7eb', background: 'white', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/properties" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>←</Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Editor de Landing
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{propertyName}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isDirty && !isPending && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} title="Cambios sin guardar" />
            )}
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                👁 Vista previa
              </a>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{ padding: '7px 16px', background: isPending ? '#e5e7eb' : '#6366f1', color: isPending ? '#9ca3af' : 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isPending ? (
                <><Spinner /> Guardando…</>
              ) : saveOk ? (
                <>✓ Guardado</>
              ) : (
                <>💾 Guardar</>
              )}
            </button>
          </div>
        </div>

        {/* Public URL bar */}
        {publicUrl && (
          <div style={{ padding: '10px 24px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>URL pública</div>
              <div style={{ fontSize: 12, color: '#0284c7', fontFamily: 'monospace' }}>/l/{propertySlug}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={copyUrl} style={{ padding: '5px 10px', border: '1px solid #bae6fd', borderRadius: 6, background: 'white', fontSize: 12, cursor: 'pointer', color: '#0369a1' }}>Copiar</button>
              <a href={publicUrl} target="_blank" rel="noreferrer" style={{ padding: '5px 10px', border: '1px solid #bae6fd', borderRadius: 6, background: 'white', fontSize: 12, cursor: 'pointer', color: '#0369a1', textDecoration: 'none' }}>Abrir ↗</a>
            </div>
          </div>
        )}

        {/* Form body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>

          {/* ── Estado de la landing ── */}
          <FormSection title="Estado">
            <FormToggle
              label="Landing activa"
              description={config.enabled ? 'Visible públicamente en la URL' : 'Oculta — no aparece públicamente'}
              value={config.enabled}
              onChange={v => set('enabled', v)}
            />
          </FormSection>

          {/* ── Contenido ── */}
          <FormSection title="Contenido">
            <FormTextInput
              label="Título principal"
              value={config.hero_title ?? ''}
              onChange={v => set('hero_title', v)}
              placeholder={propertyName}
              maxLength={60}
              error={errors.hero_title}
              help="Se muestra en la cabecera de la landing"
            />
            <FormTextInput
              label="Subtítulo"
              value={config.hero_subtitle ?? ''}
              onChange={v => set('hero_subtitle', v)}
              placeholder="Ej: Apartamento de lujo frente al mar"
              maxLength={120}
            />
            <FormTextarea
              label="Descripción"
              value={config.custom_description ?? ''}
              onChange={v => set('custom_description', v)}
              placeholder={propertyDescription || 'Describe tu alojamiento…'}
              maxLength={500}
              rows={5}
              help="Si lo dejas vacío, se usa la descripción de la propiedad"
            />
            <FormNumberInput
              label="Tamaño (m²)"
              value={config.size_sqm ?? 0}
              onChange={v => set('size_sqm', v > 0 ? v : undefined)}
              min={0}
              step={1}
              suffix="m²"
              help="Opcional — aparece en la ficha junto a dormitorios y baños"
            />
          </FormSection>

          {/* ── Contacto ── */}
          <FormSection title="Contacto">
            <FormTextInput
              label="Email de contacto"
              value={config.contact_email}
              onChange={v => set('contact_email', v)}
              placeholder="reservas@ejemplo.com"
              type="email"
              required
              error={errors.contact_email}
            />
            <FormTextInput
              label="Teléfono"
              value={config.contact_phone ?? ''}
              onChange={v => set('contact_phone', v)}
              placeholder="+34 600 000 000"
              type="tel"
            />
          </FormSection>

          {/* ── Precios base ── */}
          <FormSection title="Precios">
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
              El <strong>precio base</strong> se usa cuando el viajero reserva noches fuera de cualquier temporada definida.
              Las <strong>temporadas dinámicas</strong> (abajo) tienen prioridad.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormNumberInput label="Precio base / noche" value={config.price_per_night} onChange={v => set('price_per_night', v)} min={0} suffix="€" error={errors.price_per_night} />
              <FormNumberInput label="Limpieza" value={config.cleaning_fee} onChange={v => set('cleaning_fee', v)} min={0} suffix="€" />
              <FormNumberInput label="Gestión (%)" value={config.service_fee_pct} onChange={v => set('service_fee_pct', v)} min={0} max={100} suffix="%" />
              <FormNumberInput label="Tasa turística / noche / pers." value={config.tourist_tax_per_night} onChange={v => set('tourist_tax_per_night', v)} min={0} suffix="€" />
              <FormNumberInput label="Suplemento mascotas" value={config.pet_fee_flat} onChange={v => set('pet_fee_flat', v)} min={0} suffix="€" />
            </div>
          </FormSection>

          {/* ── Temporadas dinámicas ── */}
          <FormSection title="Temporadas y excepciones">
            <PricingEditor propertyId={propertyId} />
          </FormSection>

          {/* ── Períodos cerrados ── */}
          <FormSection title="Períodos cerrados">
            <BlockedPeriodsEditor propertyId={propertyId} />
          </FormSection>

          {/* ── Diseño ── */}
          <FormSection title="Diseño">
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Paleta</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PALETTES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('palette', p.value)}
                    title={p.label}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: config.palette === p.value ? `3px solid #6366f1` : '2px solid #e5e7eb',
                      background: p.color, cursor: 'pointer', outline: config.palette === p.value ? '2px solid #e0e7ff' : 'none',
                      transition: 'transform .15s', transform: config.palette === p.value ? 'scale(1.15)' : 'scale(1)',
                    }}
                    aria-label={p.label}
                    aria-pressed={config.palette === p.value}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Paleta: {PALETTES.find(p => p.value === config.palette)?.label}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormSelect
                label="Tipografía"
                value={config.typography}
                onChange={v => set('typography', v as PropertyLanding['typography'])}
                options={[{ value: 'modern', label: 'Modern (sans)' }, { value: 'editorial', label: 'Editorial (serif)' }]}
              />
              <FormSelect
                label="Bordes"
                value={config.border_radius}
                onChange={v => set('border_radius', v as PropertyLanding['border_radius'])}
                options={[{ value: 'soft', label: 'Suaves' }, { value: 'sharp', label: 'Angulares' }]}
              />
            </div>
          </FormSection>

          {/* ── Secciones visibles ── */}
          <FormSection title="Secciones visibles">
            <FormToggle label="Calendario y reserva" value={config.show_calendar} onChange={v => set('show_calendar', v)} />
            <FormToggle label="Precios y tarifas" value={config.show_pricing} onChange={v => set('show_pricing', v)} />
            <FormToggle label="Mapa de ubicación" value={config.show_location} onChange={v => set('show_location', v)} />
            <FormToggle label="Reseñas de huéspedes" value={config.show_reviews} onChange={v => set('show_reviews', v)} />
          </FormSection>

          {/* ── Políticas ── */}
          <FormSection title="Políticas y normas">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormSelect label="Hora de entrada" value={config.policies.checkIn} onChange={v => setPolicy('checkIn', v)} options={CHECK_IN_TIMES.map(t => ({ value: t, label: t }))} />
              <FormSelect label="Hora de salida" value={config.policies.checkOut} onChange={v => setPolicy('checkOut', v)} options={CHECK_OUT_TIMES.map(t => ({ value: t, label: t }))} />
            </div>
            <FormNumberInput label="Estancia mínima (noches)" value={config.policies.minStay} onChange={v => setPolicy('minStay', v)} min={1} step={1} />
            <FormTextarea label="Política de cancelación" value={config.policies.cancellation} onChange={v => setPolicy('cancellation', v)} rows={2} />
          </FormSection>

          {/* ── Amenities (informacional) ── */}
          {propertyAmenities.length > 0 && (
            <FormSection title="Amenities de la propiedad">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                {propertyAmenities.map(a => (
                  <span key={a} style={{ padding: '4px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, fontSize: 12, color: '#15803d' }}>
                    ✓ {a}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>Los amenities se toman de la configuración de la propiedad. Edítalos en los ajustes de la propiedad.</p>
            </FormSection>
          )}

          {/* ── Anfitrión ── */}
          <FormSection title="Anfitrión">
            <FormTextInput
              label="Nombre del anfitrión"
              value={config.host_name ?? ''}
              onChange={v => set('host_name', v)}
              placeholder="Ej: Sofía Martínez"
              maxLength={60}
              help="Aparece en la sección 'Anfitrión' de la landing"
            />
            <FormTextarea
              label="Bio del anfitrión"
              value={config.host_bio ?? ''}
              onChange={v => set('host_bio', v)}
              placeholder="Nació en Málaga y lleva 6 años cuidando este apartamento..."
              rows={3}
              maxLength={300}
            />
          </FormSection>

          {/* ── Amenities de landing ── */}
          <FormSection title="Servicios del alojamiento">
            <AmenitiesEditor
              items={config.landing_amenities ?? []}
              onChange={v => set('landing_amenities', v)}
            />
          </FormSection>

          {/* ── Reseñas ── */}
          <FormSection title="Reseñas">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <FormNumberInput
                label="Puntuación media"
                value={config.reviews_rating ?? 0}
                onChange={v => set('reviews_rating', Math.min(5, Math.max(0, v)))}
                min={0} max={5} step={0.01}
                help="0 = ocultar puntuación"
              />
              <FormNumberInput
                label="Número de reseñas"
                value={config.reviews_count ?? 0}
                onChange={v => set('reviews_count', v)}
                min={0} step={1}
              />
            </div>
            <ReviewsEditor
              items={config.reviews_list ?? []}
              onChange={v => set('reviews_list', v)}
            />
          </FormSection>

          {/* ── FAQs ── */}
          <FormSection title="Preguntas frecuentes">
            <FormRepeater label="" items={config.faqs} onChange={v => set('faqs', v)} />
          </FormSection>

          {/* ── Galería ── */}
          <FormSection title="Galería de imágenes">
            <FormGallery images={config.gallery} onChange={v => set('gallery', v)} propertyId={propertyId} tenantId={tenantId} />
          </FormSection>

          {/* Footer save */}
          <div style={{ paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{ padding: '10px 24px', background: isPending ? '#e5e7eb' : '#6366f1', color: isPending ? '#9ca3af' : 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right panel: Live preview ──────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', background: '#f1f5f9' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Vista previa en vivo</div>
          <div style={{ fontSize: 11, color: isDirty ? '#f59e0b' : '#10b981', fontWeight: 500 }}>
            {isDirty ? '● Cambios sin guardar' : '● Al día'}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px -8px rgba(0,0,0,.12)', border: '1px solid #e2e8f0' }}>
            <LandingPreviewClient config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AmenitiesEditor ──────────────────────────────────────────────────────────

function AmenitiesEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setInput('');
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Ej: WiFi fibra 600 Mbps"
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <button type="button" onClick={add} style={{ padding: '8px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Añadir</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 999, fontSize: 12, color: '#0369a1' }}>
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      {items.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af' }}>Sin servicios añadidos. Escribe y pulsa Enter.</p>}
    </div>
  );
}

// ─── ReviewsEditor ────────────────────────────────────────────────────────────

type ReviewItem = { author: string; country?: string; date: string; text: string };

function ReviewsEditor({ items, onChange }: { items: ReviewItem[]; onChange: (v: ReviewItem[]) => void }) {
  const add = () => onChange([...items, { author: '', country: '', date: '', text: '' }]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const update = (i: number, key: keyof ReviewItem, v: string) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: v };
    onChange(next);
  };
  return (
    <div>
      {items.map((r, i) => (
        <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Reseña {i + 1}</span>
            <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input placeholder="Nombre" value={r.author} onChange={e => update(i, 'author', e.target.value)} style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
            <input placeholder="País (opcional)" value={r.country ?? ''} onChange={e => update(i, 'country', e.target.value)} style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
          </div>
          <input placeholder="Fecha (ej: Enero 2025)" value={r.date} onChange={e => update(i, 'date', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
          <textarea placeholder="Texto de la reseña" value={r.text} rows={2} onChange={e => update(i, 'text', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      ))}
      <button type="button" onClick={add} style={{ width: '100%', padding: '8px 0', background: 'transparent', border: '1.5px dashed #d1d5db', borderRadius: 8, color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>+ Añadir reseña</button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'lp-spin .7s linear infinite' }}>
      <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
