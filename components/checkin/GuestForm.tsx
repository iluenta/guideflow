'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import SignatureCanvas from 'react-signature-canvas'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DocumentScanner } from './DocumentScanner'
import { MunicipalityPicker } from './MunicipalityPicker'
import { CountrySelect } from './CountrySelect'
import {
  documentKindsForNationality,
  hasDocument,
  isDocumentKindAllowed,
  kindFromSesCode,
  requiresSupportNumber,
} from '@/lib/checkin/documents'
import { getCheckinGuestData, submitCheckinGuest } from '@/app/actions/checkin'
import { calculateAge } from '@/lib/checkin/guest-utils'
import { guestCheckinSchema, RELATIONSHIP_OPTIONS, type GuestCheckinFormValues, type SharedGuestContact } from '@/lib/checkin/guest-schema'
import type { GuideThemeClasses } from '@/lib/guide-theme'
import type { ExtractedGuestDocumentData } from '@/types/checkin'

type GuestFormValues = GuestCheckinFormValues

// Cajas grandes, borde bien marcado y texto legible — pensado para huéspedes
// rellenando esto desde el móvil, muchas veces con poca luz o de pie.
// Los colores salen del tema de la guía (variables --ck-*, ver lib/checkin/theme.ts).
const FIELD_CLASS = 'h-12 rounded-xl border-2 border-[var(--ck-rule)] bg-[var(--ck-surface)] text-base font-medium px-4 focus-visible:border-[var(--ck-primary)]'
const SELECT_CLASS = `${FIELD_CLASS} w-full`
const LABEL_CLASS = 'text-sm font-semibold text-[var(--ck-ink-soft)]'

interface GuestFormProps {
  token: string
  guestOrder: number
  checkinDate: string
  hasMinorInGroup: boolean
  onSaved: (birthDate: string, shared: SharedGuestContact) => void
  guideTheme: GuideThemeClasses
  /** El botón de guardar vive en la barra inferior fija, fuera de este componente */
  formId: string
  onBusyChange: (busy: boolean) => void
  /** Contacto y dirección del primer huésped, para no repetirlos en los siguientes */
  sharedContact: SharedGuestContact | null
}

