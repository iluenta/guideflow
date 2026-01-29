'use client'

import { GuideSection } from '@/app/actions/properties'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, Key, MapPin, Info, Image as ImageIcon, MessageSquare, Video } from 'lucide-react'
import Image from 'next/image'

interface SectionRendererProps {
    section: GuideSection
}

export function SectionRenderer({ section }: SectionRendererProps) {
    const { content_type, title, data } = section

    const icons = {
        text: Info,
        image: ImageIcon,
        video: Video,
        map: MapPin,
        ai_chat: MessageSquare,
    }

    const Icon = icons[content_type as keyof typeof icons] || Info

    return (
        <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-md hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                {content_type === 'text' && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {data.text}
                    </p>
                )}

                {content_type === 'image' && data.url && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50">
                        <Image
                            src={data.url}
                            alt={title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {content_type === 'map' && data.address && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {data.address}
                        </p>
                        <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border">
                            Mapa Interactivo (Integrar Google/Mapbox)
                        </div>
                        {data.link && (
                            <a
                                href={data.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-xs font-semibold text-primary hover:underline"
                            >
                                Abrir en Google Maps
                            </a>
                        )}
                    </div>
                )}

                {content_type === 'ai_chat' && (
                    <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                        <p className="text-xs text-primary font-medium mb-1">💡 Sugerencia:</p>
                        <p className="text-sm text-muted-foreground">
                            Puedes preguntarme cualquier cosa sobre "{title}".
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
