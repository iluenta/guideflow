'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { ShieldAlert, Shield, Flame, HeartPulse, Pill, PawPrint, Car, Wrench, Sparkles, Loader2, Check, Home as HomeIcon, AlertTriangle, Phone, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard } from '../WizardContext'
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
            title: "Teléfonos sincronizados",
            description: "Se han copiado los números del soporte al anfitrión."
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
        <TabsContent value="contacts" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-base">Contactos y Emergencias</CardTitle>
                            <CardDescription className="text-xs">Personas de contacto durante la estancia y servicios de emergencia.</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-bold uppercase tracking-wider border-navy/20 text-navy hover:bg-navy/5"
                            onClick={() => handleAIFill('contacts')}
                            disabled={aiLoading === 'contacts' || (!data.access.full_address && !property?.full_address)}
                        >
                            {aiLoading === 'contacts' ? (
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="w-3 h-3 mr-2" />
                            )}
                            {aiLoading === 'contacts' ? 'Generando...' : 'Autocompletar Emergencias'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                    {/* Contacto de Soporte */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-3 h-3" /> Soporte Oficial
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-7 px-3 text-[10px] gap-1.5 rounded-full transition-all",
                                    data.contacts.preferred_contact_id === 'support'
                                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                )}
                                onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'support' } })}
                            >
                                <Check className={cn("w-3 h-3", data.contacts.preferred_contact_id === 'support' ? "opacity-100" : "opacity-0")} />
                                {data.contacts.preferred_contact_id === 'support' ? 'CONTACTO PREFERENTE' : 'MARCAR COMO PREFERENTE'}
                            </Button>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Nombre (Ej: Soporte GuideFlow)</Label>
                                <Input
                                    placeholder="Ej: Atención al Cliente"
                                    value={data.contacts.support_name}
                                    onChange={e => setData({ ...data, contacts: { ...data.contacts, support_name: e.target.value } })}
                                    className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="support_phone" className="text-xs font-bold text-navy/60">Teléfono Principal (Llamadas)</Label>
                                <Input
                                    id="support_phone"
                                    placeholder="Ej: 912345678"
                                    value={data.contacts.support_phone}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev: any) => ({
                                            ...prev,
                                            contacts: { ...prev.contacts, support_phone: val },
                                            checkin: { ...prev.checkin, emergency_phone: val }
                                        }));
                                    }}
                                    className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="support_mobile" className="text-xs font-bold text-navy/60">Teléfono Móvil (WhatsApp)</Label>
                                <Input
                                    id="support_mobile"
                                    placeholder="Ej: 666123456"
                                    value={data.contacts.support_mobile}
                                    onChange={(e) => setData((prev: any) => ({
                                        ...prev,
                                        contacts: { ...prev.contacts, support_mobile: e.target.value }
                                    }))}
                                    className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacto del Anfitrión */}
                    <div className="space-y-4 border-t pt-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center gap-2 flex-1">
                                <Sparkles className="w-3 h-3" /> Tu Contacto (Anfitrión)
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-3 text-[10px] gap-1.5 rounded-full transition-all ml-4",
                                        data.contacts.preferred_contact_id === 'host'
                                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    )}
                                    onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'host' } })}
                                >
                                    <Check className={cn("w-3 h-3", data.contacts.preferred_contact_id === 'host' ? "opacity-100" : "opacity-0")} />
                                    {data.contacts.preferred_contact_id === 'host' ? 'CONTACTO PREFERENTE' : 'MARCAR COMO PREFERENTE'}
                                </Button>
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 px-2 text-primary hover:text-primary/80"
                                onClick={handleSyncPhone}
                            >
                                Sincronizar Teléfono
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Nombre</Label>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 h-12">
                                    <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-navy shadow-sm shrink-0">
                                        <HomeIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-navy truncate">{data.welcome?.host_name || 'No definido'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="host_phone" className="text-xs font-bold text-navy/60">Teléfono Principal (Llamadas)</Label>
                                <Input
                                    id="host_phone"
                                    placeholder="Ej: 912345678"
                                    value={data.contacts.host_phone}
                                    onChange={(e) => setData((prev: any) => ({
                                        ...prev,
                                        contacts: { ...prev.contacts, host_phone: e.target.value }
                                    }))}
                                    className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="host_mobile" className="text-xs font-bold text-navy/60">Teléfono Móvil (WhatsApp)</Label>
                                <Input
                                    id="host_mobile"
                                    placeholder="Ej: 666123456"
                                    value={data.contacts.host_mobile}
                                    onChange={(e) => setData((prev: any) => ({
                                        ...prev,
                                        contacts: { ...prev.contacts, host_mobile: e.target.value }
                                    }))}
                                    className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Emergencias IA */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Emergencias Locales
                        </h3>

                        <div className="space-y-3">
                            {data.contacts.emergency_contacts.map((contact: any, idx: number) => (
                                <div key={contact.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                        {contact.type === 'policia'    && <Shield className="w-5 h-5" />}
                                        {contact.type === 'guardia'    && <ShieldAlert className="w-5 h-5" />}
                                        {contact.type === 'bomberos'   && <Flame className="w-5 h-5" />}
                                        {contact.type === 'salud'      && <HeartPulse className="w-5 h-5" />}
                                        {contact.type === 'farmacia'   && <Pill className="w-5 h-5" />}
                                        {contact.type === 'veterinario'&& <PawPrint className="w-5 h-5" />}
                                        {contact.type === 'taxi'       && <Car className="w-5 h-5" />}
                                        {contact.type === 'mantenimiento' && <Wrench className="w-5 h-5" />}
                                        {contact.type === 'telefono'   && <Phone className="w-5 h-5" />}
                                        {(!contact.type || !['policia','guardia','bomberos','salud','farmacia','veterinario','taxi','mantenimiento','telefono'].includes(contact.type)) && <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input
                                                placeholder="Nombre del servicio"
                                                className="font-bold border-none bg-slate-50 h-9"
                                                value={contact.name ?? ''}
                                                onChange={e => updateEmergencyContact(idx, 'name', e.target.value)}
                                            />
                                            <Input
                                                placeholder="Teléfono (ej: +34...)"
                                                className="border-none bg-slate-50 h-9"
                                                value={contact.phone ?? ''}
                                                onChange={e => updateEmergencyContact(idx, 'phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <div className="md:col-span-3">
                                                <Input
                                                    placeholder="Dirección exacta para navegación"
                                                    className="border-none bg-slate-50 h-9 text-xs"
                                                    value={contact.address || ''}
                                                    onChange={e => updateEmergencyContact(idx, 'address', e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Distancia (ej: 5 min)"
                                                className="border-none bg-slate-50 h-9 text-xs"
                                                value={contact.distance || ''}
                                                onChange={e => updateEmergencyContact(idx, 'distance', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-destructive transition-opacity"
                                        onClick={() => removeEmergencyContact(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                className="w-full h-10 border-dashed border-2 rounded-xl text-xs text-slate-500"
                                onClick={addEmergencyContact}
                            >
                                <Plus className="w-3 h-3 mr-2" /> Añadir Emergencia
                            </Button>
                        </div>
                    </div>

                    {/* Otros Contactos */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Otros Contactos (Taxi, Mantenimiento...)
                        </h3>
                        <div className="space-y-3">
                            {data.contacts.custom_contacts.map((contact: any, idx: number) => (
                                <div key={contact.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-4 group">
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: contact.id } })}
                                            className={cn(
                                                "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                                data.contacts.preferred_contact_id === contact.id
                                                    ? "bg-green-500 text-white shadow-lg scale-110"
                                                    : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                                            )}
                                            title="Marcar como contacto preferente"
                                        >
                                            <Check className={cn("w-5 h-5", data.contacts.preferred_contact_id === contact.id ? "opacity-100" : "opacity-20")} />
                                        </button>
                                        {data.contacts.preferred_contact_id === contact.id && (
                                            <span className="text-[7px] font-black text-green-600 uppercase tracking-tighter">PREFERENTE</span>
                                        )}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Etiqueta (ej: Radio Taxi)"
                                            className="font-bold border-none bg-slate-50/50 h-9"
                                            value={contact.name ?? ''}
                                            onChange={e => updateCustomContact(idx, 'name', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Teléfono"
                                            className="border-none bg-slate-50/50 h-9"
                                            value={contact.phone ?? ''}
                                            onChange={e => updateCustomContact(idx, 'phone', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-destructive transition-opacity"
                                        onClick={() => removeCustomContact(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                className="w-full h-10 border-dashed border-2 rounded-xl text-xs text-slate-500"
                                onClick={addCustomContact}
                            >
                                <Plus className="w-3 h-3 mr-2" /> Añadir Contacto
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
