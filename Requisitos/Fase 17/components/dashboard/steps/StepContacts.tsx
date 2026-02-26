'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Phone, Sparkles, Headphones, CheckCircle, User, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepContactsProps {
    data: any
    onChange: (data: any) => void
}

export function StepContacts({ data, onChange }: StepContactsProps) {
    const contacts = data.custom_contacts || []

    const emergencies = [
        { name: '112 - Emergencia Europea', phone: '112', code: '112' },
        { name: 'Policía Nacional', phone: '091', code: '091' },
        { name: 'Bomberos', phone: '080', code: '080' },
        { name: 'Samur / Urgencias Médicas', phone: '092', code: '092' }
    ]

    const addContact = () => {
        onChange({ custom_contacts: [...contacts, { name: '', phone: '' }] })
    }

    const removeContact = (index: number) => {
        onChange({ custom_contacts: contacts.filter((_: any, i: number) => i !== index) })
    }

    const updateContact = (index: number, field: string, value: string) => {
        const newContacts = [...contacts]
        newContacts[index] = { ...newContacts[index], [field]: value }
        onChange({ custom_contacts: newContacts })
    }

    const handleAutocompleteEmergencies = () => {
        // En un escenario real, esto podría usar geolocalización o la dirección de la propiedad
        // Por ahora, añadimos servicios locales comunes a la lista de contactos personalizados
        const localServices = [
            { name: 'Radio Taxi Local', phone: '+34 912 345 678' },
            { name: 'Centro de Salud Cercano', phone: '+34 915 620 420' }
        ]
        
        const newContacts = [...contacts]
        localServices.forEach(service => {
            if (!newContacts.find(c => c.name === service.name)) {
                newContacts.push(service)
            }
        })
        
        onChange({ custom_contacts: newContacts })
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 relative">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-serif text-text-primary">Contactos y Emergencias</CardTitle>
                        <CardDescription className="text-base text-slate-500">Personas de contacto durante la estancia y servicios de emergencia.</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAutocompleteEmergencies}
                        className="hidden md:flex bg-slate-50 border-slate-200 text-[10px] font-bold tracking-widest uppercase h-9 rounded-xl px-4 hover:bg-white hover:text-primary transition-all group"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-primary group-hover:animate-pulse" />
                        Autocompletar Emergencias
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="px-0 space-y-10 mt-8">
                {/* Official Support */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Headphones className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">SOPORTE OFICIAL</h3>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-emerald-100 shadow-sm">
                            <CheckCircle className="w-3 h-3" />
                            CONTACTO PREFERENTE
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1">Nombre (Ej: GuideFlow Support)</Label>
                            <Input 
                                value={data.support_name || 'GuideFlow Support'} 
                                onChange={(e) => onChange({ support_name: e.target.value })}
                                className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1">Teléfono Principal</Label>
                            <div className="relative">
                                <Input 
                                    value={data.support_phone || ''} 
                                    onChange={(e) => onChange({ support_phone: e.target.value })}
                                    placeholder="+34 000 000 000"
                                    className="h-14 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                                />
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1">WhatsApp</Label>
                            <div className="relative">
                                <Input 
                                    value={data.support_whatsapp || ''} 
                                    onChange={(e) => onChange({ support_whatsapp: e.target.value })}
                                    placeholder="+34 600 000 000"
                                    className="h-14 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-emerald-500 rounded-lg text-white font-bold text-[8px]">W</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Host Contact */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <User className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">TU CONTACTO (ANFITRIÓN)</h3>
                        </div>
                        <button className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors hover:underline">
                            Sincronizar Teléfono
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-14 rounded-2xl bg-slate-50 border border-slate-100 px-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{data.host_name || 'Anfitrión'}</span>
                        </div>
                        <div className="relative">
                            <Input 
                                value={data.host_phone || ''} 
                                onChange={(e) => onChange({ host_phone: e.target.value })}
                                placeholder="Teléfono Llamadas"
                                className="h-14 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                            />
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <div className="relative">
                            <Input 
                                value={data.host_whatsapp || ''} 
                                onChange={(e) => onChange({ host_whatsapp: e.target.value })}
                                placeholder="Teléfono WhatsApp"
                                className="h-14 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-emerald-500 rounded-lg text-white font-bold text-[8px]">W</div>
                        </div>
                    </div>
                </div>

                {/* Local Emergencies */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center text-[8px] font-black">!</div>
                        <h3 className="text-xs font-bold uppercase tracking-widest">EMERGENCIAS LOCALES</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {emergencies.map((item, i) => (
                            <div key={i} className="group p-5 rounded-3xl border border-slate-100 bg-white hover:border-red-100 hover:bg-red-50/10 transition-all duration-300 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                                            <Phone className="w-5 h-5 text-red-500 group-hover:text-white" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.phone}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500 group-hover:bg-white transition-colors">
                                        {item.code}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-8 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center px-3 text-[10px] text-slate-400 italic">
                                        Dirección exacta para navegación
                                    </div>
                                    <div className="w-20 h-8 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                                        5 min
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Other Contacts */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Plus className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">OTROS CONTACTOS</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {contacts.map((contact: any, index: number) => (
                            <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre / Servicio</Label>
                                    <Input 
                                        value={contact.name} 
                                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                                        placeholder="Ej: Taxi Madrid"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</Label>
                                    <Input 
                                        value={contact.phone} 
                                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                        placeholder="+34..."
                                        className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white"
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeContact(index)} 
                                    className="h-12 w-12 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                        <Button 
                            variant="outline" 
                            onClick={addContact} 
                            className="w-full h-14 gap-3 bg-white border-slate-200 border-dashed rounded-2xl text-slate-400 font-bold hover:text-primary hover:border-primary/50 transition-all"
                        >
                            <Plus className="h-4 w-4" /> 
                            Añadir Contacto Adicional
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
