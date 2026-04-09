#!/usr/bin/env node
/**
 * compare-manual-quality.js
 *
 * Genera un informe comparativo V1 vs V2 a partir del JSON de run-quality-test.ts
 *
 * Uso:
 *   node compare-manual-quality.js results/quality-2026-04-08T...json
 */

const fs = require("fs");
const path = require("path");

const file = process.argv[2];
if (!file) {
  console.error("Uso: node compare-manual-quality.js <results-file.json>");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf-8"));
const results = data.results || [];
const ts = new Date(data.timestamp).toLocaleString("es-ES");

const W = 70;
const line = "═".repeat(W);
const dash = "─".repeat(W);

console.log(`\n${line}`);
console.log(`  INFORME CALIDAD MANUALES: V1 vs V2`);
console.log(`  ${ts}  —  Propiedad: ${data.propertyId}`);
console.log(`${line}\n`);

// ─── Métricas globales ──────────────────────────────────────────────────────

const evaluated = results.filter((r) => r.v1Eval && r.v2Eval);
const withV2 = results.filter((r) => r.v2Chars > 0);

const avg = (arr, fn) => arr.length ? arr.reduce((s, r) => s + fn(r), 0) / arr.length : 0;

const avgV1Score = avg(evaluated, (r) => r.v1Eval.score);
const avgV2Score = avg(evaluated, (r) => r.v2Eval.score);
const avgV1Chars = avg(results, (r) => r.v1Chars);
const avgV2Chars = avg(withV2, (r) => r.v2Chars);
const avgV1Chunks = avg(results, (r) => r.estimatedV1Chunks);
const avgV2Chunks = avg(withV2, (r) => r.estimatedV2Chunks);

const dim = (label, v1, v2, higherIsBetter = true) => {
  const better = higherIsBetter ? v2 > v1 : v2 < v1;
  const icon = v2 === v1 ? " " : better ? "▲" : "▼";
  const delta = v2 - v1;
  const sign = delta >= 0 ? "+" : "";
  return `  ${label.padEnd(22)} ${String(v1.toFixed ? v1.toFixed(1) : Math.round(v1)).padStart(8)}  →  ${String(v2.toFixed ? v2.toFixed(1) : Math.round(v2)).padStart(8)}  ${icon}  (${sign}${delta.toFixed ? delta.toFixed(1) : Math.round(delta)})`;
};

console.log(`┌${"─".repeat(W - 2)}┐`);
console.log(`│ ${"Métrica".padEnd(22)}  ${"V1".padStart(8)}     ${"V2".padStart(8)}  Δ`.padEnd(W - 1) + "│");
console.log(`├${"─".repeat(W - 2)}┤`);
if (evaluated.length > 0) {
  console.log(dim("Score medio", avgV1Score, avgV2Score));
}
console.log(dim("Chars medio", avgV1Chars, avgV2Chars, false));
console.log(dim("Chunks estimados", avgV1Chunks, avgV2Chunks));
console.log(`└${"─".repeat(W - 2)}┘`);

// ─── Scores por dimensión ────────────────────────────────────────────────────

if (evaluated.length > 0) {
  const dims = ["practical", "concise", "structure", "error_coverage", "rag_quality", "no_hallucination"];
  const dimLabels = {
    practical: "Practicidad",
    concise: "Concisión",
    structure: "Estructura",
    error_coverage: "Cobertura errores",
    rag_quality: "Calidad RAG",
    no_hallucination: "Sin alucinaciones",
  };

  console.log(`\n  SCORES POR DIMENSIÓN`);
  console.log(`  ${dash.substring(0, 60)}`);
  console.log(`  ${"Dimensión".padEnd(22)} ${"V1".padStart(6)} ${"V2".padStart(6)} ${"Δ".padStart(6)}`);
  console.log(`  ${dash.substring(0, 60)}`);

  for (const d of dims) {
    const v1 = avg(evaluated, (r) => r.v1Eval[d] || 0);
    const v2 = avg(evaluated, (r) => r.v2Eval[d] || 0);
    const delta = v2 - v1;
    const icon = Math.abs(delta) >= 1.5 ? (delta > 0 ? " ▲" : " ▼") : "  ";
    console.log(`  ${dimLabels[d].padEnd(22)} ${v1.toFixed(1).padStart(6)} ${v2.toFixed(1).padStart(6)} ${(delta >= 0 ? "+" : "") + delta.toFixed(1).padStart(5)}${icon}`);
  }
}

// ─── Por aparato ─────────────────────────────────────────────────────────────

console.log(`\n  MANUALES — DETALLE`);
console.log(`  ${dash.substring(0, 65)}`);
console.log(`  ${"Aparato".padEnd(28)} ${"V1".padStart(5)} ${"V2".padStart(5)} ${"Δ".padStart(5)}  ${"Chars V1".padStart(9)} ${"Chars V2".padStart(9)}`);
console.log(`  ${dash.substring(0, 65)}`);

const sorted = [...results].sort((a, b) => {
  const da = (a.v2Eval?.score || 0) - (a.v1Eval?.score || 0);
  const db = (b.v2Eval?.score || 0) - (b.v1Eval?.score || 0);
  return db - da;
});

for (const r of sorted) {
  const name = `${r.applianceType} (${r.brand || "?"})`.substring(0, 27);
  const v1Score = r.v1Eval ? r.v1Eval.score.toFixed(1) : "—";
  const v2Score = r.v2Eval ? r.v2Eval.score.toFixed(1) : "—";
  const delta = r.v1Eval && r.v2Eval ? (r.v2Eval.score - r.v1Eval.score).toFixed(1) : "—";
  const sign = r.v1Eval && r.v2Eval ? (r.v2Eval.score >= r.v1Eval.score ? "+" : "") : "";
  const icon = r.v1Eval && r.v2Eval
    ? (r.v2Eval.score - r.v1Eval.score >= 1.5 ? " ▲" : r.v2Eval.score - r.v1Eval.score <= -1.5 ? " ▼" : "  ")
    : "  ";
  const charsV2 = r.v2Chars > 0 ? r.v2Chars.toString() : "—";
  console.log(`  ${name.padEnd(28)} ${String(v1Score).padStart(5)} ${String(v2Score).padStart(5)} ${(sign + delta).padStart(5)}${icon} ${r.v1Chars.toString().padStart(9)} ${charsV2.padStart(9)}`);
}

// ─── Mejoras y regresiones ────────────────────────────────────────────────────

const improvements = evaluated.filter(r => r.v2Eval.score - r.v1Eval.score >= 1.5);
const regressions = evaluated.filter(r => r.v2Eval.score - r.v1Eval.score <= -1.5);

if (improvements.length > 0) {
  console.log(`\n  MEJORAS SIGNIFICATIVAS (Δ ≥ +1.5)`);
  console.log(`  ${dash.substring(0, 60)}`);
  for (const r of improvements) {
    const delta = (r.v2Eval.score - r.v1Eval.score).toFixed(1);
    console.log(`\n  [${r.applianceType}] +${delta} pts  (${r.v1Eval.score.toFixed(1)} → ${r.v2Eval.score.toFixed(1)})`);
    console.log(`  Chars: ${r.v1Chars} → ${r.v2Chars}  |  Chunks: ${r.estimatedV1Chunks} → ${r.estimatedV2Chunks}`);
    if (r.v1Eval.justification) console.log(`  V1 débil: ${r.v1Eval.justification}`);
    if (r.v2Eval.justification) console.log(`  V2 débil: ${r.v2Eval.justification}`);
  }
}

if (regressions.length > 0) {
  console.log(`\n  ⚠️  REGRESIONES (Δ ≤ -1.5)`);
  console.log(`  ${dash.substring(0, 60)}`);
  for (const r of regressions) {
    const delta = (r.v2Eval.score - r.v1Eval.score).toFixed(1);
    console.log(`\n  [${r.applianceType}] ${delta} pts  (${r.v1Eval.score.toFixed(1)} → ${r.v2Eval.score.toFixed(1)})`);
    if (r.v2Eval.justification) console.log(`  V2 débil: ${r.v2Eval.justification}`);
  }
}

// ─── Resumen ejecutivo ────────────────────────────────────────────────────────

console.log(`\n  RESUMEN EJECUTIVO`);
console.log(`  ${dash.substring(0, 60)}`);

if (evaluated.length > 0) {
  const scoreDelta = avgV2Score - avgV1Score;
  const verdict = scoreDelta >= 1.0 ? "✅ V2 MEJOR" : scoreDelta >= 0 ? "≈ SIMILAR" : "⚠️  V2 PEOR";
  console.log(`  Score medio    : ${avgV1Score.toFixed(1)} → ${avgV2Score.toFixed(1)}  (${scoreDelta >= 0 ? "+" : ""}${scoreDelta.toFixed(1)})  ${verdict}`);
}

const charsDelta = avgV2Chars - avgV1Chars;
const sizeVerdict = charsDelta <= -5000 ? "✅ MUCHO MÁS COMPACTO" : charsDelta <= 0 ? "✅ MÁS COMPACTO" : "⚠️  MÁS LARGO";
console.log(`  Tamaño medio   : ${Math.round(avgV1Chars)} → ${Math.round(avgV2Chars)} chars  ${sizeVerdict}`);

const chunksDelta = avgV2Chunks - avgV1Chunks;
const chunkVerdict = chunksDelta >= 3 ? "✅ MEJOR RAG" : chunksDelta >= 0 ? "≈ SIMILAR RAG" : "⚠️  PEOR RAG";
console.log(`  Chunks medio   : ${avgV1Chunks.toFixed(1)} → ${avgV2Chunks.toFixed(1)}  ${chunkVerdict}`);
console.log(`  Mejoras        : ${improvements.length} manuales`);
console.log(`  Regresiones    : ${regressions.length} manuales`);
console.log(`  Sin V2         : ${results.length - withV2.length} manuales (error de generación)`);

console.log(`\n${line}\n`);
