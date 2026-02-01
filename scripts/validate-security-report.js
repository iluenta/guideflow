/**
 * Script para validar y mostrar resumen del reporte de seguridad
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', 'documentacion', 'SECURITY_AUDIT.md');

console.log('\n=== VALIDACIÓN DEL REPORTE DE SEGURIDAD ===\n');

if (!fs.existsSync(reportPath)) {
  console.error('❌ El archivo de reporte no existe:', reportPath);
  process.exit(1);
}

const content = fs.readFileSync(reportPath, 'utf-8');
const stats = fs.statSync(reportPath);

console.log('✅ Archivo encontrado: documentacion/SECURITY_AUDIT.md');
console.log(`   Tamaño: ${stats.size} bytes`);
console.log(`   Líneas: ${content.split('\n').length}`);
console.log('');

// Contar vulnerabilidades
const criticalMatches = content.match(/#### \d+\./g) || [];
const highMatches = content.match(/### High \(Altas\)/g) || [];
const mediumMatches = content.match(/### Medium \(Medias\)/g) || [];
const lowMatches = content.match(/### Low \(Bajas\)/g) || [];

console.log('📊 Resumen de Vulnerabilidades:');
console.log(`   Critical: ${criticalMatches.length} vulnerabilidades`);
console.log(`   High: ${highMatches.length} categoría(s)`);
console.log(`   Medium: ${mediumMatches.length} categoría(s)`);
console.log(`   Low: ${lowMatches.length} categoría(s)`);
console.log('');

// Extraer lista de vulnerabilidades
const vulnerabilities = [];
const lines = content.split('\n');
let currentSeverity = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('### Critical')) {
    currentSeverity = '🔴 Critical';
  } else if (line.includes('### High')) {
    currentSeverity = '🟠 High';
  } else if (line.includes('### Medium')) {
    currentSeverity = '🟡 Medium';
  } else if (line.includes('### Low')) {
    currentSeverity = '🟢 Low';
  } else if (line.match(/^#### \d+\./)) {
    const title = line.replace(/^#### \d+\.\s*/, '').trim();
    vulnerabilities.push({ severity: currentSeverity, title });
  }
}

console.log('📋 Lista de Vulnerabilidades:');
vulnerabilities.forEach((vuln, index) => {
  console.log(`   ${index + 1}. [${vuln.severity}] ${vuln.title}`);
});
console.log('');

// Verificar secciones importantes
const sections = {
  'Resumen Ejecutivo': content.includes('## Resumen Ejecutivo'),
  'Vulnerabilidades Encontradas': content.includes('## Vulnerabilidades Encontradas'),
  'Áreas Bien Protegidas': content.includes('## Áreas Bien Protegidas'),
  'Recomendaciones Generales': content.includes('## Recomendaciones Generales'),
  'Plan de Acción Priorizado': content.includes('## Plan de Acción Priorizado'),
  'Tests de Seguridad': content.includes('## Tests de Seguridad Creados'),
};

console.log('✅ Secciones del Reporte:');
Object.entries(sections).forEach(([section, exists]) => {
  console.log(`   ${exists ? '✓' : '✗'} ${section}`);
});
console.log('');

console.log('📖 Para ver el reporte completo:');
console.log('   - En VS Code: code documentacion/SECURITY_AUDIT.md');
console.log('   - En el explorador: start documentacion/SECURITY_AUDIT.md');
console.log('   - O abrir manualmente: documentacion/SECURITY_AUDIT.md');
console.log('');

console.log('🧪 Para ejecutar los tests de seguridad:');
console.log('   npm run test:security');
console.log('');
