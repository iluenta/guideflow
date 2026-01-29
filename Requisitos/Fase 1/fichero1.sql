-- Tabla de manuales generados
CREATE TABLE property_manuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  appliance_name VARCHAR(255),
  brand VARCHAR(100),
  model VARCHAR(100),
  manual_content TEXT, -- Manual completo en markdown
  metadata JSONB, -- {source: 'image'|'search', confidence: 0-1}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de chunks vectorizados para RAG
CREATE TABLE manual_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manual_id UUID REFERENCES property_manuals(id) ON DELETE CASCADE,
  content TEXT, -- Chunk del manual
  embedding vector(1536), -- Embeddings de OpenAI text-embedding-3-small
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de imágenes subidas
CREATE TABLE appliance_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  manual_id UUID REFERENCES property_manuals(id),
  image_url TEXT,
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de conversaciones del chat
CREATE TABLE guest_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  guest_session_id VARCHAR(255), -- Cookie/fingerprint del huésped
  messages JSONB[], -- Array de {role, content, timestamp}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsqueda vectorial
CREATE INDEX ON manual_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 3. FLUJO DE TRABAJO DETALLADO

### FASE 1: Dashboard del Propietario - Generación de Manuales

**Paso 1: Upload de Imagen**
```
Usuario sube foto → Supabase Storage → Trigger análisis