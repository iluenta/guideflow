/**
 * Comparación directa V1 vs V2 con visión real de Gemini.
 * Acepta rutas de imágenes locales o URLs externas.
 * Uso: npx tsx compare-v1-v2-vision.ts <imagen1> [imagen2] [imagen3]
 * Ejemplo: npx tsx compare-v1-v2-vision.ts C:\fotos\tv.jpg C:\fotos\micro.jpg
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env.stress') });

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const imagePaths = process.argv.slice(2);
if (!imagePaths.length) {
    console.error('Usage: npx tsx compare-v1-v2-vision.ts <image1> [image2] ...');
    process.exit(1);
}

// ─── Image loading ────────────────────────────────────────────────────────────

function imageToBase64Part(filePath: string): { inlineData: { mimeType: string; data: string } } {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mimeType = mimeMap[ext] || 'image/jpeg';
    const data = fs.readFileSync(filePath).toString('base64');
    return { inlineData: { mimeType, data } };
}

// ─── Phase 1: Identify ────────────────────────────────────────────────────────

async function identifyAppliance(imageBase64: any): Promise<{ type: string; brand: string; model: string; scannable: boolean }> {
    const body = {
        contents: [{
            role: 'user',
            parts: [
                imageBase64,
                {
                    text: `Analiza esta imagen. ¿Es un electrodoméstico o aparato del hogar que necesita manual de uso?

Si SÍ es un aparato (nevera, microondas, lavadora, TV, aire acondicionado, cafetera, etc.):
Responde EXACTAMENTE en este formato JSON (sin markdown):
{"scannable": true, "appliance_type": "TIPO EN MAYÚSCULAS", "brand": "Marca", "model": "Modelo si visible"}

Si NO es un aparato (libros, ropa, decoración, muebles sin función, alimentos, etc.):
Responde EXACTAMENTE: {"scannable": false, "reason": "descripción breve de lo que es"}

Responde SOLO con el JSON, sin texto adicional.`
                }
            ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
    };

    const resp = await axios.post(GEMINI_VISION_URL, body, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
    const raw = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    try {
        const clean = raw.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return { type: 'Desconocido', brand: '', model: '', scannable: false };
    }
}

// ─── Manual generation ────────────────────────────────────────────────────────

function getSpecificInstructions(type: string): string {
    const t = type.toLowerCase();
    if (/microondas/.test(t)) return `REQUISITOS PARA MICROONDAS:
- Niveles de potencia y para qué sirve cada uno
- Función descongelación paso a paso
- Función grill si la tiene
- Recipientes que NO se pueden usar`;
    if (/televisión|tv|televisor/.test(t)) return `REQUISITOS PARA TV:
- REGLA: Solo menciona botones directos de apps que veas FÍSICAMENTE en el mando
- Cómo encender, cambiar canal/volumen
- Cambiar FUENTE/INPUT (HDMI, TDT, streaming)`;
    if (/aire acondicionado|climatizador/.test(t)) return `REQUISITOS PARA AIRE ACONDICIONADO:
- Modos (frío, calor, ventilación, auto) y para qué sirve cada uno
- Temperatura recomendada: 24-25°C
- Timer si lo tiene`;
    if (/lavadora/.test(t)) return `REQUISITOS PARA LAVADORA:
- Programas principales con temperatura (máx 6)
- Cajón del detergente
- Centrifugado y carga máxima`;
    return `REQUISITOS:
- Describe las funciones principales (máximo 6)
- Para cada función explica PARA QUÉ sirve`;
}

async function generateV1(imageBase64: any, type: string, brand: string, model: string): Promise<string> {
    const system = `Eres un experto en electrodomésticos que crea manuales de uso PRÁCTICOS para huéspedes de apartamentos turísticos.

REGLAS DE ORO:
1. Empieza directamente con el título h1
2. NO escribas preámbulos
3. Usa markdown limpio
4. Describe cada función con su nombre exacto visible en el panel

FORMATO: Título / Primeros Pasos / Programas y Funciones / Diagnóstico de Problemas / Consejos

${getSpecificInstructions(type)}

SECCIÓN "Diagnóstico de Problemas" OBLIGATORIA:
- Tabla markdown: | Código/Señal | Significado | Solución |`;

    const body = {
        system_instruction: { parts: [{ text: system }] },
        contents: [{
            role: 'user',
            parts: [
                imageBase64,
                {
                    text: `Genera un manual COMPLETO Y DETALLADO para este aparato.
Tipo: ${type} | Marca: ${brand} | Modelo: ${model}
Analiza la imagen con detalle para identificar todos los controles visibles.`
                }
            ]
        }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 6000, responseMimeType: 'text/plain' }
    };

    const resp = await axios.post(GEMINI_VISION_URL, body, { headers: { 'Content-Type': 'application/json' }, timeout: 90000 });
    return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function generateV2(imageBase64: any, type: string, brand: string, model: string): Promise<string> {
    const system = `Eres un experto en electrodomésticos que crea manuales de uso PRÁCTICOS para huéspedes de apartamentos turísticos.

IDENTIDAD: Español (España), tono profesional y amigable, audiencia: huéspedes que nunca han visto el aparato.

REGLAS DE ORO:
1. Empieza directamente con el título h1
2. NO escribas preámbulos ni repeticiones
3. Usa markdown limpio
4. Describe cada función con su nombre exacto visible en el panel
5. ⚠️ LÍMITE ESTRICTO: máximo 600 palabras en total

FORMATO: 3-4 secciones, máximo 5-6 puntos por sección.

${getSpecificInstructions(type)}

SECCIÓN "Diagnóstico de Problemas" OBLIGATORIA:
- Tabla markdown: | Código/Señal | Significado | Solución |
- Máximo 8 filas
- Final: "Si el problema persiste, contacta con el personal de soporte"

PROHIBIDO: Inventar funciones, decir "no tengo información", repetir información.`;

    const body = {
        system_instruction: { parts: [{ text: system }] },
        contents: [{
            role: 'user',
            parts: [
                imageBase64,
                {
                    text: `Genera un manual PRÁCTICO y CONCISO para este aparato.
Tipo: ${type} | Marca: ${brand} | Modelo: ${model}
Analiza la imagen para identificar los controles visibles.
RECUERDA: Máximo 600 palabras. Calidad > cantidad.`
                }
            ]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'text/plain' }
    };

    const resp = await axios.post(GEMINI_VISION_URL, body, { headers: { 'Content-Type': 'application/json' }, timeout: 90000 });
    let text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (text.length > 12000) {
        const cut = text.lastIndexOf('\n\n', 12000);
        text = cut > 0 ? text.substring(0, cut) : text.substring(0, 12000);
    }
    return text;
}

// ─── Evaluator ────────────────────────────────────────────────────────────────

async function evaluate(content: string, type: string): Promise<number | null> {
    if (!content || content.length < 100) return null;
    const prompt = `Evalúa este manual de electrodoméstico para huéspedes de apartamento turístico.
Aparato: ${type}

MANUAL:
${content.substring(0, 4000)}

Puntúa de 0-10 considerando:
- Practicidad (¿puede el huésped usarlo sin saber nada?)
- Concisión (¿es lo suficientemente corto para leer?)
- Cobertura de errores (¿cubre los problemas más comunes?)
- Precisión (¿describe controles reales, sin inventar?)

Responde SOLO con un número decimal entre 0 y 10. Sin texto adicional.`;

    try {
        const body = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
        };
        const resp = await axios.post(GEMINI_VISION_URL, body, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
        const raw = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const score = parseFloat(raw);
        return isNaN(score) ? null : score;
    } catch { return null; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });
    const reportLines: string[] = [`# Comparación V1 vs V2 con Visión Real\nFecha: ${new Date().toLocaleString('es-ES')}\n`];

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  COMPARACIÓN V1 vs V2 — ${imagePaths.length} imagen(es)`);
    console.log(`${'═'.repeat(70)}\n`);

    for (let i = 0; i < imagePaths.length; i++) {
        const imgPath = imagePaths[i];
        console.log(`\n[${i + 1}/${imagePaths.length}] Procesando: ${path.basename(imgPath)}`);

        if (!fs.existsSync(imgPath)) {
            console.log(`  ❌ Archivo no encontrado: ${imgPath}`);
            continue;
        }

        const imageBase64 = imageToBase64Part(imgPath);

        // Phase 1: Identify
        console.log(`  [PHASE1] Identificando...`);
        const t0 = Date.now();
        const identification = await identifyAppliance(imageBase64);
        const t0ms = Date.now() - t0;
        console.log(`  [PHASE1] ${JSON.stringify(identification)} (${t0ms}ms)`);

        if (!identification.scannable) {
            console.log(`  ⏭  No es un aparato escaneable. Saltando.`);
            reportLines.push(`## Imagen ${i + 1}: ${path.basename(imgPath)}\n**Resultado Phase 1:** No escaneable — ${(identification as any).reason || 'no es electrodoméstico'}\n`);
            continue;
        }

        const { appliance_type: type, brand, model } = identification as any;
        console.log(`  ✅ Identificado: ${type} (${brand} ${model})`);
        reportLines.push(`## Imagen ${i + 1}: ${path.basename(imgPath)}\n**Aparato:** ${type} | **Marca:** ${brand} | **Modelo:** ${model}\n`);

        // Phase 2: Generate V1
        console.log(`  [V1] Generando (sin límite)...`);
        const t1 = Date.now();
        const v1 = await generateV1(imageBase64, type, brand, model);
        const t1ms = Date.now() - t1;
        const v1words = v1.split(/\s+/).length;
        console.log(`  [V1] ✅ ${v1.length} chars | ${v1words} palabras | ${t1ms}ms`);

        // Phase 2: Generate V2
        console.log(`  [V2] Generando (máx 2048 tokens + 600 palabras)...`);
        const t2 = Date.now();
        const v2 = await generateV2(imageBase64, type, brand, model);
        const t2ms = Date.now() - t2;
        const v2words = v2.split(/\s+/).length;
        console.log(`  [V2] ✅ ${v2.length} chars | ${v2words} palabras | ${t2ms}ms`);

        // Evaluate
        console.log(`  [EVAL] Evaluando calidad...`);
        const [v1score, v2score] = await Promise.all([evaluate(v1, type), evaluate(v2, type)]);
        console.log(`  [EVAL] V1: ${v1score?.toFixed(1) ?? '—'}/10 | V2: ${v2score?.toFixed(1) ?? '—'}/10`);

        // Summary
        const delta = (v2score != null && v1score != null) ? (v2score - v1score).toFixed(1) : '—';
        const charDelta = v2.length - v1.length;
        console.log(`\n  ┌─────────────────────────────────────────┐`);
        console.log(`  │ RESUMEN ${type.padEnd(32)}│`);
        console.log(`  ├─────────────────────────────────────────┤`);
        console.log(`  │ Chars:    ${String(v1.length).padStart(6)} → ${String(v2.length).padStart(6)} (${charDelta >= 0 ? '+' : ''}${charDelta})`.padEnd(43) + '│');
        console.log(`  │ Palabras: ${String(v1words).padStart(6)} → ${String(v2words).padStart(6)}`.padEnd(43) + '│');
        console.log(`  │ Score:  ${(v1score?.toFixed(1) ?? '—').padStart(6)} → ${(v2score?.toFixed(1) ?? '—').padStart(6)} (Δ ${delta})`.padEnd(43) + '│');
        console.log(`  │ Tiempo:${String(t1ms + 'ms').padStart(7)} → ${String(t2ms + 'ms').padStart(7)}`.padEnd(43) + '│');
        console.log(`  └─────────────────────────────────────────┘`);

        reportLines.push(`### Métricas\n| | V1 | V2 | Δ |\n|--|--|--|--|\n| Chars | ${v1.length} | ${v2.length} | ${charDelta >= 0 ? '+' : ''}${charDelta} |\n| Palabras | ${v1words} | ${v2words} | ${v2words - v1words} |\n| Score | ${v1score?.toFixed(1) ?? '—'} | ${v2score?.toFixed(1) ?? '—'} | ${delta} |\n| Tiempo | ${t1ms}ms | ${t2ms}ms | — |\n`);
        reportLines.push(`### Manual V1\n\n${v1}\n\n---\n\n### Manual V2\n\n${v2}\n\n---\n`);
    }

    const outFile = path.join(__dirname, `results/vision-compare-${ts}.md`);
    fs.writeFileSync(outFile, reportLines.join('\n'), 'utf-8');
    console.log(`\n✅ Informe guardado: ${outFile}`);
}

main().catch(console.error);
