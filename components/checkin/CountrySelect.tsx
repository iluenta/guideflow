'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { COUNTRIES } from '@/lib/checkin/countries'

// Desplegable de países con buscador. Son 250, así que una lista sin filtro es
// inusable en un móvil; y el filtro ignora acentos porque nadie teclea
// "Türkiye" ni "Panamá" con el diacrítico desde el teclado del teléfono.
//
// El valor es el código ISO 3166-1 alfa-3 (ESP, DEU…), que es lo que espera
// SES Hospedajes tanto para la nacionalidad como para el país de residencia.

interface CountrySelectProps {
  value: string
  onChange: (code: string) => void
  fieldClass: string
  placeholder?: string
  'aria-invalid'?: boolean
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function CountrySelect({
  value,
  onChange,
  fieldClass,
  placeholder = 'Selecciona un país…',
  'aria-invalid': ariaInvalid,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = COUNTRIES.find(c => c.code === value.toUpperCase())

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return COUNTRIES
    // También por código: quien sabe que es "ESP" lo teclea más rápido.
    return COUNTRIES.filter(c => normalize(c.name).includes(q) || c.code.toLowerCase().startsWith(q))
  }, [query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-invalid={ariaInvalid}
          className={`${fieldClass} w-full flex items-center justify-between gap-2 text-left aria-invalid:border-[var(--destructive)]`}
        >
          <span className={selected ? '' : 'text-[var(--ck-ink-mute)] font-normal'}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Escribe para buscar…" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-72">
            <CommandEmpty>Ningún país coincide.</CommandEmpty>
            <CommandGroup>
              {filtered.map(c => (
                <CommandItem
                  key={c.code}
                  value={c.code}
                  onSelect={() => {
                    onChange(c.code)
                    setQuery('')
                    setOpen(false)
                  }}
                  className="text-base py-2.5"
                >
                  <Check className={`mr-2 h-4 w-4 ${c.code === value.toUpperCase() ? 'opacity-100' : 'opacity-0'}`} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
