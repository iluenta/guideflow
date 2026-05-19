-- Drop legacy guide_sections table and related objects.
-- Content is now managed via property_context, property_faqs,
-- property_manuals and property_recommendations. Table has been
-- empty in production since the wizard-based system replaced it.

DROP TABLE IF EXISTS public.guide_sections CASCADE;
