/**
 * Comparación directa V1 vs V2 para un aparato específico.
 * Llama a Gemini REST directamente sin Next.js.
 * Uso: npx tsx compare-v1-v2.ts [tipo] [marca] [modelo]
 * Ejemplo: npx tsx compare-v1-v2.ts "AIRE ACONDICIONADO" "WELLCLIMA" "Universal A/C"
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env.stress') });

const GEMINI_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const args = process.argv.slice(2);
const APPLIANCE_TYPE = args[0] || 'AIRE ACONDICIONADO';
const BRAND = args[1] || 'WELLCLIMA';
const MODEL = args[2] || 'Universal A/C Remote';

// ─── Gemini REST helper ───────────────────────────────────────────────────────

async function callGemini(systemInstruction: string, userPrompt: string, maxTokens: number): Promise<string> {
    const body = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
            temperature: 0.25,
            maxOutputTokens: maxTokens,
            responseMimeType: 'text/plain',
        },
    };

    const resp = await axios.post(GEMINI_URL, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000,
    });

    return resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildV1Prompts(type: string, brand: string, model: string): { system: string; user: string } {
    const system = `Eres un experto en electrodomésticos que crea manuales de uso PRÁCTICOS para huéspedes de apartamentos turísticos.

REGLAS DE ORO:
1. Empieza directamente con el título h1 (ej: # Guía de Uso: Horno Balay)
2. NO escribas preámbulos ni repeticiones
3. Usa markdown limpio (sin bloques de código)
4. NUNCA describas controles de forma abstracta — describe cada función con su nombre
5. Para cada programa/modo, describe el SÍMBOLO o ICONO visible en el panel

FORMATO OBLIGATORIO:
- Título: # Guía de Uso: [Tipo] [Marca si la conoces]
- Secciones: Primeros Pasos / Programas y Funciones / Diagnóstico de Problemas / Consejos Útiles

REQUISITOS ESPECÍFICOS PARA AIRE ACONDICIONADO:
- Modos principales (frío, calor, ventilación, auto) y PARA QUÉ
- Cómo usar el mando a distancia
- Temperatura recomendada: 24-25°C
- Timer/programación si lo tiene

SECCIÓN "Diagnóstico de Problemas" (OBLIGATORIA):
- Tabla markdown: | Código/Señal | Significado | Solución |
- Incluye todos los errores conocidos

PROHIBIDO:
- Inventar funciones que no existen
- Mencionar la imagen`;

    const user = `Genera un manual COMPLETO Y DETALLADO para este electrodoméstico.

DATOS:
- Tipo: ${type}
- Marca: ${brand}
- Modelo: ${model}

El mando tiene los siguientes botones visibles:
- Botón POWER (naranja)
- MODE (icono cuadrado), FAN (icono ventilador)
- TEMP ▲ y TEMP ▼ (subir/bajar temperatura)
- A.SWING (balanceo vertical automático), M.SWING (balanceo manual)
- Botón central con icono luz/display
- Fila inferior: ❄ (frío), ♨ (calor), C (Celsius), H (heating?)
- SET (verde), ON (timer encendido), TIME, OFF (timer apagado)
- Botón con icono de ondas (ventilación/sleep?)
- Pantalla LCD arriba mostrando "4:15" y "DOUBLE" y zona 1-2`;

    return { system, user };
}

function buildV2Prompts(type: string, brand: string, model: string): { system: string; user: string } {
    const system = `Eres un experto en electrodomésticos que crea manuales de uso PRÁCTICOS para huéspedes de apartamentos turísticos.

IDENTIDAD Y TONO:
- Idioma: Español (España)
- Tono: Profesional pero amigable
- Audiencia: Huéspedes que nunca han visto este aparato

REGLAS DE ORO:
1. Empieza directamente con el título h1 (ej: # Guía de Uso: Horno Balay)
2. NO escribas preámbulos ni repeticiones
3. Usa markdown limpio (sin bloques de código)
4. NUNCA describas controles de forma abstracta — describe cada función con su nombre
5. Para cada programa/modo, describe el SÍMBOLO o ICONO visible en el panel
6. ⚠️ LÍMITE ESTRICTO: máximo 600 palabras en total. Sé conciso y directo.

FORMATO OBLIGATORIO:
- Título: # Guía de Uso: [Tipo] [Marca si la conoces]
- 3-4 secciones: Primeros Pasos / Programas y Funciones / Diagnóstico de Problemas / Consejos Útiles
- Cada sección: máximo 5-6 puntos

REQUISITOS ESPECÍFICOS PARA AIRE ACONDICIONADO:
- Modos principales (frío, calor, ventilación, auto) y PARA QUÉ
- Cómo usar el mando a distancia
- Temperatura recomendada: 24-25°C
- Timer/programación si lo tiene

SECCIÓN "Diagnóstico de Problemas" (OBLIGATORIA):
- Tabla markdown: | Código/Señal | Significado | Solución |
- Máximo 8-10 códigos de error más frecuentes
- Al final: "Si el problema persiste, contacta con el personal de soporte"

PROHIBIDO:
- Inventar funciones o botones que no existen
- Decir "no tengo información"
- Repetir información ya escrita`;

    const user = `Genera un manual de uso PRÁCTICO y CONCISO para este electrodoméstico.

DATOS DEL APARATO:
- Tipo: ${type}
- Marca: ${brand}
- Modelo (solo referencia, NO pongas en el manual): ${model}

El mando tiene los siguientes botones visibles:
- Botón POWER (naranja)
- MODE (icono cuadrado), FAN (icono ventilador)
- TEMP ▲ y TEMP ▼ (subir/bajar temperatura)
- A.SWING (balanceo vertical automático), M.SWING (balanceo manual)
- Botón central con icono luz/display
- Fila inferior: ❄ (frío forzado), ♨ (calor forzado), C, H
- SET (verde), ON (timer encendido), TIME, OFF (timer apagado)
- Botón con icono de ondas (sleep/silencio)
- Pantalla LCD mostrando hora y modo DOUBLE (controla 2 unidades)

⚠️ Sin manual oficial. Usa conocimiento general sobre ${type} de la marca ${brand}.
⚠️ Sin códigos específicos. Incluye los 5-6 problemas más comunes para ${type}.

RECUERDA: Máximo 600 palabras. Calidad > cantidad.`;

    return { system, user };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  COMPARACIÓN V1 vs V2`);
    console.log(`  Aparato: ${APPLIANCE_TYPE} | Marca: ${BRAND} | Modelo: ${MODEL}`);
    console.log(`${'═'.repeat(70)}\n`);

    const v1 = buildV1Prompts(APPLIANCE_TYPE, BRAND, MODEL);
    const v2 = buildV2Prompts(APPLIANCE_TYPE, BRAND, MODEL);

    console.log('Generando V1 (sin límite de tokens)...');
    const t1 = Date.now();
    const v1Text = await callGemini(v1.system, v1.user, 6000);
    const t1ms = Date.now() - t1;

    console.log('Generando V2 (máx 2048 tokens + 600 palabras)...');
    const t2 = Date.now();
    const v2Text = await callGemini(v2.system, v2.user, 2048);
    const t2ms = Date.now() - t2;

    const v1Words = v1Text.split(/\s+/).length;
    const v2Words = v2Text.split(/\s+/).length;

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  MÉTRICAS`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`  V1: ${v1Text.length} chars | ${v1Words} palabras | ${t1ms}ms`);
    console.log(`  V2: ${v2Text.length} chars | ${v2Words} palabras | ${t2ms}ms`);
    console.log(`  Reducción: ${Math.round((1 - v2Text.length / v1Text.length) * 100)}% menos chars`);

    // Guardar resultados
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outFile = path.join(__dirname, `results/compare-${ts}.md`);
    fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });

    const report = `# Comparación V1 vs V2 — ${APPLIANCE_TYPE} ${BRAND}
Fecha: ${new Date().toLocaleString('es-ES')}

## Métricas
| | V1 | V2 | Δ |
|--|--|--|--|
| Chars | ${v1Text.length} | ${v2Text.length} | ${v2Text.length - v1Text.length} |
| Palabras | ${v1Words} | ${v2Words} | ${v2Words - v1Words} |
| Tiempo | ${t1ms}ms | ${t2ms}ms | — |

---

## V1 (sin límite)

${v1Text}

---

## V2 (≤600 palabras)

${v2Text}
`;

    fs.writeFileSync(outFile, report, 'utf-8');
    console.log(`\n✅ Guardado: ${outFile}`);

    console.log(`\n${'═'.repeat(70)}`);
    console.log('  MANUAL V1');
    console.log(`${'═'.repeat(70)}\n`);
    console.log(v1Text);

    console.log(`\n${'═'.repeat(70)}`);
    console.log('  MANUAL V2');
    console.log(`${'═'.repeat(70)}\n`);
    console.log(v2Text);
}

main().catch(console.error);
