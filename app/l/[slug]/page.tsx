import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPropertyLandingBySlug } from '@/app/actions/landing-config';
import { LandingPageClient } from '@/components/property-landing/LandingPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://hospyia.com';

/** Best available cover image. */
function coverImage(landing: { gallery?: string[] }, property: { main_image_url?: string | null }): string | null {
  return landing.gallery?.[0] || property.main_image_url || null;
}

/** Aggregate rating from platform_ratings or legacy fields. */
function aggregateRating(landing: {
  platform_ratings?: { platform: string; rating: number; count: number }[];
  reviews_rating?: number;
  reviews_count?: number;
}): { ratingValue: number; reviewCount: number } | null {
  const platforms = (landing.platform_ratings ?? []).filter(p => p.rating > 0 && p.count > 0);

  if (platforms.length > 0) {
    // Normalize all ratings to /10 scale, then average
    const total = platforms.reduce((sum, p) => sum + (p.rating > 5 ? p.rating : p.rating * 2), 0);
    const avgOut10 = total / platforms.length;
    const totalCount = platforms.reduce((s, p) => s + p.count, 0);
    return { ratingValue: Math.round(avgOut10 * 10) / 10, reviewCount: totalCount };
  }

  if ((landing.reviews_rating ?? 0) > 0) {
    const r = landing.reviews_rating!;
    return {
      ratingValue: r > 5 ? r : Math.round(r * 20) / 10, // convert /5 to /10
      reviewCount: landing.reviews_count ?? 0,
    };
  }

  return null;
}

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPropertyLandingBySlug(slug);

  if (!data) return { title: 'Alojamiento no encontrado' };

  const { property, landing } = data;
  const name = property.name;
  const prop = property as typeof property & { country?: string };
  const location = [property.city, prop.country].filter(Boolean).join(', ');
  const image = coverImage(landing, property);

  const title = `${name} — Alquiler vacacional en ${location || 'España'}`;
  const description = [
    landing.custom_description || landing.hero_subtitle || property.description,
    property.beds ? `${property.beds} dormitorios.` : null,
    property.guests ? `Hasta ${property.guests} huéspedes.` : null,
    `Desde ${landing.price_per_night}€/noche. Reserva directa sin comisiones.`,
  ].filter(Boolean).join(' ');

  const canonical = `${SITE_URL}/l/${slug}`;

  const keywords = [
    name,
    location ? `alquiler ${location}` : null,
    'casa vacaciones',
    'alquiler vacacional',
    property.beds ? `${property.beds} dormitorios` : null,
    property.city,
    'reserva directa',
  ].filter(Boolean).join(', ');

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: name,
      description: landing.hero_subtitle || description.substring(0, 160),
      images: image ? [{ url: image, width: 1200, height: 630, alt: name }] : [],
      type: 'website',
      url: canonical,
      locale: 'es_ES',
      siteName: 'Hospyia',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: landing.hero_subtitle || description.substring(0, 160),
      images: image ? [image] : [],
    },
  };
}

// ── JSON-LD structured data ───────────────────────────────────────────────────

function buildJsonLd(data: NonNullable<Awaited<ReturnType<typeof getPropertyLandingBySlug>>>) {
  const { property, landing } = data;
  const slug = property.slug;
  const image = coverImage(landing, property);
  const canonical = `${SITE_URL}/l/${slug}`;
  const aggRating = aggregateRating(landing);
  // Extra geo fields exist in DB but not in the minimal Property TypeScript type
  const propX = property as any;

  const address = property.full_address
    ? {
        '@type': 'PostalAddress',
        streetAddress: property.full_address,
        addressLocality: property.city ?? undefined,
        addressRegion: propX.neighborhood ?? undefined,
        postalCode: propX.postal_code ?? undefined,
        addressCountry: propX.country_code ?? 'ES',
      }
    : property.city
      ? {
          '@type': 'PostalAddress',
          addressLocality: property.city,
          addressCountry: propX.country_code ?? 'ES',
        }
      : undefined;

  const amenities = (landing.landing_amenities ?? []).map((a: string) => ({
    '@type': 'LocationFeatureSpecification',
    name: a,
    value: true,
  }));

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: landing.custom_description || landing.hero_subtitle || property.description || undefined,
    url: canonical,
    ...(image ? { image } : {}),
    ...(address ? { address } : {}),
    ...(property.latitude && property.longitude
      ? { geo: { '@type': 'GeoCoordinates', latitude: property.latitude, longitude: property.longitude } }
      : {}),
    priceRange: `€${landing.price_per_night}`,
    ...(amenities.length > 0 ? { amenityFeature: amenities } : {}),
    ...(property.guests ? { numberOfRooms: property.beds ?? undefined, occupancy: { '@type': 'QuantitativeValue', maxValue: property.guests } } : {}),
    ...(landing.tourist_registration ? { identifier: { '@type': 'PropertyValue', name: 'Registro Turístico', value: landing.tourist_registration } } : {}),
    ...(aggRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: aggRating.ratingValue,
            bestRating: 10,
            ratingCount: aggRating.reviewCount,
          },
        }
      : {}),
  };

  return JSON.stringify(ld);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPropertyLandingBySlug(slug);

  if (!data) notFound();

  const { property, landing, blockedDates, hostBlockedDates, hostBlockedLabels, pricePeriods } = data;

  return (
    <>
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildJsonLd(data) }}
      />

      <LandingPageClient
        property={property}
        landing={landing}
        initialBlockedDates={blockedDates}
        hostBlockedDates={hostBlockedDates}
        hostBlockedLabels={hostBlockedLabels}
        pricePeriods={pricePeriods}
      />
    </>
  );
}
