import React from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';
interface Contact {
  id: string;
  name: string;
  phone: string;
  role: string;
}
interface ContactosData {
  contacts: Contact[];
}
interface ContactosStepProps {
  data: ContactosData;
  onChange: (data: Partial<ContactosData>) => void;
}
export function ContactosStep({ data, onChange }: ContactosStepProps) {
  const addContact = () => {
    const newContact: Contact = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      phone: '',
      role: ''
    };
    onChange({
      contacts: [...data.contacts, newContact]
    });
  };
  const removeContact = (id: string) => {
    onChange({
      contacts: data.contacts.filter((c) => c.id !== id)
    });
  };
  const updateContact = (id: string, field: keyof Contact, value: string) => {
    onChange({
      contacts: data.contacts.map((c) =>
      c.id === id ?
      {
        ...c,
        [field]: value
      } :
      c
      )
    });
  };
  return (
    <Card
      title="Contactos de Emergencia"
      description="Añade números importantes para tus huéspedes.">

      <div className="space-y-6">
        {data.contacts.map((contact, index) =>
        <div
          key={contact.id}
          className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">

            <div className="absolute top-2 right-2">
              <button
              onClick={() => removeContact(contact.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove contact">

                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-medium text-text-primary mb-3">
              Contacto {index + 1}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
              placeholder="Nombre"
              value={contact.name}
              onChange={(e) =>
              updateContact(contact.id, 'name', e.target.value)
              } />

              <Input
              placeholder="Teléfono"
              type="tel"
              value={contact.phone}
              onChange={(e) =>
              updateContact(contact.id, 'phone', e.target.value)
              } />

              <Input
              placeholder="Rol (Ej: Emergencias)"
              value={contact.role}
              onChange={(e) =>
              updateContact(contact.id, 'role', e.target.value)
              } />

            </div>
          </div>
        )}

        <Button
          variant="secondary"
          onClick={addContact}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full border-dashed">

          Añadir Otro Contacto
        </Button>
      </div>
    </Card>);

}