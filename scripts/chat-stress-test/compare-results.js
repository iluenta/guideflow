/**
 * GuideFlow Chat — Comparador de resultados v1 vs v2
 *
 * Uso:
 *   node compare-results.js <results-v1.json> <results-v2.json>
 */

const fs = require('fs');
const path = require('path');

const [,, v1Path, v2Path] = process.argv;

if (!v1Path || !v2Path) {
    console.error('Uso: node compare-results.js <results-v1.json> <results-v2.json>');
    process.exit(1);
}

const v1Results = JSON.parse(fs.readFileSync(v1Path, 'utf8'));
const v2Results = JSON.parse(fs.readFileSync(v2Path, 'utf8'));

// ─── Indexar por scenario_id ───────────────────────────────────────────────────
const v1Map = {};
for (const r of v1Results) v1Map[r.scenario_id] = r;

const v2Map = {};
for (const r of v2Results) v2Map[r.scenario_id] = r;

const allIds = new Set([...Object.keys(v1Map), ...Object.keys(v2Map)]);

// ─── Métricas globales ─────────────────────────────────────────────────────────
function globalMetrics(results) {
    const total = results.length;
    const success = results.filter(r => r.status === 'success').length;
    const errors = results.filter(r => r.status === 'error').length;
    const timeouts = results.filter(r => r.status === 'timeout').length;
    const withScore = results.filter(r => r.eval_score !== undefined && r.eval_score !== null);
    const avgScore = withScore.length
        ? (withScore.reduce((a, r) => a + r.eval_score, 0) / withScore.length).toFixed(2)
        : 'N/A';
    const avgTime = Math.round(results.reduce((a, r) => a + r.response_time_ms, 0) / total);
    const hallucinated = results.filter(r => r.eval_hallucinated === true).length;
    const unsafe = results.filter(r => r.eval_safe === false).length;
    const helpful = results.filter(r => r.eval_helpful === true).length;
    return { total, success, errors, timeouts, avgScore, avgTime, hallucinated, unsafe, helpful };
}

// ─── Métricas por categoría ────────────────────────────────────────────────────
function byCategory(results) {
    const cats = {};
    for (const r of results) {
        const cat = r.category_id;
        if (!cats[cat]) cats[cat] = { label: r.category_label, scores: [], times: [], errors: 0, hallucinated: 0 };
        if (r.eval_score !== undefined && r.eval_score !== null) cats[cat].scores.push(r.eval_score);
        cats[cat].times.push(r.response_time_ms);
        if (r.status !== 'success') cats[cat].errors++;
        if (r.eval_hallucinated) cats[cat].hallucinated++;
    }
    return cats;
}

// ─── Diferencias por escenario ─────────────────────────────────────────────────
const improvements = [];
const regressions = [];
const newErrors = [];    // v1 OK, v2 error
const fixedErrors = [];  // v1 error, v2 OK
const tied = [];

for (const id of allIds) {
    const r1 = v1Map[id];
    const r2 = v2Map[id];

    if (!r1 || !r2) continue; // solo escenarios presentes en ambas versiones

    // Errores
    if (r1.status === 'success' && r2.status !== 'success') {
        newErrors.push({ id, r1, r2 });
        continue;
    }
    if (r1.status !== 'success' && r2.status === 'success') {
        fixedErrors.push({ id, r1, r2 });
        continue;
    }

    if (r1.eval_score === undefined || r2.eval_score === undefined) continue;

    const delta = r2.eval_score - r1.eval_score;
    if (delta >= 1.5) improvements.push({ id, r1, r2, delta });
    else if (delta <= -1.5) regressions.push({ id, r1, r2, delta });
    else tied.push({ id, r1, r2, delta });
}

improvements.sort((a, b) => b.delta - a.delta);
regressions.sort((a, b) => a.delta - b.delta);

// ─── Imprimir informe ──────────────────────────────────────────────────────────
const SEP = '═'.repeat(70);
const sep = '─'.repeat(70);

const m1 = globalMetrics(v1Results);
const m2 = globalMetrics(v2Results);

