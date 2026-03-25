'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { ShieldAlert, Shield, Flame, HeartPulse, Pill, PawPrint, Car, Wrench, Sparkles, Loader2, Check, Home as HomeIcon, AlertTriangle, Phone, Trash2, Plus } from 'lucide-react'
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
        <TabsContent value="contacts" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-3 sm:p-6 space-y-8">
                    {/* Contacto de Soporte */}
                    <div className="space-y-4">
                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <ShieldAlert className="w-3 h-3" /> Soporte Oficial
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-3 text-[9px] gap-1.5 rounded-full transition-all",
                                        data.contacts.preferred_contact_id === 'support'
                                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    )}
                                    onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'support' } })}
                                >
                                    <Check className={cn("w-3 h-3", data.contacts.preferred_contact_id === 'support' ? "opacity-100" : "opacity-0")} />
                                    {data.contacts.preferred_contact_id === 'support' ? 'PREFERENTE' : 'MARCAR PREFERENTE'}
                                </Button>
                            </div>
                            <div className="mt-2 text-left">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[9px] font-bold uppercase tracking-wider border-[#316263]/20 text-[#316263] hover:bg-[#316263]/5 rounded-lg"
                                    onClick={() => handleAIFill('contacts')}
                                    disabled={aiLoading === 'contacts' || (!data.access.full_address && !property?.full_address)}
                                >
                                    {aiLoading === 'contacts' ? (
                                        <Loader2 className="w-2.5 h-2.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-2.5 h-2.5 mr-1.5" />
                                    )}
                                    {aiLoading === 'contacts' ? 'Generando...' : 'Autocompletar'}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 text-left">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre (Soporte)</Label>
                                <Input
                                    placeholder="Ej: Atención al Cliente"
                                    value={data.contacts.support_name}
                                    onChange={e => setData({ ...data, contacts: { ...data.contacts, support_name: e.target.value } })}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="support_phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono Fijo</Label>
                                <Input
                                    id="support_phone"
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
                                <Label htmlFor="support_mobile" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono Móvil (WhatsApp)</Label>
                                <Input
                                    id="support_mobile"
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

                    {/* Contacto del Anfitrión */}
                    <div className="space-y-4 border-t pt-6">
                        <div className="mb-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Tu Contacto (Anfitrión)
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-3 text-[9px] gap-1.5 rounded-full transition-all",
                                        data.contacts.preferred_contact_id === 'host'
                                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    )}
                                    onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'host' } })}
                                >
                                    <Check className={cn("w-3 h-3", data.contacts.preferred_contact_id === 'host' ? "opacity-100" : "opacity-0")} />
                                    {data.contacts.preferred_contact_id === 'host' ? 'PREFERENTE' : 'MARCAR PREFERENTE'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] h-7 px-3 text-primary hover:text-primary/80 bg-slate-100 hover:bg-slate-200 rounded-full"
                                    onClick={handleSyncPhone}
                                >
                                    Sincronizar Teléfono
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 text-left">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre</Label>
                                <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center gap-3 h-12">
                                    <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-[#316263] shadow-sm shrink-0">
                                        <HomeIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{data.welcome?.host_name || 'No definido'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="host_phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono Principal</Label>
                                <Input
                                    id="host_phone"
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
                                <Label htmlFor="host_mobile" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono Móvil</Label>
                                <Input
                                    id="host_mobile"
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

                    {/* Emergencias IA */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Emergencias Locales
                        </h3>

                        <div className="space-y-3">
                            {data.contacts.emergency_contacts.map((contact: any, idx: number) => (
                                <div key={contact.id || idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 group transition-all hover:bg-white hover:shadow-md">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                            {contact.type === 'policia' && <Shield className="w-5 h-5" />}
                                            {contact.type === 'guardia' && <ShieldAlert className="w-5 h-5" />}
                                            {contact.type === 'bomberos' && <Flame className="w-5 h-5" />}
                                            {contact.type === 'salud' && <HeartPulse className="w-5 h-5" />}
                                            {contact.type === 'farmacia' && <Pill className="w-5 h-5" />}
                                            {contact.type === 'veterinario' && <PawPrint className="w-5 h-5" />}
                                            {contact.type === 'taxi' && <Car className="w-5 h-5" />}
                                            {contact.type === 'mantenimiento' && <Wrench className="w-5 h-5" />}
                                            {contact.type === 'telefono' && <Phone className="w-5 h-5" />}
                                            {(!contact.type || !['policia', 'guardia', 'bomberos', 'salud', 'farmacia', 'veterinario', 'taxi', 'mantenimiento', 'telefono'].includes(contact.type)) && <AlertTriangle className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="lg:opacity-0 lg:group-hover:opacity-100 text-slate-300 hover:text-destructive transition-opacity shrink-0"
                                            onClick={() => removeEmergencyContact(idx)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-3 text-left">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input
                                                placeholder="Nombre del servicio"
                                                className="font-bold border-slate-100 bg-white h-9 rounded-lg px-3"
                                                value={contact.name ?? ''}
                                                onChange={e => updateEmergencyContact(idx, 'name', e.target.value)}
                                            />
                                            <Input
                                                placeholder="Teléfono (ej: +34...)"
                                                className="border-slate-100 bg-white h-9 rounded-lg px-3"
                                                value={contact.phone ?? ''}
                                                onChange={e => updateEmergencyContact(idx, 'phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="col-span-2 md:col-span-3">
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Dirección exacta"
                                                        className={cn("border-slate-100 bg-white h-9 rounded-lg px-3 text-xs w-full", contact.place_id && "pr-8 border-[#316263]/40 bg-[#316263]/5")}
                                                        value={contact.address || ''}
                                                        onChange={e => updateEmergencyContact(idx, 'address', e.target.value)}
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
                                                onChange={e => updateEmergencyContact(idx, 'distance', e.target.value)}
                                            />
                                        </div>
                                    </div>
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
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Otros Contactos
                        </h3>
                        <div className="space-y-3">
                            {data.contacts.custom_contacts.map((contact: any, idx: number) => (
                                <div key={contact.id || idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center gap-4 group transition-all hover:bg-white hover:shadow-md">
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
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                                        <Input
                                            placeholder="Etiqueta (ej: Radio Taxi)"
                                            className="font-bold border-slate-100 bg-white h-9 rounded-lg px-3"
                                            value={contact.name ?? ''}
                                            onChange={e => updateCustomContact(idx, 'name', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Teléfono"
                                            className="border-slate-100 bg-white h-9 rounded-lg px-3"
                                            value={contact.phone ?? ''}
                                            onChange={e => updateCustomContact(idx, 'phone', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="lg:opacity-0 lg:group-hover:opacity-100 text-slate-300 hover:text-destructive transition-opacity"
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
