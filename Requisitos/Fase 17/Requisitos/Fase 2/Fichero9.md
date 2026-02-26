# Fichero 9: Manuals Page Reference
// app/dashboard/property/[id]/manuals/page.tsx

```tsx
'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function ManualsPage({ params }: { params: { id: string } }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress('Subiendo imagen...');

    // ... (rest of the logic)
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manuales de Electrodomésticos</h1>
      {/* ... */}
    </div>
  );
}
```

---

## COSTES ESTIMADOS (MVP)

### Costes por Propiedad/Mes

**Generación de Manuales (one-time por aparato):**
- Claude Vision (analizar 1 imagen): ~$0.003
- Brave Search (3 búsquedas): Gratis (plan básico)
- Claude Sonnet (generar manual 3K tokens): ~$0.015
- OpenAI Embeddings (500 tokens): ~$0.00001
- **Total por aparato: ~$0.02**
- **10 aparatos por propiedad: $0.20**

**Chat en Producción (estimado 100 preguntas/mes):**
- OpenAI Embeddings query: 100 × $0.00001 = $0.001
- Claude Haiku (100 respuestas × 200 tokens): ~$0.05
- **Total chat/mes: $0.051**

**TOTAL por propiedad/mes: ~$0.25**

**100 propiedades activas: $25/mes**

### Costes Infraestructura:
- Vercel (Hobby): $0 (hasta 100GB bandwidth)
- Supabase (Free tier): $0 (hasta 500MB DB)
- **Total fijo: $0** (en MVP)
