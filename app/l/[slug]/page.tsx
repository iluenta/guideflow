import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPropertyLandingBySlug } from '@/app/actions/landing-config';
import { LandingPageClient } from '@/components/property-landing/LandingPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPropertyLandingBySlug(slug);

  if (!data) {
    return { title: 'Alojamiento no encontrado' };
  }

  const { property, landing } = data;
  const title = property.name;
  const description = landing.hero_subtitle || landing.custom_description || property.description || '';
  const image = landing.gallery?.[0] || property.main_image_url;

  return {
    title: `${title} · Hospyia`,
    description,
    openGraph: {
      title: `${title} — Reserva directa`,
      description,
      images: image ? [image] : [],
      type: 'website',
    },
    robots: 'index, follow',
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPropertyLandingBySlug(slug);

  if (!data) {
    notFound();
  }

  const { property, landing, blockedDates, pricePeriods } = data;

  return (
    <LandingPageClient
      property={property}
      landing={landing}
      initialBlockedDates={blockedDates}
      pricePeriods={pricePeriods}
    />
  );
}
