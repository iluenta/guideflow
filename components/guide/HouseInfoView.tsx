'use client';

import React from 'react';
import { PageHeader } from './PageHeader';
import { Bed, Bath, Users, Ruler, ParkingCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface HouseInfoViewProps {
    onBack: () => void;
    property: any;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function HouseInfoView({ onBack, property, currentLanguage = 'es', onLanguageChange }: HouseInfoViewProps) {
    const features = [
        {
            icon: Bed,
            label: currentLanguage === 'es' ? `${property.beds || 0} Dormitorios` : `${property.beds || 0} Bedrooms`,
            detail: property.beds_description || (currentLanguage === 'es' ? 'Camas preparadas' : 'Beds prepared'),
            show: !!property.beds
        },
        {
            icon: Bath,
            label: currentLanguage === 'es' ? `${property.baths || 0} Baños` : `${property.baths || 0} Bathrooms`,
            detail: property.baths_description || (currentLanguage === 'es' ? 'Equipados' : 'Fully equipped'),
            show: !!property.baths
        },
        {
            icon: Users,
            label: currentLanguage === 'es' ? `Hasta ${property.guests || 0} huéspedes` : `Up to ${property.guests || 0} guests`,
            detail: currentLanguage === 'es' ? 'Ideal para su estancia' : 'Ideal for your stay',
            show: !!property.guests
        },
        {
            icon: Ruler,
            label: property.size_sqm ? `${property.size_sqm} m²` : (currentLanguage === 'es' ? 'Espacio amplio' : 'Spacious'),
            detail: currentLanguage === 'es' ? 'Superficie total' : 'Total area',
            show: !!property.size_sqm
        },
        {
            icon: ParkingCircle,
            label: currentLanguage === 'es' ? 'Parking' : 'Parking',
            detail: property.parking_info || (currentLanguage === 'es' ? 'Consultar disponibilidad' : 'Check availability'),
            show: !!property.parking_info
        }
    ].filter(f => f.show);

    return (
        <div className="min-h-screen bg-beige pb-10">
            <PageHeader
                title={currentLanguage === 'es' ? "Info Casa" : "House Info"}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="px-6 pt-6">
                {/* Hero Image Group (Mockup Image 1) */}
                {property.main_image_url && (
                    <div className="rounded-[24px] overflow-hidden mb-8 shadow-card ring-1 ring-navy/[0.03]">
                        <img
                            src={property.main_image_url}
                            alt={property.name}
                            className="w-full h-52 object-cover"
                        />
                    </div>
                )}

                {/* Title & Address */}
                <div className="mb-8">
                    <h2 className="font-serif text-[28px] text-navy font-bold leading-tight mb-2">
                        {property.name}
                    </h2>
                    <p className="text-sm text-slate font-medium leading-relaxed opacity-70">
                        {property.full_address}
                    </p>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-10">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="bg-cream rounded-2xl p-5 flex items-center gap-5 shadow-card border border-navy/[0.02]"
                        >
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 border border-navy/[0.03]">
                                <feature.icon className="w-6 h-6 text-navy" strokeWidth={1.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-serif text-[18px] font-bold text-navy leading-tight mb-0.5">{feature.label}</p>
                                <p className="text-[13px] text-slate font-medium opacity-60 truncate">{feature.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Description Section */}
                {property.description && (
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-navy/[0.02] mb-8">
                        <h3 className="font-serif text-xl text-navy font-bold mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-navy/40" />
                            {currentLanguage === 'es' ? "Sobre la propiedad" : "About the property"}
                        </h3>
                        <p className="text-slate text-[14px] leading-relaxed font-medium whitespace-pre-wrap opacity-80">
                            {property.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Mockup powered text */}
            <div className="px-6 mt-12 text-center opacity-20">
                <p className="text-[8px] text-navy uppercase font-black tracking-[0.3em]">
                    Detalles verificados por el anfitrión
                </p>
            </div>
        </div>
    );
}
