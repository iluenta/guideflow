// app/api/ai-fill-context/route.ts

export async function POST(req: Request) {
  const { propertyId, section, existingData } = await req.json();
  
  // Obtener dirección de la propiedad
  const { data: property } = await supabase
    .from('properties')
    .select('address, city, country')
    .eq('id', propertyId)
    .single();
  
  const address = `${property.address}, ${property.city}, ${property.country}`;
  
  let prompt = '';
  
  if (section === 'dining') {
    prompt = `Eres un experto local de ${property.city}.

UBICACIÓN DEL APARTAMENTO: ${address}

TAREA: Genera una lista de 10 restaurantes reales y verificables cerca de esta ubicación.

Para cada restaurante, proporciona en formato JSON:
{
  "restaurants": [
    {
      "name": "nombre real del restaurante",
      "type": "tipo de cocina",
      "distance": "distancia aproximada andando",
      "price_range": "€" o "€€" o "€€€",
      "specialty": "plato/especialidad destacada",
      "address": "dirección completa",
      "personal_note": "sugerencia de por qué recomendarlo"
    }
  ]
}

IMPORTANTE:
- Solo restaurantes REALES que existan actualmente
- Variedad de tipos de cocina
- Diferentes rangos de precio
- Ordenar por distancia (más cerca primero)
- Incluir al menos 2 opciones económicas

RESPONDE SOLO CON EL JSON.`;
  }
  
  if (section === 'access_transport') {
    prompt = `Eres un experto en transporte público de ${property.city}.

UBICACIÓN: ${address}

TAREA: Proporciona instrucciones detalladas para llegar desde:
1. Aeropuerto principal
2. Estación de tren principal
3. Centro de la ciudad

Formato JSON:
{
  "from_airport": {
    "metro": { "line": "", "stations": "", "duration": "", "price": "" },
    "taxi": { "duration": "", "price": "" },
    "bus": { "line": "", "duration": "" }
  },
  "from_train_station": { ... },
  "public_transport_nearby": {
    "metro_station": { "name": "", "lines": [], "distance": "" },
    "bus_stops": []
  }
}

Solo información REAL y verificable.`;
  }
  
  // Llamar a Claude
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: prompt
    }]
  });
  
  const response = JSON.parse(message.content[0].text);
  
  return Response.json(response);
}