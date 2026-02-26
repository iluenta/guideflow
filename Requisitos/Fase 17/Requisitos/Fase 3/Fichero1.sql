-- Tabla principal de contexto de la propiedad
CREATE TABLE property_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  category VARCHAR(50), -- 'access', 'rules', 'tech', 'amenities', 'dining', 'services', 'experiences', 'problems'
  subcategory VARCHAR(50),
  content JSONB, -- Estructura flexible según categoría
  language VARCHAR(5) DEFAULT 'es',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para FAQs específicas del propietario
CREATE TABLE property_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  question TEXT,
  answer TEXT,
  category VARCHAR(50),
  priority INTEGER DEFAULT 0, -- Mayor número = mayor prioridad en RAG
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para recomendaciones personalizadas
CREATE TABLE property_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  type VARCHAR(50), -- 'restaurant', 'activity', 'service'
  name VARCHAR(255),
  description TEXT,
  distance VARCHAR(50),
  price_range VARCHAR(20),
  metadata JSONB, -- {address, phone, website, hours, etc}
  personal_note TEXT, -- Nota personal del propietario
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings del contexto completo
CREATE TABLE context_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  source_type VARCHAR(50), -- 'manual', 'faq', 'context', 'recommendation'
  source_id UUID, -- ID del registro original
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_context_embeddings_property ON context_embeddings(property_id);
CREATE INDEX idx_context_embeddings_vector ON context_embeddings 
  USING ivfflat (embedding vector_cosine_ops);