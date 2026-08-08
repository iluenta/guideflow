'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getMunicipalities, getProvinces, type Municipality, type Province } from '@/app/actions/municipalities'

// Selector en cascada Provincia → Municipio para residentes en España.
//
// Por qué en cascada y no un único buscador: los 8.132 municipios pesan
// demasiado para mandarlos al móvil del huésped, y muchos nombres se repiten
// entre provincias (hay 4 "Villanueva del Río"). Con la provincia elegida, la
// lista baja a 371 en el peor caso (Burgos) y el filtrado por texto ya se hace
// en el cliente, sin más peticiones mientras se escribe.
//
// El código INE de 5 dígitos son los 2 de la provincia + los 3 del municipio,
// así que al reabrir una ficha guardada la provincia se deduce del propio
// código y no hace falta guardarla aparte.

interface MunicipalityPickerProps {
  /** Código INE de 5 dígitos, o '' si aún no hay municipio elegido */
  value: string
  onChange: (code: string, name: string) => void
  fieldClass: string
  labelClass: string
  /** Mensaje de error del formulario, si el campo se ha marcado inválido */
  error?: string
}

/** Minúsculas sin acentos: buscar "malaga" tiene que encontrar "Málaga". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function MunicipalityPicker({ value, onChange, fieldClass, labelClass, error }: MunicipalityPickerProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provinceCode, setProvinceCode] = useState(() => (value.length === 5 ? value.slice(0, 2) : ''))
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    getProvinces().then(({ data }) => {
      if (!cancelled) setProvinces(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!provinceCode) {
      setMunicipalities([])
      return
    }
    let cancelled = false
    setLoadingMunicipalities(true)
    getMunicipalities(provinceCode).then(({ data }) => {
      if (cancelled) return
      setMunicipalities(data)
      setLoadingMunicipalities(false)
    })
    return () => {
      cancelled = true
    }
  }, [provinceCode])

  const selected = municipalities.find(m => m.code === value)

  // Filtrado propio en vez del de cmdk: así "malaga" encuentra "Málaga", que
  // es exactamente como lo teclea alguien desde el móvil.
  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return municipalities
    return municipalities.filter(m => normalize(m.name).includes(q))
  }, [municipalities, query])

  function handleProvinceChange(code: string) {
    setProvinceCode(code)
    // El municipio anterior pertenecía a otra provincia: dejar de seleccionarlo.
    onChange('', '')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className={labelClass}>Provincia</label>
        <Select value={provinceCode} onValueChange={handleProvinceChange}>
          <SelectTrigger className={`${fieldClass} w-full`}>
            <SelectValue placeholder="Selecciona tu provincia…" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map(p => (
              <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Municipio</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={!provinceCode || loadingMunicipalities}>
            <button
              type="button"
              aria-invalid={error ? true : undefined}
              className={`${fieldClass} w-full flex items-center justify-between gap-2 text-left disabled:opacity-50 aria-invalid:border-[var(--destructive)]`}
            >
              <span className={selected ? '' : 'text-[var(--ck-ink-mute)] font-normal'}>
                {selected
                  ? selected.name
                  : provinceCode
                    ? 'Selecciona tu municipio…'
                    : 'Elige antes la provincia'}
              </span>
              {loadingMunicipalities
                ? <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" />
                : <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Escribe para buscar…" value={query} onValueChange={setQuery} />
              <CommandList className="max-h-72">
                <CommandEmpty>Ningún municipio coincide.</CommandEmpty>
                <CommandGroup>
                  {filtered.map(m => (
                    <CommandItem
                      key={m.code}
                      value={m.code}
                      onSelect={() => {
                        onChange(m.code, m.name)
                        setQuery('')
                        setOpen(false)
                      }}
                      className="text-base py-2.5"
                    >
                      <Check className={`mr-2 h-4 w-4 ${m.code === value ? 'opacity-100' : 'opacity-0'}`} />
                      {m.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && <p className="text-sm font-medium text-[var(--destructive)]">{error}</p>}
      </div>
    </div>
  )
}