export function GuestForm({
  token,
  guestOrder,
  checkinDate,
  hasMinorInGroup,
  onSaved,
  guideTheme: t,
  formId,
  onBusyChange,
  sharedContact,
}: GuestFormProps) {
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
      document_kind: 'DNI',
      document_number: '',
      document_support_number: '',
      birth_date: '',
      nationality: 'ESP',
      sex: 'H',
      phone: '',
      email: '',
      address_street: '',
      address_postal_code: '',
      address_city: '',
      address_country: 'ESP',
      address_municipality_code: '',
      relationship_code: '',
    },
  })

  const birthDate = form.watch('birth_date')
  // España y el extranjero piden la localidad de forma distinta: SES exige el
  // código de municipio del INE para ESP y solo admite texto libre fuera.
  const country = form.watch('address_country')
  const isSpain = (country ?? '').toUpperCase() === 'ESP'
  // La nacionalidad decide qué documentos puede presentar el huésped.
  const nationality = form.watch('nationality')
  const documentKind = form.watch('document_kind')
  const documentKinds = documentKindsForNationality(nationality ?? '')
  const showDocumentNumber = !!documentKind && hasDocument(documentKind)
  const supportNumberRequired = !!documentKind && requiresSupportNumber(documentKind)
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
          document_kind: data.document_kind,
          document_number: data.document_number,
          document_support_number: data.document_support_number,
          birth_date: data.birth_date,
          nationality: data.nationality,
          sex: data.sex,
          phone: data.phone,
          email: data.email,
          address_street: data.address_street,
          address_postal_code: data.address_postal_code,
          address_city: data.address_city,
          address_country: data.address_country,
          address_municipality_code: data.address_municipality_code,
          relationship_code: data.relationship_code,
        })
        setOcrConfidence(data.ocrConfidence)

        if (data.signatureDataUrl) {
          const signatureDataUrl = data.signatureDataUrl
          // Esperar al siguiente frame: el canvas necesita su tamaño final (ancho
          // real del contenedor) antes de dibujar la imagen o queda mal escalada.
          requestAnimationFrame(() => sigRef.current?.fromDataURL(signatureDataUrl))
        }
      } else if (sharedContact) {
        // Huésped nuevo: contacto y dirección suelen ser los mismos de la reserva
        // (pareja, familia…), así que se copian del primero. Quedan editables.
        for (const [field, value] of Object.entries(sharedContact)) {
          if (value) form.setValue(field as keyof GuestFormValues, value)
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

  // La barra inferior fija (en CheckinPageClient) necesita saber si el formulario
  // está ocupado para deshabilitar el botón de guardar y mostrar el spinner.
  useEffect(() => {
    onBusyChange(loadingExisting || submitting)
  }, [loadingExisting, submitting, onBusyChange])

  function handleScanned(data: ExtractedGuestDocumentData) {
    // Limpiar primero los campos que rellena el escaneo — si no, un dato de un
    // escaneo anterior (o escrito a mano) se queda mezclado con el nuevo cuando
    // este segundo intento no logra leer ese campo en concreto.
    form.setValue('first_name', '')
    form.setValue('first_surname', '')
    form.setValue('second_surname', '')
    form.setValue('document_kind', '' as never)
    form.setValue('document_number', '')
    form.setValue('document_support_number', '')
    form.setValue('birth_date', '')
    form.setValue('nationality', '')
    form.setValue('sex', 'H')

    if (data.first_name) form.setValue('first_name', data.first_name)
    if (data.first_surname) form.setValue('first_surname', data.first_surname)
    if (data.second_surname) form.setValue('second_surname', data.second_surname)

    // La nacionalidad se aplica ANTES que el documento: es la que decide qué
    // documentos son válidos, y así la combinación que queda es coherente
    // (un pasaporte alemán, no un DNI alemán).
    //
    // Si el escaneo no la trae, el campo se queda vacío a propósito: caer en
    // "España" por defecto atribuiría nacionalidad española a un extranjero
    // sin que nadie lo haya dicho, y eso acabaría en la comunicación a SES.
    // El código ya viene normalizado a ISO 3166-1 alfa-3 desde el OCR.
    const scannedNationality = data.nationality ?? ''
    if (scannedNationality) form.setValue('nationality', scannedNationality)

    if (data.document_type) {
      const kind = kindFromSesCode(data.document_type)
      if (isDocumentKindAllowed(kind, scannedNationality)) {
        form.setValue('document_kind', kind)
      }
    }
    if (data.document_number) form.setValue('document_number', data.document_number)
    if (data.document_support_number) form.setValue('document_support_number', data.document_support_number)
    if (data.birth_date) form.setValue('birth_date', data.birth_date)
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
      onSaved(values.birth_date, {
        phone: values.phone ?? '',
        email: values.email ?? '',
        address_street: values.address_street,
        address_postal_code: values.address_postal_code,
        address_city: values.address_city ?? '',
        address_country: values.address_country,
        address_municipality_code: values.address_municipality_code ?? '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--ck-ink-mute)] gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-left">
      <DocumentScanner token={token} onScanned={handleScanned} guideTheme={t} />

      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
          <p className={`text-[10px] ${t.sectionLabel}`}>Documentación del huésped</p>
          <div className={`p-4 space-y-4 ${t.cardBg}`}>
          {/* La nacionalidad va la primera porque decide qué documentos se
              pueden presentar: el DNI solo lo tiene quien es español. */}
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Nacionalidad</FormLabel>
                <CountrySelect
                  value={field.value ?? ''}
                  onChange={code => {
                    field.onChange(code)
                    // Si el documento elegido no existe para la nueva
                    // nacionalidad (un extranjero no presenta DNI), se deja el
                    // desplegable vacío en vez de guardar una combinación
                    // imposible que luego rechazaría el servidor.
                    if (!isDocumentKindAllowed(form.getValues('document_kind'), code)) {
                      form.setValue('document_kind', '' as never)
                    }
                  }}
                  fieldClass={FIELD_CLASS}
                  placeholder="Selecciona tu nacionalidad…"
                  aria-invalid={!!form.formState.errors.nationality}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="document_kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Tipo de documento</FormLabel>
                <Select
                  value={field.value}
                  // Los errores del bloque de documento se limpian al cambiar de
                  // tipo: con reValidateMode 'onBlur' se quedaban en rojo bajo
                  // campos que el tipo nuevo ni siquiera muestra.
                  onValueChange={value => {
                    field.onChange(value)
                    form.clearErrors(['document_number', 'document_support_number'])
                    if (value === 'MENOR_SIN_DOCUMENTO') {
                      form.setValue('document_number', '')
                      form.setValue('document_support_number', '')
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className={SELECT_CLASS}>
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {documentKinds.map(d => (
                      <SelectItem key={d.kind} value={d.kind}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Un menor sin documentación no tiene número que dar: los campos
              desaparecen en vez de quedarse vacíos pidiendo algo imposible. */}
          {showDocumentNumber && (
            <>
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
                    <FormLabel className={LABEL_CLASS}>
                      Nº de soporte
                      {!supportNumberRequired && (
                        <span className="text-[var(--ck-ink-mute)] font-normal"> (opcional)</span>
                      )}
                    </FormLabel>
                    <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          </div>
          </div>

          <div className="space-y-3">
          <p className={`text-[10px] ${t.sectionLabel}`}>Información del huésped</p>
          <div className={`p-4 space-y-4 ${t.cardBg}`}>
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
                <FormLabel className={LABEL_CLASS}>Segundo apellido <span className="text-[var(--ck-ink-mute)] font-normal">(opcional)</span></FormLabel>
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

          {/* Orden de arriba abajo: País → Provincia → Municipio → C.P. →
              Dirección → Nº. Va de lo general a lo concreto, que es como se
              rellena una dirección y como la pide el registro manual del SES;
              además el país decide qué campos aparecen debajo, así que tiene
              que ser lo primero. */}
          <FormField
            control={form.control}
            name="address_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>País de residencia</FormLabel>
                <CountrySelect
                  value={field.value ?? ''}
                  // Cambiar de país cambia qué campos de localidad aplican: se
                  // limpian los del modo anterior para no arrastrar un
                  // municipio español a una dirección extranjera (ni al revés).
                  onChange={code => {
                    const wasSpain = isSpain
                    const willBeSpain = code === 'ESP'
                    field.onChange(code)
                    if (wasSpain !== willBeSpain) {
                      form.setValue('address_municipality_code', '')
                      form.setValue('address_city', '')
                    }
                  }}
                  fieldClass={FIELD_CLASS}
                  placeholder="Selecciona tu país…"
                  aria-invalid={!!form.formState.errors.address_country}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {isSpain ? (
            <FormField
              control={form.control}
              name="address_municipality_code"
              render={({ field }) => (
                <FormItem>
                  <MunicipalityPicker
                    value={field.value ?? ''}
                    // El nombre oficial se guarda además en address_city: es lo
                    // que se ve en el PDF del parte de entrada y lo que hereda
                    // el siguiente huésped de la reserva.
                    onChange={(code, name) => {
                      field.onChange(code)
                      form.setValue('address_city', name)
                    }}
                    fieldClass={FIELD_CLASS}
                    labelClass={LABEL_CLASS}
                    error={form.formState.errors.address_municipality_code?.message}
                  />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="address_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>Localidad</FormLabel>
                  <FormControl><Input {...field} className={FIELD_CLASS} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="address_postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Código postal</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode={isSpain ? 'numeric' : 'text'}
                    // Sin maxLength a propósito: el atributo corta el texto
                    // CRUDO, así que un "04 6-00" se quedaba en "04 6-" y al
                    // limpiarlo salía "046". El tope se aplica después de
                    // quitar separadores, aquí abajo.
                    //
                    // Se normaliza al teclear en vez de solo avisar después:
                    // en España son 5 dígitos y fuera solo letras y números
                    // (un "SW1A 1AA" o un "1015-CJ" se manda a SES sin
                    // espacios ni guiones).
                    onChange={e => {
                      const raw = e.target.value
                      field.onChange(
                        isSpain
                          ? raw.replace(/\D/g, '').slice(0, 5)
                          : raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
                      )
                    }}
                    className={FIELD_CLASS}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Número de teléfono</FormLabel>
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

          {/* Un único campo de dirección (calle, número, piso, puerta…), que es
              justo lo que espera SES: su esquema tiene un "direccion" de texto
              libre, no un campo de número aparte. */}
          <FormField
            control={form.control}
            name="address_street"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Dirección</FormLabel>
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
                  <FormLabel className={LABEL_CLASS}>Relación con el/la menor de la reserva <span className="text-[var(--ck-ink-mute)] font-normal">(si aplica)</span></FormLabel>
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

          </div>
          </div>

          {needsSignature && (
            <div className="space-y-3">
              <p className={`text-[10px] ${t.sectionLabel}`}>Firma</p>
              <div className={`p-4 space-y-2 ${t.cardBg}`}>
                <p className="text-[12px] text-[var(--ck-ink-soft)]">
                  Obligatoria para mayores de 14 años. Firma con el dedo dentro del recuadro.
                </p>
                <div className="border-2 border-[var(--ck-rule)] rounded-xl overflow-hidden bg-[var(--ck-tint)]">
                  <SignatureCanvas
                    ref={sigRef}
                    clearOnResize={false}
                    canvasProps={{ className: 'w-full h-40 touch-none' }}
                  />
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--ck-ink-soft)] underline"
                  onClick={() => sigRef.current?.clear()}
                >
                  Borrar firma
                </button>
              </div>
            </div>
          )}

        </form>
      </Form>
    </div>
  )
}
