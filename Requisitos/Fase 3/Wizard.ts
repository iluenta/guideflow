// app/dashboard/property/[id]/setup/page.tsx

const sections = [
  {
    id: 'access',
    title: 'Acceso y Llegada',
    icon: '🔑',
    forms: [
      {
        section: 'Dirección',
        fields: [
          { name: 'full_address', label: 'Dirección completa', type: 'text', required: true },
          { name: 'gps_coords', label: 'Coordenadas GPS', type: 'text', helper: 'Se pueden obtener de Google Maps' },
          { name: 'portal_description', label: 'Descripción del portal', type: 'textarea', placeholder: 'Ej: Portal verde, entre farmacia y panadería' },
          { name: 'portal_photo', label: 'Foto del portal', type: 'file' },
        ]
      },
      {
        section: 'Check-in',
        fields: [
          { name: 'checkin_type', label: 'Tipo de check-in', type: 'select', options: ['lockbox', 'presencial', 'smart_lock'] },
          { name: 'checkin_time', label: 'Hora check-in', type: 'time', default: '15:00' },
          { name: 'early_checkin', label: '¿Check-in anticipado disponible?', type: 'toggle' },
          { name: 'early_checkin_cost', label: 'Coste check-in anticipado', type: 'number', showIf: 'early_checkin' },
        ]
      },
      {
        section: 'Cómo llegar',
        subsections: [
          {
            title: 'Desde el aeropuerto',
            repeatable: true,
            fields: [
              { name: 'transport_type', label: 'Tipo', type: 'select', options: ['Metro', 'Taxi', 'Bus', 'Tren'] },
              { name: 'instructions', label: 'Instrucciones', type: 'richtext' },
              { name: 'duration', label: 'Duración', type: 'text' },
              { name: 'price', label: 'Precio aproximado', type: 'text' },
            ]
          }
        ]
      }
    ]
  },
  
  {
    id: 'rules',
    title: 'Normas de la Casa',
    icon: '📋',
    forms: [
      {
        section: 'Check-out',
        fields: [
          { name: 'checkout_time', label: 'Hora check-out', type: 'time', default: '11:00' },
          { name: 'late_checkout', label: '¿Late checkout disponible?', type: 'toggle' },
          { name: 'late_checkout_cost', label: 'Coste', type: 'number' },
          { name: 'key_return', label: 'Devolución de llaves', type: 'textarea' },
        ]
      },
      {
        section: 'Obligaciones de limpieza',
        fields: [
          { name: 'cleaning_included', label: 'Limpieza incluida', type: 'toggle', default: true },
          { name: 'guest_duties', label: 'Tareas del huésped', type: 'checklist', options: [
            'Tirar la basura',
            'Dejar cocina recogida',
            'Dejar toallas en el baño',
            'Apagar luces y electrodomésticos',
            'Otros'
          ]},
        ]
      },
      {
        section: 'Normas de convivencia',
        fields: [
          { name: 'quiet_hours', label: 'Horario de silencio', type: 'timerange', default: '23:00-08:00' },
          { name: 'smoking', label: 'Fumar', type: 'select', options: ['No permitido', 'Solo en balcón', 'Permitido'] },
          { name: 'pets', label: 'Mascotas', type: 'select', options: ['No permitidas', 'Bajo petición', 'Permitidas'] },
          { name: 'max_guests', label: 'Máximo huéspedes', type: 'number' },
          { name: 'parties', label: 'Fiestas permitidas', type: 'toggle', default: false },
        ]
      }
    ]
  },
  
  {
    id: 'amenities',
    title: 'Equipamiento',
    icon: '🏠',
    quickFill: true, // Botón "Rellenar con IA" que analiza fotos
    forms: [
      {
        section: 'Baño',
        fields: [
          { name: 'towels', label: 'Juegos de toallas', type: 'number' },
          { name: 'hairdryer', label: 'Secador', type: 'toggle' },
          { name: 'toiletries', label: 'Productos de aseo incluidos', type: 'multiselect' },
        ]
      },
      // Similar para cocina, dormitorios, etc.
    ]
  },
  
  {
    id: 'dining',
    title: 'Restaurantes y Ocio',
    icon: '🍽️',
    smartSuggest: true, // Botón "Sugerir con IA" basado en ubicación
    forms: [
      {
        section: 'Restaurantes recomendados',
        repeatable: true,
        fields: [
          { name: 'name', label: 'Nombre', type: 'text' },
          { name: 'type', label: 'Tipo cocina', type: 'select' },
          { name: 'distance', label: 'Distancia', type: 'text' },
          { name: 'price_range', label: 'Precio', type: 'select', options: ['€', '€€', '€€€'] },
          { name: 'specialty', label: 'Especialidad', type: 'text' },
          { name: 'personal_note', label: 'Tu nota personal', type: 'textarea', placeholder: 'Ej: La mejor pizza de Madrid' },
          { name: 'delivery', label: 'Tiene delivery', type: 'toggle' },
        ]
      }
    ]
  },
  
  {
    id: 'faqs',
    title: 'Preguntas Frecuentes',
    icon: '❓',
    aiGenerate: true, // Generar FAQs con IA
    forms: [
      {
        section: 'FAQs personalizadas',
        repeatable: true,
        fields: [
          { name: 'question', label: 'Pregunta', type: 'text' },
          { name: 'answer', label: 'Respuesta', type: 'richtext' },
          { name: 'category', label: 'Categoría', type: 'select' },
        ]
      }
    ]
  }
];

export default function PropertySetupWizard({ params }: { params: { id: string } }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});
  
  const handleAIFill = async (section: string) => {
    // Llamar a API que usa Claude para rellenar basándose en ubicación
    const response = await fetch('/api/ai-fill-context', {
      method: 'POST',
      body: JSON.stringify({
        propertyId: params.id,
        section,
        existingData: formData
      })
    });
    
    const suggestions = await response.json();
    setFormData({ ...formData, ...suggestions });
  };
  
  // ... resto del componente
}