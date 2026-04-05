const fs = require('fs');
const path = require('path');

const resultsPath = 'scripts/chat-stress-test/results/results-2026-04-05T12-30-15.json';
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// 1. Score <= 4 outside 'incoherent'
const lowScores = results.filter(r => r.eval_score <= 4 && r.category_id !== 'incoherent');
console.log('--- LOW SCORES (<= 4) EXCLUDING INCOHERENT ---');
lowScores.forEach(r => {
  console.log(`[${r.scenario_id}] [${r.category_id}] Score: ${r.eval_score}`);
  console.log(`   Prompt: ${r.prompt}`);
  console.log(`   Response: ${r.response.slice(0, 150)}...`);
  console.log(`   Notes: ${r.eval_notes}`);
  console.log('---');
});

// 2. Contradiction tests
const contradictions = results.filter(r => r.scenario_id.startsWith('con_'));
console.log('\n--- CONTRADICTION TESTS (con_*) ---');
contradictions.forEach(r => {
  console.log(`[${r.scenario_id}] Score: ${r.eval_score}`);
  console.log(`   Prompt: ${r.prompt}`);
  console.log(`   Response: ${r.response.slice(0, 150)}...`);
  console.log(`   Notes: ${r.eval_notes}`);
  console.log('---');
});

// 3. Arrival Category by Property
const arrivalTests = results.filter(r => r.category_id === 'arrival_transport');
const propStats = {};
arrivalTests.forEach(r => {
  if (!propStats[r.property_id]) propStats[r.property_id] = { name: r.property_name, count: 0, scores: [], totalTime: 0 };
  propStats[r.property_id].count++;
  propStats[r.property_id].scores.push(r.eval_score);
  propStats[r.property_id].totalTime += r.response_time_ms;
});

console.log('\n--- ARRIVAL CATEGORY BY PROPERTY ---');
Object.entries(propStats).forEach(([id, stats]) => {
  const avg = (stats.scores.reduce((a, b) => a + (b || 0), 0) / stats.scores.length).toFixed(1);
  console.log(`Property [${id}] - Name: ${stats.name} - Tests: ${stats.count} - Avg Score: ${avg}`);
});

// 4. Edge cases / Safety
const safetyTests = results.filter(r => r.category_id === 'prompt_injection');
const lowSafety = safetyTests.filter(r => r.eval_score < 10);
console.log('\n--- LOW SAFETY SCORES (< 10) ---');
lowSafety.forEach(r => {
  console.log(`[${r.scenario_id}] Score: ${r.eval_score}`);
  console.log(`   Prompt: ${r.prompt}`);
  console.log(`   Response: ${r.response.slice(0, 150)}...`);
  console.log(`   Notes: ${r.eval_notes}`);
  console.log('---');
});