console.log('\n' + SEP);
console.log('  INFORME COMPARATIVO: Chat v1 vs Chat v2');
console.log('  ' + new Date().toLocaleString('es-ES'));
console.log(SEP);

console.log('\n┌─────────────────────────────┬──────────────┬──────────────┐');
console.log('│ Métrica                     │    V1        │    V2        │');
console.log('├─────────────────────────────┼──────────────┼──────────────┤');

function row(label, v1val, v2val, higherIsBetter = true) {
    const v1s = String(v1val).padEnd(12);
    const v2s = String(v2val).padEnd(12);
    let indicator = '';
    const n1 = parseFloat(v1val);
    const n2 = parseFloat(v2val);
    if (!isNaN(n1) && !isNaN(n2)) {
        if (n2 > n1) indicator = higherIsBetter ? ' ▲' : ' ▼';
        else if (n2 < n1) indicator = higherIsBetter ? ' ▼' : ' ▲';
    }
    console.log(`│ ${label.padEnd(27)} │ ${v1s} │ ${v2s}${indicator.padEnd(12)} │`);
}

row('Total tests',     m1.total,       m2.total);
row('Éxito',           m1.success,     m2.success);
row('Errores',         m1.errors,      m2.errors,      false);
row('Timeouts',        m1.timeouts,    m2.timeouts,    false);
row('Score medio',     m1.avgScore,    m2.avgScore);
row('Tiempo medio (ms)', m1.avgTime,   m2.avgTime,     false);
row('Respuestas útiles', m1.helpful,   m2.helpful);
row('Alucinaciones',   m1.hallucinated, m2.hallucinated, false);
row('Inseguros',       m1.unsafe,      m2.unsafe,      false);

console.log('└─────────────────────────────┴──────────────┴──────────────┘');

// ─── Por categoría ─────────────────────────────────────────────────────────────
const cats1 = byCategory(v1Results);
const cats2 = byCategory(v2Results);
const allCats = new Set([...Object.keys(cats1), ...Object.keys(cats2)]);

console.log('\n  SCORES POR CATEGORÍA');
console.log('  ' + sep);
console.log(`  ${'Categoría'.padEnd(38)} ${'V1'.padStart(6)} ${'V2'.padStart(6)}  ${'Δ'.padStart(6)}  Hal v1/v2`);
console.log('  ' + sep);

for (const cat of allCats) {
    const c1 = cats1[cat];
    const c2 = cats2[cat];
    const label = (c1?.label || c2?.label || cat).slice(0, 37).padEnd(38);

    const avg1 = c1?.scores.length
        ? (c1.scores.reduce((a, b) => a + b, 0) / c1.scores.length).toFixed(1)
        : '—  ';
    const avg2 = c2?.scores.length
        ? (c2.scores.reduce((a, b) => a + b, 0) / c2.scores.length).toFixed(1)
        : '—  ';

    const delta = (!isNaN(avg1) && !isNaN(avg2))
        ? (parseFloat(avg2) - parseFloat(avg1)).toFixed(1)
        : '—  ';
    const deltaStr = delta !== '—  '
        ? (parseFloat(delta) > 0 ? `+${delta}` : `${delta}`).padStart(6)
        : '—  '.padStart(6);
    const indicator = delta !== '—  '
        ? (parseFloat(delta) >= 1.5 ? ' ▲' : parseFloat(delta) <= -1.5 ? ' ▼' : '  ')
        : '  ';

    const hal1 = c1?.hallucinated ?? 0;
    const hal2 = c2?.hallucinated ?? 0;

    console.log(`  ${label} ${String(avg1).padStart(6)} ${String(avg2).padStart(6)} ${deltaStr}${indicator}    ${hal1}/${hal2}`);
}

// ─── Mejoras y regresiones destacadas ─────────────────────────────────────────
if (improvements.length > 0) {
    console.log('\n  MEJORAS SIGNIFICATIVAS (Δ ≥ +1.5 puntos)');
    console.log('  ' + sep);
    for (const { id, r1, r2, delta } of improvements.slice(0, 10)) {
        console.log(`\n  [${id}] +${delta.toFixed(1)} pts  (${r1.eval_score} → ${r2.eval_score})`);
        console.log(`  Prompt : ${r1.prompt.slice(0, 80)}`);
        console.log(`  V1     : ${(r1.response || '').slice(0, 100).replace(/\n/g, ' ')}`);
        console.log(`  V2     : ${(r2.response || '').slice(0, 100).replace(/\n/g, ' ')}`);
        if (r2.eval_notes) console.log(`  Nota   : ${r2.eval_notes}`);
    }
}

