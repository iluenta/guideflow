import { NextResponse } from 'next/server';
import { Translator } from '@/lib/translator';
import { createEdgeAdminClient } from '@/lib/supabase/edge';

export async function POST(req: Request) {
    try {
        const { text, targetLanguage, sourceLanguage = 'es', contextType = 'general' } = await req.json();

        if (!text || !targetLanguage) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (targetLanguage === sourceLanguage) {
            return NextResponse.json({ translatedText: text });
        }

        // Traducir usando el servicio unificado (con caché)
        const translatedText = await Translator.translateText(
            text,
            targetLanguage,
            sourceLanguage,
            `This is part of a ${contextType} for a vacation rental guest.`
        );

        return NextResponse.json({ translatedText });

    } catch (error: any) {
        console.error('[API_TRANSLATE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
