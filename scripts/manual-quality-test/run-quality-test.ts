/**
 * Hospyia Manual Quality Test
 *
 * Evalúa la calidad de los manuales V1 (existentes en DB) vs V2 (generados en este script).
 * Usa Gemini como evaluador con 6 dimensiones de calidad.
 *
 * Uso:
 *   npx tsx run-quality-test.ts --property <id>
 *   npx tsx run-quality-test.ts --property <id> --no-eval   (solo regenera, sin evaluar)
 *   npx tsx run-quality-test.ts --property <id> --limit 5   (solo primeros 5 manuales)
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../.env.stress") });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  outputDir: "./results",
  propertyId: getArg("--property") || "",
  limit: parseInt(getArg("--limit") || "0"),
  skipEval: hasFlag("--no-eval"),
  accessToken: process.env.TEST_ACCESS_TOKEN || "",
};

function getArg(name: string): string {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : "";
}
function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ManualRecord {
  id: string;
  appliance_name: string;
  brand: string;
  model: string;
  manual_content: string;
  metadata: any;
  created_at: string;
}

interface EvalResult {
  practical: number;
  concise: number;
  structure: number;
  error_coverage: number;
  rag_quality: number;
  no_hallucination: number;
  score: number;
  chars: number;
  justification: string;
}

interface ManualTestResult {
  manualId: string;
  applianceType: string;
  brand: string;
  model: string;
  v1Content: string;
  v2Content: string;
  v1Eval: EvalResult | null;
  v2Eval: EvalResult | null;
  v1Chars: number;
  v2Chars: number;
  estimatedV1Chunks: number;
  estimatedV2Chunks: number;
  error?: string;
}

// ─── Gemini evaluador ─────────────────────────────────────────────────────────

async function evaluateManualWithGemini(
  manualContent: string,
  applianceType: string,
  brand: string
): Promise<EvalResult | null> {
  if (!CONFIG.geminiApiKey) {
    console.warn("[EVAL] No GEMINI_API_KEY, skipping evaluation");
    return null;
  }

  const prompt = `Evalúa este manual de aparato para huéspedes de apartamento turístico.
Devuelve EXCLUSIVAMENTE JSON válido, sin texto adicional, con estas puntuaciones 0-10:

{
  "practical": <número>,
  "concise": <número>,
  "structure": <número>,
  "error_coverage": <número>,
  "rag_quality": <número>,
  "no_hallucination": <número>,
  "score": <número>,
  "chars": <número>,
  "justification": "<texto>"
}

CRITERIOS:
- practical (0-10): ¿Es útil para alguien que nunca usó el aparato? ¿Explica cómo usarlo paso a paso?
- concise (0-10): ¿Es conciso sin información redundante? Penaliza manuales >8000 chars o con relleno
- structure (0-10): ¿Tiene secciones claras (encendido, programas, diagnóstico de problemas)?
- error_coverage (0-10): ¿Cubre errores y problemas comunes con solución práctica?
- rag_quality (0-10): ¿Está bien dividido en párrafos CORTOS que faciliten búsqueda? Penaliza duramente bloques >2000 chars sin saltos de párrafo (\`\`\`\\n\\n\`\`\`)
- no_hallucination (0-10): ¿Evita inventar funciones o botones que no existen en este tipo de aparato?
- score: Media ponderada: practical×0.30 + concise×0.20 + structure×0.15 + error_coverage×0.20 + rag_quality×0.10 + no_hallucination×0.05
- chars: longitud exacta del manual en caracteres
- justification: 1 frase breve sobre el punto más débil

MANUAL (${manualContent.length} chars):
---
${manualContent.substring(0, 15000)}
---
APARATO: ${applianceType} (${brand})`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(text);
    // Override chars with actual length
    parsed.chars = manualContent.length;
    return parsed as EvalResult;
  } catch (err: any) {
    console.error("[EVAL] Error:", err.message);
    return null;
  }
}

// ─── Generación V2 via API ────────────────────────────────────────────────────
// Llama a un endpoint dedicado para regenerar un manual con V2

async function regenerateManualV2(
  propertyId: string,
  manualId: string,
  accessToken: string
): Promise<string | null> {
  try {
    const url = `${CONFIG.baseUrl}/api/manual-quality/regenerate-v2`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ propertyId, manualId }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[REGEN-V2] HTTP ${response.status}: ${err.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    return data.content || null;
  } catch (err: any) {
    console.error("[REGEN-V2] Error:", err.message);
    return null;
  }
}

// ─── Fetch manuales existentes ────────────────────────────────────────────────

async function fetchManualsFromDB(
  propertyId: string,
  accessToken: string
): Promise<ManualRecord[]> {
  const url = `${CONFIG.baseUrl}/api/manual-quality/list?propertyId=${propertyId}`;
  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch manuals: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.manuals || [];
}

// ─── Estimación de chunks ─────────────────────────────────────────────────────

function estimateChunkCount(content: string, maxLength = 800): number {
  // Simula splitIntoChunks v2 (mejorado)
  const paragraphs = content.split("\n\n");
  let count = 0;
  let currentLen = 0;

  for (const para of paragraphs) {
    if (para.length > maxLength) {
      if (currentLen > 0) { count++; currentLen = 0; }
      const lines = para.split("\n");
      for (const line of lines) {
        if (currentLen + line.length > maxLength && currentLen > 0) {
          count++;
          currentLen = line.length;
        } else {
          currentLen += line.length + 1;
        }
      }
    } else if (currentLen + para.length > maxLength && currentLen > 0) {
      count++;
      currentLen = para.length;
    } else {
      currentLen += para.length + 2;
    }
  }
  if (currentLen > 0) count++;
  return count;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!CONFIG.propertyId) {
    console.error("❌ Usa: npx tsx run-quality-test.ts --property <propertyId>");
    process.exit(1);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  MANUAL QUALITY TEST — Property: ${CONFIG.propertyId}`);
  console.log(`${"═".repeat(60)}\n`);

  if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);

  // 1. Fetch manuales existentes (V1)
  console.log("[1/4] Fetching existing manuals from DB...");
  let manuals: ManualRecord[];
  try {
    manuals = await fetchManualsFromDB(CONFIG.propertyId, CONFIG.accessToken);
  } catch (err: any) {
    console.error("❌ Error fetching manuals:", err.message);
    process.exit(1);
  }

  if (CONFIG.limit > 0) {
    manuals = manuals.slice(0, CONFIG.limit);
  }

  console.log(`   Found ${manuals.length} manuals`);

  // 2. Regenerar con V2
  console.log(`\n[2/4] Regenerating ${manuals.length} manuals with V2...`);
  const results: ManualTestResult[] = [];

  for (let i = 0; i < manuals.length; i++) {
    const m = manuals[i];
    console.log(`  [${i + 1}/${manuals.length}] ${m.appliance_name} (${m.brand || "?"})`);

    const result: ManualTestResult = {
      manualId: m.id,
      applianceType: m.appliance_name,
      brand: m.brand || "",
      model: m.model || "",
      v1Content: m.manual_content,
      v2Content: "",
      v1Eval: null,
      v2Eval: null,
      v1Chars: m.manual_content?.length || 0,
      v2Chars: 0,
      estimatedV1Chunks: estimateChunkCount(m.manual_content || ""),
      estimatedV2Chunks: 0,
    };

    try {
      const v2Content = await regenerateManualV2(CONFIG.propertyId, m.id, CONFIG.accessToken);
      if (v2Content) {
        result.v2Content = v2Content;
        result.v2Chars = v2Content.length;
        result.estimatedV2Chunks = estimateChunkCount(v2Content);
        console.log(`     V1: ${result.v1Chars} chars (${result.estimatedV1Chunks} chunks) | V2: ${result.v2Chars} chars (${result.estimatedV2Chunks} chunks)`);
      } else {
        result.error = "V2 generation returned null";
        console.warn(`     ⚠️  V2 generation failed`);
      }
    } catch (err: any) {
      result.error = err.message;
      console.error(`     ❌ Error: ${err.message}`);
    }

    results.push(result);
  }

  // 3. Evaluar con Gemini
  if (!CONFIG.skipEval && CONFIG.geminiApiKey) {
    console.log(`\n[3/4] Evaluating manuals with Gemini...`);
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      console.log(`  [${i + 1}/${results.length}] Evaluating ${r.applianceType}...`);

      if (r.v1Content && r.v1Content.length >= 100) {
        r.v1Eval = await evaluateManualWithGemini(r.v1Content, r.applianceType, r.brand);
        if (r.v1Eval?.score != null) console.log(`     V1 score: ${r.v1Eval.score.toFixed(1)}/10`);
        else if (r.v1Eval) { r.v1Eval = null; console.log(`     V1: evaluación inválida (sin score)`); }
        await new Promise(res => setTimeout(res, 500)); // throttle
      }

      if (r.v2Content && r.v2Content.length >= 100) {
        r.v2Eval = await evaluateManualWithGemini(r.v2Content, r.applianceType, r.brand);
        if (r.v2Eval?.score != null) console.log(`     V2 score: ${r.v2Eval.score.toFixed(1)}/10`);
        else if (r.v2Eval) { r.v2Eval = null; console.log(`     V2: evaluación inválida (sin score)`); }
        await new Promise(res => setTimeout(res, 500));
      }
    }
  } else {
    console.log("\n[3/4] Skipping evaluation (--no-eval or no GEMINI_API_KEY)");
  }

  // 4. Guardar resultados
  console.log(`\n[4/4] Saving results...`);
  const outputFile = path.join(CONFIG.outputDir, `quality-${ts}.json`);
  const output = {
    timestamp: new Date().toISOString(),
    propertyId: CONFIG.propertyId,
    totalManuals: results.length,
    results,
  };
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`   Saved: ${outputFile}`);

  // 5. Resumen rápido
  const evaluated = results.filter(r => r.v1Eval?.score != null && r.v2Eval?.score != null);
  if (evaluated.length > 0) {
    const avgV1Score = evaluated.reduce((s, r) => s + r.v1Eval!.score, 0) / evaluated.length;
    const avgV2Score = evaluated.reduce((s, r) => s + r.v2Eval!.score, 0) / evaluated.length;
    const avgV1Chars = results.reduce((s, r) => s + r.v1Chars, 0) / results.length;
    const avgV2Chars = results.filter(r => r.v2Chars > 0).reduce((s, r) => s + r.v2Chars, 0) / results.filter(r => r.v2Chars > 0).length;

    console.log(`\n${"═".repeat(60)}`);
    console.log(`  RESUMEN`);
    console.log(`${"═".repeat(60)}`);
    console.log(`  Score medio    : ${avgV1Score.toFixed(1)} → ${avgV2Score.toFixed(1)}  (${avgV2Score > avgV1Score ? "▲" : "▼"} ${Math.abs(avgV2Score - avgV1Score).toFixed(1)})`);
    console.log(`  Chars medio    : ${Math.round(avgV1Chars)} → ${Math.round(avgV2Chars)}  (${avgV2Chars < avgV1Chars ? "-" : "+"}${Math.abs(Math.round(avgV2Chars - avgV1Chars))})`);
    console.log(`${"═".repeat(60)}\n`);
  }

  console.log(`\n✅ Done. Run compare-manual-quality.js <file> to see full report.`);
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
