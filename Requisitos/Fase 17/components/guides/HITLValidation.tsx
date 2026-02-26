'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { saveGuideSection, GuideSection } from '@/app/actions/properties'
import { toast } from 'sonner'

interface HITLValidationProps {
    propertyId: string
    sections: GuideSection[]
    onUpdate: () => void
}

export function HITLValidation({ propertyId, sections, onUpdate }: HITLValidationProps) {
    const [validatingId, setValidatingId] = useState<string | null>(null)

    const pendingSections = sections.filter(s => s.data?.hitl_validation_required && !s.data?.hitl_validated)

    if (pendingSections.length === 0) return null

    const handleValidate = async (section: GuideSection, confirmed: boolean) => {
        setValidatingId(section.id)
        try {
            const updatedData = {
                ...section.data,
                hitl_validated: true,
                hitl_confirmed: confirmed,
                // If confirmed, we might want to clean up the content or leave it
            }

            await saveGuideSection(propertyId, {
                id: section.id,
                data: updatedData
            })

            toast.success('Validación guardada con éxito')
            onUpdate()
        } catch (error: any) {
            toast.error('Error al validar: ' + error.message)
        } finally {
            setValidatingId(null)
        }
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 px-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-500">
                    Soporte Técnico Requerido (HITL)
                </h3>
            </div>

            <div className="grid gap-4">
                {pendingSections.map((section) => (
                    <Card key={section.id} className="border-orange-200 bg-orange-50/50 overflow-hidden ring-1 ring-orange-500/20">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-orange-500" />
                                    {section.title}
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 bg-white">
                                    IA Pendiente de Confirmación
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            <div className="p-3 bg-white rounded-xl border border-orange-100 text-sm text-slate-700 leading-relaxed italic">
                                "{section.data?.hitl_question || '¿Es correcta la configuración detectada por la IA?'}"
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl"
                                    onClick={() => handleValidate(section, true)}
                                    disabled={validatingId === section.id}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Es Correcto
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-100 font-bold rounded-xl"
                                    onClick={() => handleValidate(section, false)}
                                    disabled={validatingId === section.id}
                                >
                                    Corregir Manualmente
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
