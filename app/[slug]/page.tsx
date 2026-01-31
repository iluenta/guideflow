import { getPropertyBySlug, getGuideSections, getPropertyManuals } from '@/app/actions/properties'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { SectionRenderer } from '@/components/guide/SectionRenderer'
import { ManualsList } from '@/components/guide/ManualsList'
import { GuestChat } from '@/components/guide/GuestChat'
import { createClient } from '@/lib/supabase/server'
import { validateAccessToken } from '@/lib/security'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Home, ExternalLink, MapPin, Sparkles, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuidePageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ token?: string }>
}

export default async function GuidePage({ params, searchParams }: GuidePageProps) {
    const { slug } = await params
    const { token } = await searchParams
    const supabase = await createClient()

    // 1. Check Authentication (Host check)
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Security validation (Backup for middleware)
    if (!user) {
        if (!token) {
            redirect('/access-denied?reason=token_required')
        }

        const validation = await validateAccessToken(supabase, token)
        if (!validation.valid) {
            redirect(`/access-denied?reason=${validation.reason}`)
        }
    }

    const property = await getPropertyBySlug(slug)

    if (!property) {
        notFound()
    }

    const sections = await getGuideSections(property.id)
    const manuals = await getPropertyManuals(property.id)
    const primaryColor = property.theme_config?.primary_color || '#ef4444'

    return (
        <div
            className="min-h-screen bg-[#fafafa] pb-12 font-sans overflow-x-hidden"
            style={{ '--primary': primaryColor, '--primary-foreground': '#ffffff' } as React.CSSProperties}
        >
            {/* Immersive Hero Section */}
            <div className="relative h-[45vh] w-full overflow-hidden">
                {property.main_image_url ? (
                    <Image
                        src={property.main_image_url}
                        alt={property.name}
                        fill
                        className="object-cover scale-105"
                        priority
                    />
                ) : (
                    <div className="h-full w-full bg-slate-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-transparent to-black/20" />
                <div className="absolute inset-0 bg-black/5" />

                <div className="absolute bottom-12 left-6 right-6 max-w-xl mx-auto">
                    <Badge className="mb-4 uppercase py-1 px-3 tracking-[0.2em] bg-primary text-white border-none shadow-lg text-[10px] font-black">
                        Guest Experience
                    </Badge>
                    <h1 className="text-4xl font-extrabold text-white drop-shadow-2xl tracking-tight sm:text-5xl">
                        {property.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-4 text-white/95 font-semibold drop-shadow-md">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm sm:text-base">{property.location}</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <main className="max-w-xl mx-auto px-5 -mt-8 relative z-10 space-y-10">
                {property.description && (
                    <div className="p-8 rounded-[2.5rem] border border-white bg-white/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.03]">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Bienvenida</h2>
                        <p className="text-slate-600 text-[16px] leading-relaxed font-medium italic">
                            "{property.description}"
                        </p>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                            Guía del Alojamiento
                        </h2>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                    </div>

                    <div className="grid gap-6">
                        {sections.map((section) => (
                            <SectionRenderer key={section.id} section={section} />
                        ))}

                        <ManualsList manuals={manuals} />
                    </div>

                    {sections.length === 0 && (
                        <div className="py-24 text-center space-y-4 rounded-[3rem] border-2 border-dashed border-slate-200 bg-white/50">
                            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                                <Sparkles className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">Tu anfitrión está ultimando los detalles...</p>
                        </div>
                    )}
                </div>

                {/* AI Assistant Widget */}
                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10 group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="h-20 w-20" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black mb-1 flex items-center gap-3">
                            ¿Tienes dudas?
                            <Badge className="bg-primary text-white text-[9px] border-none font-black px-2 py-0">LIVE AI assistant</Badge>
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Pregúntame sobre el parking, cómo llegar o dónde cenar cerca de <span className="text-white font-bold">{property.name}</span>.
                        </p>
                        <Button
                            className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-2xl h-12 shadow-xl shadow-black/20 group-active:scale-95 transition-all"
                            asChild
                        >
                            {/* We can't easily open the floating chat from here without state management, 
                                so for now we'll just keep the floating button as the primary interaction 
                                or add a script to trigger it if needed. 
                                Actually, since this is a server component, we'll just let the floating button handle it.
                            */}
                            <div className="flex items-center justify-center gap-2 cursor-pointer">
                                Iniciar Asistente Virtual
                            </div>
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <footer className="pt-16 pb-8 text-center space-y-6">
                    <div className="flex items-center justify-center gap-8 text-slate-300">
                        <div className="h-px w-8 bg-current" />
                        <Sparkles className="h-4 w-4" />
                        <div className="h-px w-8 bg-current" />
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.5em] opacity-50">
                        Powered by GuideFlow Premium
                    </p>
                </footer>
            </main>

            {/* Floating Chat Component */}
            <GuestChat
                propertyId={property.id}
                propertyName={property.name}
            />

            {/* Floating Header (Glassmorphism) */}
            <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl px-4 py-2 rounded-full pointer-events-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 truncate max-w-[120px]">
                        {property.name}
                    </span>
                </div>
            </div>
        </div>
    )
}
