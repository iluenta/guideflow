-- Migration 020: AI Logging and Metrics for appliance_images
-- Extiende la tabla para servir como log técnico de rendimiento

ALTER TABLE public.appliance_images 
ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS analysis_finished_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tokens_prompt INTEGER,
ADD COLUMN IF NOT EXISTS tokens_completion INTEGER,
ADD COLUMN IF NOT EXISTS ai_model TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS error_log TEXT;

-- Índice para facilitar auditorías de rendimiento
CREATE INDEX IF NOT EXISTS appliance_images_status_idx ON public.appliance_images(status);
CREATE INDEX IF NOT EXISTS appliance_images_created_idx ON public.appliance_images(created_at);

COMMENT ON COLUMN public.appliance_images.status IS 'Estado del proceso: pending, processing, completed, failed';
COMMENT ON COLUMN public.appliance_images.error_log IS 'Detalle técnico en caso de fallo en cualquier etapa (visión, búsqueda o generación)';
