const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Aplicando migración Fase 6...');
    const query = `
        -- Tabla de idiomas soportados
        CREATE TABLE IF NOT EXISTS supported_languages (
          code VARCHAR(5) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          native_name VARCHAR(50) NOT NULL,
          flag_emoji VARCHAR(10),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        INSERT INTO supported_languages (code, name, native_name, flag_emoji) VALUES
          ('es', 'Spanish', 'Español', '🇪🇸'),
          ('en', 'English', 'English', '🇬🇧'),
          ('fr', 'French', 'Français', '🇫🇷'),
          ('de', 'German', 'Deutsch', '🇩🇪'),
          ('it', 'Italian', 'Italiano', '🇮🇹'),
          ('pt', 'Portuguese', 'Português', '🇵🇹')
        ON CONFLICT (code) DO UPDATE SET 
          name = EXCLUDED.name,
          native_name = EXCLUDED.native_name,
          flag_emoji = EXCLUDED.flag_emoji;

        -- Tabla de preferencias de idioma
        CREATE TABLE IF NOT EXISTS guest_language_preferences (
          access_token VARCHAR(255) PRIMARY KEY,
          language_code VARCHAR(5) REFERENCES supported_languages(code),
          detected_language VARCHAR(5),
          manually_selected BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Caché de traducciones
        CREATE TABLE IF NOT EXISTS translation_cache (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_type VARCHAR(50),
          source_id VARCHAR(255),
          source_field VARCHAR(100),
          source_language VARCHAR(5) DEFAULT 'es',
          target_language VARCHAR(5) NOT NULL,
          source_text TEXT NOT NULL,
          translated_text TEXT NOT NULL,
          translation_method VARCHAR(50),
          tokens_used INTEGER,
          cost_usd DECIMAL(10, 6) DEFAULT 0,
          cache_hits INTEGER DEFAULT 0,
          last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT idx_translation_lookup UNIQUE (source_text, target_language)
        );

        -- Función helper
        CREATE OR REPLACE FUNCTION increment_cache_hits(cache_id UUID)
        RETURNS void AS $$
        BEGIN
          UPDATE translation_cache
          SET 
            cache_hits = cache_hits + 1,
            last_used_at = NOW()
          WHERE id = cache_id;
        END;
        $$ LANGUAGE plpgsql;
    `;

    const { data, error } = await supabase.rpc('execute_sql_raw', { sql_query: query });

    if (error) {
        console.error('Error al ejecutar RPC:', error.message);
        // Fallback: Si no hay RPC, intentar verificar conexión
        const { data: test, error: testErr } = await supabase.from('supported_languages').select('count', { count: 'exact', head: true });
        if (testErr) console.error('Error de conexión:', testErr.message);
        else console.log('Conexión verificada, pero el RPC execute_sql_raw falló. Asegúrate de que el RPC existe en Supabase.');
    } else {
        console.log('Migración completada (o tablas verificadas).');
    }
}

runMigration();
