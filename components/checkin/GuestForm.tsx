'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DocumentScanner } from './DocumentScanner'
import { getCheckinGuestData, submitCheckinGuest } from '@/app/actions/checkin'
import { calculateAge } from '@/lib/checkin/guest-utils'
import { guestCheckinSchema, RELATIONSHIP_OPTIONS, type GuestCheckinFormValues } from '@/lib/checkin/guest-schema'
import type { ExtractedGuestDocumentData } from '@/types/checkin'

type GuestFormValues = GuestCheckinFormValues

// Cajas grandes, borde bien marcado y texto legible — pensado para huéspedes
// rellenando esto desde el móvil, muchas veces con poca luz o de pie.
const FIELD_CLASS = 'h-12 rounded-xl border-2 border-slate-300 text-base font-medium px-4 focus-visible:border-primary'
const SELECT_CLASS = `${FIELD_CLASS} w-full`
const LABEL_CLASS = 'text-sm font-semibold text-slate-600'

function SectionHeader({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wider text-primary pt-2">{children}</h3>
}

interface GuestFormProps {
  token: string
  guestOrder: number
  checkinDate: string
  hasMinorInGroup: boolean
  onSaved: (birthDate: string) => void
}

export function GuestForm({ token, guestOrder, checkinDate, hasMinorInGroup, onSaved }: GuestFormProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [ocrConfidence, setOcrConfidence] = useState<string | null>(null)

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestCheckinSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      first_name: '',
      first_surname: '',
      second_surname: '',
      document_type: 'NIF',
      document_number: '',
      document_support_number: '',
      birth_date: '',
      nationality: 'ESP',
      sex: 'H',
      phone: '',
      email: '',
      address_street: '',
      address_number: '',
      address_postal_code: '',
      address_city: '',
      address_country: 'ESP',
      relationship_code: '',
    },
  })

  const birthDate = form.watch('birth_date')
  // Antes de conocer la fecha de nacimiento, mostramos la firma por defecto (opción más segura)
  const needsSignature = birthDate ? calculateAge(birthDate, checkinDate) >= 14 : true

  // Si este huésped ya se había guardado antes (el propietario vuelve a pulsar
  // sobre él para corregir un dato), recuperamos y precargamos lo que ya había
  // — sin esto el formulario se abría en blanco y un reenvío lo borraba todo.
  useEffect(() => {
    let cancelled = false

    async function loadExisting() {
      const { data } = await getCheckinGuestData(token, guestOrder)
      if (cancelled) return

      if (data) {
        form.reset({
          first_name: data.first_name,
          first_surname: data.first_surname,
          second_surname: data.second_surname,
          document_type: data.document_type,
          document_number: data.document_number,
          document_support_number: data.document_support_number,
          birth_date: data.birth_date,
          nationality: data.nationality,
          sex: data.sex,
          phone: data.phone,
          email: data.email,
          address_street: data.address_street,
          address_number: data.address_number,
          address_postal_code: data.address_postal_code,
          address_city: data.address_city,
          address_country: data.address_country,
          relationship_code: data.relationship_code,
        })
        setOcrConfidence(data.ocrConfidence)

        if (data.signatureDataUrl) {
          const signatureDataUrl = data.signatureDataUrl
          // Esperar al siguiente frame: el canvas necesita su tamaño final (ancho
          // real del contenedor) antes de dibujar la imagen o queda mal escalada.
          requestAnimationFrame(() => sigRef.current?.fromDataURL(signatureDataUrl))
        }
      }
      if (!cancelled) setLoadingExisting(false)
    }

    loadExisting()
    return () => {
      cancelled = true
    }
    // Solo al montar (un guestOrder/token fijos por instancia de este formulario).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScanned(data: ExtractedGuestDocumentData) {
    // Limpiar primero los campos que rellena el escaneo — si no, un dato de un
    // escaneo anterior (o escrito a mano) se queda mezclado con el nuevo cuando
    // este segundo intento no logra leer ese campo en concreto.
    form.setValue('first_name', '')
    form.setValue('first_surname', '')
    form.setValue('second_surname', '')
    form.setValue('document_type', 'NIF')
    form.setValue('document_number', '')
    form.setValue('document_support_number', '')
    form.setValue('birth_date', '')
    form.setValue('nationality', 'ESP')
    form.setValue('sex', 'H')

    if (data.first_name) form.setValue('first_name', data.first_name)
    if (data.first_surname) form.setValue('first_surname', data.first_surname)
    if (data.second_surname) form.setValue('second_surname', data.second_surname)
    if (data.document_type) {
      const mapped = data.document_type === 'CIF' || data.document_type === 'CIF_E' ? 'OTRO' : data.document_type
      form.setValue('document_type', mapped)
    }
    if (data.document_number) form.setValue('document_number', data.document_number)
    if (data.document_support_number) form.setValue('document_support_number', data.document_support_number)
    if (data.birth_date) form.setValue('birth_date', data.birth_date)
    if (data.nationality) form.setValue('nationality', data.nationality.toUpperCase())
    if (data.sex) form.setValue('sex', data.sex)
    setOcrConfidence(data.confidence)
  }

  async function onSubmit(values: GuestFormValues) {
    const age = calculateAge(values.birth_date, checkinDate)
    const requiresSignature = age >= 14

    if (requiresSignature && (!sigRef.current || sigRef.current.isEmpty())) {
      toast.error('La firma es obligatoria para mayores de 14 años')
      return
    }

    setSubmitting(true)
    try {
      const signatureBase64 = requiresSignature && sigRef.current ? sigRef.current.toDataURL('image/png') : null
      const { error } = await submitCheckinGuest(
        token,
        guestOrder,
        { ...values, ocr_confidence: ocrConfidence },
        signatureBase64
      )
      if (error) {
        toast.error(error)
        return
      }
      toast.success(`Huésped ${guestOrder} guardado`)
      onSaved(values.birth_date)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-left">
      <DocumentScanner token={token} onScanned={handleScanned} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <SectionHeader>Datos personales</SectionHeader>
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Nombre</FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="first_surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Primer apellido</FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="second_surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Segundo apellido <span className="text-slate-400 font-normal">(opcional)</span></FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SectionHeader>Documentación del huésped</SectionHeader>
          <FormField
            control={form.control}
            name="document_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Tipo de documento</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className={SELECT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="NIF">DNI (NIF)</SelectItem>
                    <SelectItem value="NIE">NIE</SelectItem>
                    <SelectItem value="PAS">Pasaporte</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="document_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Nº de documento</FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="document_support_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Nº de soporte <span className="text-slate-400 font-normal">(opcional, DNI/NIE)</span></FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Fecha de nacimiento</FormLabel>
                <FormControl><Input type="date" {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Sexo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger className={SELECT_CLASS}><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="H">Hombre</SelectItem>
                    <SelectItem value="M">Mujer</SelectItem>
                    <SelectItem value="O">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Nacionalidad <span className="text-slate-400 font-normal">(código de 3 letras, ej. ESP)</span></FormLabel>
                <FormControl><Input {...field} maxLength={3} className={`${FIELD_CLASS} uppercase`} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SectionHeader>Contacto y dirección</SectionHeader>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Teléfono</FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Email</FormLabel>
                <FormControl><Input type="email" {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address_street"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Dirección (domicilio habitual)</FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>Nº <span className="text-slate-400 font-normal">(opc.)</span></FormLabel>
                  <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>C.P.</FormLabel>
                  <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>País <span className="text-slate-400 font-normal">(cód. 3 letras)</span></FormLabel>
                <FormControl><Input {...field} maxLength={3} className={`${FIELD_CLASS} uppercase`} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Localidad <span className="text-slate-400 font-normal">(opcional)</span></FormLabel>
                <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {hasMinorInGroup && (
            <FormField
              control={form.control}
              name="relationship_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>Relación con el/la menor de la reserva <span className="text-slate-400 font-normal">(si aplica)</span></FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className={SELECT_CLASS}><SelectValue placeholder="Selecciona…" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {needsSignature && (
            <div className="space-y-2">
              <FormLabel className={LABEL_CLASS}>Firma <span className="text-slate-400 font-normal">(obligatoria, mayores de 14 años)</span></FormLabel>
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                <SignatureCanvas
                  ref={sigRef}
                  clearOnResize={false}
                  canvasProps={{ className: 'w-full h-40 touch-none' }}
                />
              </div>
              <button
                type="button"
                className="text-sm font-medium text-slate-500 underline"
                onClick={() => sigRef.current?.clear()}
              >
                Borrar firma
              </button>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full rounded-full h-14 text-base font-semibold gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar huésped
          </Button>
        </form>
      </Form>
    </div>
  )
}
