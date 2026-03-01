import { getGuestChats } from '@/app/actions/analytics'
import { getProperties } from '@/app/actions/properties'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Calendar, User, Bot, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ propertyId?: string }> }) {
    const { propertyId } = await searchParams

    const chats = await getGuestChats(propertyId)

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                        Historial de Conversaciones
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Revisa qué están preguntando tus huéspedes al asistente virtual
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {chats.map(chat => {
                    const messageCount = chat.messages?.length || 0;
                    if (messageCount === 0) return null;

                    return (
                        <Card key={chat.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-primary" />
                                            Sesión {chat.guest_session_id.substring(0, 8)}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {format(new Date(chat.created_at), "d MMM, HH:mm", { locale: es })}
                                            </span>
                                            <span className="flex items-center gap-1 font-medium text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full">
                                                {(chat.properties as any)?.name || 'Propiedad desconocida'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true, locale: es })}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {Math.ceil(messageCount / 2)} interacciones
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto bg-stone-50/30">
                                    {chat.messages.map((msg: any, i: number) => (
                                        <div key={i} className={`p-4 flex gap-4 ${msg.role === 'user' ? 'bg-white' : ''}`}>
                                            <div className="shrink-0 mt-1">
                                                {msg.role === 'user' ? (
                                                    <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                                        <Bot className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        {msg.role === 'user' ? 'Huésped' : 'Asistente'}
                                                    </span>
                                                    {msg.timestamp && (
                                                        <span className="text-[10px] text-muted-foreground/60">
                                                            {format(new Date(msg.timestamp), "HH:mm")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {chats.length === 0 && (
                    <Card className="p-12 text-center border-dashed">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold">No hay conversaciones aún</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                            Cuando los huéspedes utilicen el HostBot en tus guías, sus interacciones aparecerán aquí para ayudarte a mejorar tus manuales.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    )
}