if (regressions.length > 0) {
    console.log('\n  REGRESIONES SIGNIFICATIVAS (Δ ≤ -1.5 puntos)');
    console.log('  ' + sep);
    for (const { id, r1, r2, delta } of regressions.slice(0, 10)) {
        console.log(`\n  [${id}] ${delta.toFixed(1)} pts  (${r1.eval_score} → ${r2.eval_score})`);
        console.log(`  Prompt : ${r1.prompt.slice(0, 80)}`);
        console.log(`  V1     : ${(r1.response || '').slice(0, 100).replace(/\n/g, ' ')}`);
        console.log(`  V2     : ${(r2.response || '').slice(0, 100).replace(/\n/g, ' ')}`);
        if (r2.eval_notes) console.log(`  Nota   : ${r2.eval_notes}`);
    }
}

if (newErrors.length > 0) {
    console.log('\n  NUEVOS ERRORES EN V2 (funcionaban en v1)');
    console.log('  ' + sep);
    for (const { id, r1, r2 } of newErrors) {
        console.log(`  [${id}]  V2 status: ${r2.status}  error: ${r2.error || '—'}`);
        console.log(`         Prompt: ${r1.prompt.slice(0, 80)}`);
    }
}

if (fixedErrors.length > 0) {
    console.log('\n  ERRORES RESUELTOS EN V2');
    console.log('  ' + sep);
    for (const { id, r1, r2 } of fixedErrors) {
        console.log(`  [${id}]  V1 status: ${r1.status} → V2: OK`);
        console.log(`         Prompt: ${r1.prompt.slice(0, 80)}`);
    }
}

console.log('\n  RESUMEN EJECUTIVO');
console.log('  ' + sep);
const scoreDelta = (parseFloat(m2.avgScore) - parseFloat(m1.avgScore)).toFixed(2);
const timeDelta = m2.avgTime - m1.avgTime;
console.log(`  Score medio    : ${m1.avgScore} → ${m2.avgScore}  (${parseFloat(scoreDelta) >= 0 ? '+' : ''}${scoreDelta})`);
console.log(`  Tiempo medio   : ${m1.avgTime}ms → ${m2.avgTime}ms  (${timeDelta >= 0 ? '+' : ''}${timeDelta}ms)`);
console.log(`  Alucinaciones  : ${m1.hallucinated} → ${m2.hallucinated}  (${m2.hallucinated - m1.hallucinated >= 0 ? '+' : ''}${m2.hallucinated - m1.hallucinated})`);
console.log(`  Mejoras        : ${improvements.length} escenarios`);
console.log(`  Regresiones    : ${regressions.length} escenarios`);
console.log(`  Nuevos errores : ${newErrors.length}`);
console.log(`  Errores resueltos: ${fixedErrors.length}`);

// ─── Guardar informe como JSON ─────────────────────────────────────────────────
const reportPath = path.join(
    path.dirname(v1Path),
    `comparison-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`
);
fs.writeFileSync(reportPath, JSON.stringify({
    generated: new Date().toISOString(),
    v1: { file: v1Path, ...m1 },
    v2: { file: v2Path, ...m2 },
    improvements: improvements.map(x => ({ id: x.id, delta: x.delta, prompt: x.r1.prompt, v1_score: x.r1.eval_score, v2_score: x.r2.eval_score })),
    regressions: regressions.map(x => ({ id: x.id, delta: x.delta, prompt: x.r1.prompt, v1_score: x.r1.eval_score, v2_score: x.r2.eval_score, v2_response: x.r2.response?.slice(0, 200) })),
    newErrors,
    fixedErrors,
}, null, 2));
console.log(`\n  Informe guardado en: ${reportPath}`);
console.log('\n' + SEP + '\n');
