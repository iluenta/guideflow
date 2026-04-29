'use client';

import React, { useState } from 'react';
import { MapPin, Wifi, Key, Car, Clock, Phone, Copy, Check, ExternalLink, MessageCircle, Star, DoorOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuideThemeClasses } from '@/lib/guide-theme';

interface GlanceBlockProps {
    context: any[];
    property?: any;
    themeId?: string;
    t: GuideThemeClasses;
    onNavigate: (screen: string) => void;
    checkinDate?: string;
    checkoutDate?: string;
}

// Reutiliza la misma lógica de detección de código que CheckInView.tsx
function isCode(text: string): boolean {
    const trimmed = (text || '').trim();
    return /^[0-9A-Z]{3,8}$/.test(trimmed) || trimmed.includes('Código:');
}

interface GlanceRowProps {
    icon: React.ElementType;
    label: string;
    value: string;
    t: GuideThemeClasses;
    actions?: React.ReactNode;
    mono?: boolean;
}

function GlanceRow({ icon: Icon, label, value, t, actions, mono = false }: GlanceRowProps) {
    return (
        <div className={cn('flex items-center gap-3 px-4 py-3.5 rounded-2xl', t.chipBg)}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', t.chipIconBg)}>
                <Icon size={16} className={t.chipIconColor} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn('text-[9px] font-black uppercase tracking-widest mb-0.5', t.sectionLabel)}>
                    {label}
                </p>
                <p className={cn(
                    'text-sm font-bold truncate',
                    t.chipLabel,
                    mono && 'font-mono tracking-wider'
                )}>
                    {value}
                </p>
            </div>
            {actions && (
                <div className="flex items-center gap-1.5 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

export function GlanceBlock({ context, property, t, onNavigate, checkinDate, checkoutDate }: GlanceBlockProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const techData     = context?.find(c => c.category === 'tech')?.content     ?? {};
    const accessData   = context?.find(c => c.category === 'access')?.content   ?? {};
    const checkinData  = context?.find(c => c.category === 'checkin')?.content  ?? {};
    const rulesData    = context?.find(c => c.category === 'rules')?.content    ?? {};
    const contactsData = context?.find(c => c.category === 'contacts')?.content ?? {};
    const welcomeData  = context?.find(c => c.category === 'welcome')?.content  ?? {};

    const wifiSSID     = techData.wifi_ssid      || '';
    const wifiPass     = techData.wifi_password  || '';
    const address      = accessData.full_address || property?.full_address || '';
    
    // Parking logic — must respect the global property.has_parking toggle
    const hasParkingEnabled = property?.has_parking === true;
    const rawParkingData = property?.parking_number || accessData.parking_number || accessData.garage_spot || accessData.parking_info || '';
    const parkingInfo = hasParkingEnabled ? rawParkingData : '';

    const checkoutTime = rulesData.checkout_time || rulesData.check_out_time || '';
    
    // Par coherente: si hay support_mobile, el nombre es support_name; si no, host
    const supportPhone  = contactsData.support_mobile || contactsData.support_phone || '';
    const supportName   = contactsData.support_name   || '';
    const hostPhone     = contactsData.host_mobile     || contactsData.host_phone    || '';
    const hostName      = contactsData.host_name       || welcomeData.host_name      || '';
    const contactPhone  = supportPhone || hostPhone;
    const contactName   = supportPhone ? supportName : hostName;

    // Código de acceso — Prioridad absoluta al atributo de primer nivel de la propiedad
    const accessCodeStructured = property?.access_code || accessData.access_code || (property as any)?.access_code || '';
    const accessCodeFromSteps  = (checkinData.steps as any[] | undefined)
        ?.map(s => (s.description || '').trim())
        .find(d => isCode(d)) || '';
    const accessCode = accessCodeStructured || accessCodeFromSteps;

    // Contextual check row based on days since check-in
    let checkRowType: 'checkin' | 'checkout-today' | 'checkout' = 'checkout';
    if (checkinDate && checkoutDate) {
        const today = new Date();
        const cin = new Date(checkinDate);
        const cout = new Date(checkoutDate);
        today.setHours(0, 0, 0, 0);
        cin.setHours(0, 0, 0, 0);
        cout.setHours(0, 0, 0, 0);
        const daysFromCheckin = Math.floor((today.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24));
        if (daysFromCheckin <= 1) {
            checkRowType = 'checkin';
        } else if (today.getTime() === cout.getTime()) {
            checkRowType = 'checkout-today';
        }
    }

    // Solo mostrar si hay al menos 2 datos de valor
    const richFields = [address, accessCode, parkingInfo, wifiSSID, wifiPass, checkoutTime, contactPhone].filter(Boolean);
    if (richFields.length < 2) return null;

    const copy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const CopyBtn = ({ value, copyKey }: { value: string; copyKey: string }) => (
        <button
            aria-label={`Copiar ${copyKey}`}
            onClick={() => copy(value, copyKey)}
            className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90',
                copied === copyKey
                    ? 'bg-green-100 text-green-600 scale-105'
                    : cn('text-current opacity-60 hover:opacity-100', t.chipIconBg)
            )}
        >
            {copied === copyKey
                ? <Check size={14} />
                : <Copy size={14} />
            }
        </button>
    );

    const contactDigits = contactPhone.replace(/\D/g, '');

    return (
        <div className="mb-8">
            {/* Header */}
            <h3 className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2', t.sectionLabel)}>
                <Star size={12} className="text-[#f59e0b]" fill="currentColor" aria-hidden="true" />
                De un vistazo
            </h3>

            <div className="space-y-2">
                {/* 1. Dirección */}
                {address && (
                    <GlanceRow
                        icon={MapPin}
                        label="Dirección"
                        value={address}
                        t={t}
                        actions={
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Ver dirección en Google Maps"
                                className={cn('w-8 h-8 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 transition-all', t.chipIconBg)}
                            >
                                <ExternalLink size={14} className={t.chipIconColor} />
                            </a>
                        }
                    />
                )}

                {/* 2. Código */}
                {accessCode && (
                    <GlanceRow
                        icon={Key}
                        label="Código"
                        value={accessCode}
                        t={t}
                        mono
                        actions={<CopyBtn value={accessCode} copyKey="code" />}
                    />
                )}

                {/* 3. Parking */}
                {parkingInfo && (
                    <GlanceRow
                        icon={Car}
                        label="Parking"
                        value={parkingInfo}
                        t={t}
                    />
                )}

                {/* 4. WiFi SSID */}
                {wifiSSID && (
                    <GlanceRow
                        icon={Wifi}
                        label="WiFi SSID"
                        value={wifiSSID}
                        t={t}
                        actions={<CopyBtn value={wifiSSID} copyKey="ssid" />}
                    />
                )}

                {/* 5. WiFi Pass */}
                {wifiPass && (
                    <GlanceRow
                        icon={Wifi}
                        label="WiFi Pass"
                        value={wifiPass}
                        t={t}
                        mono
                        actions={<CopyBtn value={wifiPass} copyKey="pass" />}
                    />
                )}

                {/* 6. Check row — contextual según fase de la estancia */}
                {checkRowType === 'checkin' ? (
                    <button
                        onClick={() => onNavigate('checkin')}
                        className="w-full text-left active:scale-[0.98] transition-transform"
                    >
                        <GlanceRow
                            icon={DoorOpen}
                            label="CHECK-IN"
                            value="Cómo entrar al apartamento"
                            t={t}
                            actions={<ChevronRight size={14} className={cn('opacity-40', t.chipIconColor)} />}
                        />
                    </button>
                ) : checkRowType === 'checkout-today' ? (
                    <button
                        onClick={() => onNavigate('rules')}
                        className="w-full text-left active:scale-[0.98] transition-transform"
                    >
                        <GlanceRow
                            icon={Clock}
                            label="CHECK-OUT HOY"
                            value={checkoutTime || '—'}
                            t={t}
                            actions={<ChevronRight size={14} className={cn('opacity-40', t.chipIconColor)} />}
                        />
                    </button>
                ) : checkoutTime ? (
                    <GlanceRow
                        icon={Clock}
                        label="CHECK-OUT"
                        value={checkoutTime}
                        t={t}
                    />
                ) : null}

                {/* 7. Contacto */}
                {contactPhone && (
                    <GlanceRow
                        icon={Phone}
                        label={contactName || 'Contacto'}
                        value={contactPhone}
                        t={t}
                        actions={
                            <>
                                <a
                                    href={`tel:${contactDigits}`}
                                    aria-label={`Llamar a ${contactName || 'contacto'}`}
                                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 transition-all', t.chipIconBg)}
                                >
                                    <Phone size={14} className={t.chipIconColor} />
                                </a>
                                <a
                                    href={`https://wa.me/${contactDigits}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`WhatsApp a ${contactName || 'contacto'}`}
                                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 transition-all', t.chipIconBg)}
                                >
                                    <MessageCircle size={14} className={t.chipIconColor} />
                                </a>
                            </>
                        }
                    />
                )}
            </div>

            {/* CTA — ver detalles completos */}
            <button
                onClick={() => onNavigate('house-info')}
                className={cn(
                    'w-full mt-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-center rounded-xl transition-all active:scale-95 opacity-60 hover:opacity-90',
                    t.chipBg, t.chipLabel
                )}
            >
                Ver todos los detalles del apartamento →
            </button>
        </div>
    );
}
