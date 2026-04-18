'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { ShieldAlert, Shield, Flame, HeartPulse, Pill, PawPrint, Car, Wrench, Sparkles, Loader2, Check, Home as HomeIcon, AlertTriangle, Phone, Trash2, Plus, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard } from '../../WizardContext'
import { useToast } from '@/hooks/use-toast'

export default function StepContacts({ value }: { value?: string }) {
    const {
        data,
        setData,
        aiLoading,
        handleAIFill,
        property
    } = useWizard()
    const { toast } = useToast()
    const [showEmergencies, setShowEmergencies] = React.useState(false)

    const handleSyncPhone = () => {
        setData({
            ...data,
            contacts: {
                ...data.contacts,
                host_phone: data.contacts.support_phone || data.contacts.host_phone,
                host_mobile: data.contacts.support_mobile || data.contacts.host_mobile
            }
        })
        toast({
            title: "Datos sincronizados",
            description: "Se han copiado los teléfonos del soporte oficial."
        })
    }

    const addEmergencyContact = () => {
        setData({
            ...data,
            contacts: {
                ...data.contacts,
                emergency_contacts: [
                    ...data.contacts.emergency_contacts,
                    { id: crypto.randomUUID(), name: '', phone: '', address: '', type: 'salud', distance: '' }
                ]
            }
        })
    }

    const removeEmergencyContact = (idx: number) => {
        const newContacts = [...data.contacts.emergency_contacts]
        newContacts.splice(idx, 1)
        setData({ ...data, contacts: { ...data.contacts, emergency_contacts: newContacts } })
    }

    const updateEmergencyContact = (idx: number, field: string, value: string) => {
        const newContacts = [...data.contacts.emergency_contacts]
        newContacts[idx] = { ...newContacts[idx], [field]: value }
        setData({ ...data, contacts: { ...data.contacts, emergency_contacts: newContacts } })
    }

    const addCustomContact = () => {
        setData({
            ...data,
            contacts: {
                ...data.contacts,
                custom_contacts: [
                    ...data.contacts.custom_contacts,
                    { id: crypto.randomUUID(), name: '', phone: '' }
                ]
            }
        })
    }

    const removeCustomContact = (idx: number) => {
        const newContacts = [...data.contacts.custom_contacts]
        newContacts.splice(idx, 1)
        setData({ ...data, contacts: { ...data.contacts, custom_contacts: newContacts } })
    }

    const updateCustomContact = (idx: number, field: string, value: string) => {
        const newContacts = [...data.contacts.custom_contacts]
        newContacts[idx] = { ...newContacts[idx], [field]: value }
        setData({ ...data, contacts: { ...data.contacts, custom_contacts: newContacts } })
    }

    return (
        <TabsContent value="contacts" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-3 sm:p-6 space-y-8">
                    
                    {/* BLOQUE 1: SOPORTE OFICIAL */}
                    <div className="space-y-4">
                        <div className="mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                    <ShieldAlert className="w-3 h-3 text-slate-400" /> Soporte Oficial
                                </h3>
                                {data.contacts.preferred_contact_id === 'support' ? (
                                    <div className="h-6 px-3 text-[8px] gap-1.5 rounded-full bg-green-500 text-white flex items-center font-black tracking-widest shadow-sm">
                                        <Check className="w-3 h-3" /> PREFERENTE
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-3 text-[8px] gap-1.5 rounded-full border-slate-200 text-slate-500 hover:bg-[#316263] hover:text-white hover:border-[#316263] transition-all font-bold group"
                                        onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'support' } })}
                                    >
                                        <Check className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" /> ESTABLECER COMO PRINCIPAL
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Nombre (Soporte)</Label>
                                <Input
                                    placeholder="Ej: Atención al Cliente"
                                    value={data.contacts.support_name}
                                    onChange={e => setData({ ...data, contacts: { ...data.contacts, support_name: e.target.value } })}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Teléfono Fijo</Label>
                                <Input
                                    placeholder="Ej: 912 34 56 78"
                                    value={data.contacts.support_phone}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev: any) => ({
                                            ...prev,
                                            contacts: { ...prev.contacts, support_phone: val },
                                            checkin: { ...prev.checkin, emergency_phone: val }
                                        }));
                                    }}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Teléfono Móvil (WhatsApp)</Label>
                                <Input
                                    placeholder="Ej: 666 12 34 56"
                                    value={data.contacts.support_mobile}
                                    onChange={(e) => setData((prev: any) => ({
                                        ...prev,
                                        contacts: { ...prev.contacts, support_mobile: e.target.value }
                                    }))}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BLOQUE 2: CONTACTO DEL ANFITRIÓN */}
                    <div className="space-y-4 border-t pt-6">
                        <div className="mb-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-slate-400" /> Tu Contacto (Anfitrión)
                                </h3>
                                {data.contacts.preferred_contact_id === 'host' ? (
                                    <div className="h-6 px-3 text-[8px] gap-1.5 rounded-full bg-green-500 text-white flex items-center font-black tracking-widest shadow-sm">
                                        <Check className="w-3 h-3" /> PREFERENTE
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-3 text-[8px] gap-1.5 rounded-full border-slate-200 text-slate-500 hover:bg-[#316263] hover:text-white hover:border-[#316263] transition-all font-bold group"
                                        onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'host' } })}
                                    >
                                        <Check className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" /> ESTABLECER COMO PRINCIPAL
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider text-[#316263] hover:bg-[#316263]/10 rounded-lg gap-2"
                                    onClick={handleSyncPhone}
                                >
                                    <RefreshCw className="w-3 h-3" /> Sincronizar teléfonos de soporte
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Nombre</Label>
                                <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-3 h-12">
                                    <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-[#316263] shadow-sm shrink-0">
                                        <HomeIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-sm font-bold text-slate-900 truncate">{data.welcome?.host_name || 'No definido'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Teléfono Principal</Label>
                                <Input
                                    placeholder="Ej: 912 34 56 78"
                                    value={data.contacts.host_phone}
                                    onChange={(e) => setData((prev: any) => ({
                                        ...prev,
                                        contacts: { ...prev.contacts, host_phone: e.target.value }
                                    }))}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Teléfono Móvil</Label>
                                <Input
                                    placeholder="Ej: 666 12 34 56"
                                    value={data.contacts.host_mobile}
                                    onChange={(e) => setData((prev: any) => ({
                                        ...prev,
                                        contacts: { ...prev.contacts, host_mobile: e.target.value }
                                    }))}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BLOQUE 3: ZONA DE ACCIÓN - IA (AUTOCOMPLETAR) */}
                    <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100/50 gap-4 mt-8">
                        <div className="text-center space-y-1.5 px-6">
                            <div className="flex items-center justify-center gap-2 text-[#316263]">
                                <Sparkles className="w-4 h-4" />
                                <h4 className="text-xs font-black uppercase tracking-[0.2em]">Asistente de Contactos IA</h4>
                            </div>
                            <p className="text-[10px] text-slate-400 max-w-[320px] leading-relaxed mx-auto italic">
                                Pulsa para completar automáticamente hospitales, farmacias, taxis y emergencias locales basados en tu ubicación.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-10 text-[10px] font-black uppercase tracking-widest border-[#316263]/20 text-[#316263] hover:bg-[#316263] hover:text-white rounded-xl shadow-md transition-all gap-2"
                            onClick={() => handleAIFill('contacts')}
                            disabled={aiLoading === 'contacts' || (!data.access.full_address && !property?.full_address)}
                        >
                            {aiLoading === 'contacts' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                            )}
                            {aiLoading === 'contacts' ? 'Generando...' : 'Autocompletar Contactos'}
                        </Button>
                    </div>

                    {/* BLOQUE 4: EMERGENCIAS GENERALES (COLAPSABLE) */}
                    <div className="space-y-6 border-t pt-6">
                        <div 
                            className="flex items-center justify-between cursor-pointer group select-none"
                            onClick={() => setShowEmergencies(!showEmergencies)}
                        >
                            <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-rose-400" /> Emergencias Generales
                                <span className="text-[9px] font-medium text-slate-300 normal-case ml-2">
                                    (112, Policía, Bomberos...)
                                </span>
                            </h3>
                            <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-100 transition-colors">
                                {showEmergencies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                        </div>

                        {showEmergencies && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {data.contacts.emergency_contacts
                                    .filter((c: any) => !['salud', 'farmacia', 'taxi', 'veterinario'].includes(c.type))
                                    .map((contact: any) => (
                                    <div key={contact.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 group transition-all hover:bg-white hover:shadow-md">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                                {contact.type === 'policia' && <Shield className="w-5 h-5" />}
                                                {contact.type === 'guardia' && <ShieldAlert className="w-5 h-5" />}
                                                {contact.type === 'bomberos' && <Flame className="w-5 h-5" />}
                                                {contact.type === 'telefono' && <Phone className="w-5 h-5" />}
                                                {(!contact.type || !['policia', 'guardia', 'bomberos', 'telefono'].includes(contact.type)) && <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergencia Local</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="lg:opacity-0 lg:group-hover:opacity-100 text-slate-300 hover:text-destructive h-8"
                                                onClick={() => removeEmergencyContact(data.contacts.emergency_contacts.indexOf(contact))}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-3 text-left">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Nombre del servicio"
                                                    className="font-bold border-slate-100 bg-white h-9 rounded-lg"
                                                    value={contact.name ?? ''}
                                                    onChange={e => updateEmergencyContact(data.contacts.emergency_contacts.indexOf(contact), 'name', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Teléfono"
                                                    className="border-slate-100 bg-white h-9 rounded-lg"
                                                    value={contact.phone ?? ''}
                                                    onChange={e => updateEmergencyContact(data.contacts.emergency_contacts.indexOf(contact), 'phone', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    className="w-full h-10 border-dashed border-2 rounded-xl text-xs text-slate-500 hover:bg-slate-50 transition-all"
                                    onClick={addEmergencyContact}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Añadir Emergencia Manual
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* BLOQUE 5: SALUD Y SERVICIOS (SIEMPRE VISIBLES) */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <HeartPulse className="w-3 h-3 text-[#316263]" /> Salud y Servicios de Cercanía
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {data.contacts.emergency_contacts
                                .filter((c: any) => ['salud', 'farmacia', 'taxi', 'veterinario'].includes(c.type))
                                .map((contact: any) => (
                                    <div key={contact.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 group transition-all hover:bg-white hover:shadow-md">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                                contact.type === 'salud' ? "bg-rose-50 text-rose-500" :
                                                contact.type === 'farmacia' ? "bg-emerald-50 text-emerald-500" :
                                                contact.type === 'taxi' ? "bg-amber-50 text-amber-500" :
                                                "bg-blue-50 text-blue-500"
                                            )}>
                                                {contact.type === 'salud' && <HeartPulse className="w-5 h-5" />}
                                                {contact.type === 'farmacia' && <Pill className="w-5 h-5" />}
                                                {contact.type === 'taxi' && <Car className="w-5 h-5" />}
                                                {contact.type === 'veterinario' && <PawPrint className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                                    {contact.type === 'salud' ? 'Hospital / Salud' : 
                                                     contact.type === 'farmacia' ? 'Farmacia' : 
                                                     contact.type === 'taxi' ? 'Taxi' : 'Clínica Veterinaria'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="lg:opacity-0 lg:group-hover:opacity-100 text-slate-300 hover:text-destructive transition-opacity shrink-0 h-8"
                                                onClick={() => removeEmergencyContact(data.contacts.emergency_contacts.indexOf(contact))}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-3 text-left">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Nombre del establecimiento"
                                                    className="font-bold border-slate-100 bg-white h-9 rounded-lg"
                                                    value={contact.name ?? ''}
                                                    onChange={e => updateEmergencyContact(data.contacts.emergency_contacts.indexOf(contact), 'name', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Teléfono"
                                                    className="border-slate-100 bg-white h-9 rounded-lg"
                                                    value={contact.phone ?? ''}
                                                    onChange={e => updateEmergencyContact(data.contacts.emergency_contacts.indexOf(contact), 'phone', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="col-span-2 md:col-span-3">
                                                    <div className="relative">
                                                        <Input
                                                            placeholder="Dirección exacta"
                                                            className={cn("border-slate-100 bg-white h-9 rounded-lg px-3 text-xs w-full", contact.place_id && "pr-8 border-[#316263]/40 bg-[#316263]/5")}
                                                            value={contact.address || ''}
                                                            onChange={e => updateEmergencyContact(data.contacts.emergency_contacts.indexOf(contact), 'address', e.target.value)}
                                                        />
                                                        {contact.place_id && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-md p-1 shadow-sm border border-slate-100">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#316263]">
                                                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Input
                                                    placeholder="Dist."
                                                    className="border-slate-100 bg-white h-9 rounded-lg px-3 text-xs"
                                                    value={contact.distance || ''}
                                                    onChange={e => updateEmergencyContact(data.contacts.emergency_contacts.indexOf(contact), 'distance', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* BLOQUE 6: OTROS CONTACTOS (MANUALES) */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Contactos del Guía (Otros)
                        </h3>
                        <div className="space-y-3">
                            {data.contacts.custom_contacts.map((contact: any, idx: number) => (
                                <div key={contact.id || idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center gap-4 group transition-all hover:bg-white hover:shadow-md">
                                    <button
                                        onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: contact.id } })}
                                        className={cn(
                                            "h-10 w-10 rounded-xl flex flex-col items-center justify-center transition-all shrink-0",
                                            data.contacts.preferred_contact_id === contact.id
                                                ? "bg-green-500 text-white shadow-lg scale-105"
                                                : "bg-slate-50 text-slate-300 hover:bg-slate-100 border border-slate-100"
                                        )}
                                    >
                                        <Check className={cn("w-5 h-5", data.contacts.preferred_contact_id === contact.id ? "opacity-100" : "opacity-20")} />
                                        {data.contacts.preferred_contact_id === contact.id && (
                                            <span className="text-[6px] font-black uppercase mt-0.5 tracking-tighter">PRIN</span>
                                        )}
                                    </button>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                                        <Input
                                            placeholder="Nombre (ej: Radio Taxi Local)"
                                            className="font-bold border-slate-100 bg-white h-9 rounded-lg"
                                            value={contact.name ?? ''}
                                            onChange={e => updateCustomContact(idx, 'name', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Teléfono"
                                            className="border-slate-100 bg-white h-9 rounded-lg"
                                            value={contact.phone ?? ''}
                                            onChange={e => updateCustomContact(idx, 'phone', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="lg:opacity-0 lg:group-hover:opacity-100 text-slate-300 hover:text-destructive h-8 transition-opacity"
                                        onClick={() => removeCustomContact(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                className="w-full h-10 border-dashed border-2 rounded-xl text-xs text-slate-500 hover:bg-slate-50 transition-all font-medium"
                                onClick={addCustomContact}
                            >
                                <Plus className="w-3 h-3 mr-2" /> Añadir Contacto Adicional
                                </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
