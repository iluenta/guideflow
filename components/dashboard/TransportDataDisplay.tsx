import { Plane, Train, Car, Bus, MapPin, Clock, Euro, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TransportData {
    from_airport?: { instructions: string; duration: string; price_range: string }
    from_train?: { instructions: string; duration: string; price_range: string }
    parking?: { info: string; price: string; distance: string }
    nearby_transport?: Array<{ type: string; name: string; distance: string }>
}

export function TransportDataDisplay({ data }: { data: TransportData }) {
    if (!data?.from_airport && !data?.from_train && !data?.parking && (!data?.nearby_transport || data?.nearby_transport?.length === 0)) {
        return null
    }

    return (
        <div className="space-y-4 pt-4 border-t border-slate-100 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1">
                    <Sparkles className="w-3 h-3" /> Información Generada por IA
                </Badge>
                <p className="text-[10px] text-muted-foreground italic">
                    Basado en la ubicación del alojamiento
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aeropuerto */}
                {data.from_airport && (
                    <Card className="border-none shadow-sm bg-slate-50/50">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Plane className="w-4 h-4" />
                                <span className="text-sm">Desde el Aeropuerto</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                "{data.from_airport.instructions}"
                            </p>
                            <div className="flex gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Clock className="w-3 h-3" /> {data.from_airport.duration}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Euro className="w-3 h-3" /> {data.from_airport.price_range}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tren */}
                {data.from_train && (
                    <Card className="border-none shadow-sm bg-slate-50/50">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Train className="w-4 h-4" />
                                <span className="text-sm">Desde la Estación</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                "{data.from_train.instructions}"
                            </p>
                            <div className="flex gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Clock className="w-3 h-3" /> {data.from_train.duration}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Euro className="w-3 h-3" /> {data.from_train.price_range}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Parking */}
                {data.parking && (
                    <Card className="border-none shadow-sm bg-slate-50/50">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Car className="w-4 h-4" />
                                <span className="text-sm">Aparcamiento</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {data.parking.info}
                            </p>
                            <div className="flex gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <MapPin className="w-3 h-3" /> {data.parking.distance}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <Euro className="w-3 h-3" /> {data.parking.price}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Transporte Cercano */}
                {data.nearby_transport && data.nearby_transport.length > 0 && (
                    <Card className="border-none shadow-sm bg-slate-50/50">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Bus className="w-4 h-4" />
                                <span className="text-sm">Transporte Cercano</span>
                            </div>
                            <div className="space-y-2">
                                {data.nearby_transport.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[10px] font-medium">{item.type}: {item.name}</span>
                                        <span className="text-[9px] text-muted-foreground">{item.distance}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
