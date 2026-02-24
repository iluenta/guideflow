#!/usr/bin/env node
/**
 * Convierte TODOS los textos con ? corrupto a UTF-8 correcto en PropertySetupWizard.tsx.
 * Usa solo escapes Unicode en este script (ASCII) para no romper la codificacion.
 * Ejecutar: node scripts/fix-wizard-spanish-full.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'dashboard', 'PropertySetupWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// [patron con ?, reemplazo con \uXXXX para no usar bytes especiales en el script]
const pairs = [
  ['creaci?n', 'creaci\u00F3n'],
  ['direcci?n', 'direcci\u00F3n'],
  ['?ltima', '\u00FAltima'],
  ['posici?n', 'posici\u00F3n'],
  ['generaci?n', 'generaci\u00F3n'],
  ['int?ntalo', 'int\u00E9ntalo'],
  ['"?Manuales', '"\u00A1Manuales'],
  ['t?cnicos', 't\u00E9cnicos'],
  ['est?n', 'est\u00E1n'],
  ['gu?a', 'gu\u00EDa'],
  ['Gu?a', 'Gu\u00EDa'],
  ['a?adido', 'a\u00F1adido'],
  ['A?adir', 'A\u00F1adir'],
  ['Atenci?n', 'Atenci\u00F3n'],
  ['espec?fico', 'espec\u00EDfico'],
  ['Sanitizaci?n', 'Sanitizaci\u00F3n'],
  ['espec?fica', 'espec\u00EDfica'],
  ['tambi?n', 'tambi\u00E9n'],
  ['selecci?n', 'selecci\u00F3n'],
  ['dispar?', 'dispar\u00F3'],
  ['gu?as', 'gu\u00EDas'],
  ['ubicaci?n', 'ubicaci\u00F3n'],
  ['M?gica', 'M\u00E1gica'],
  ['M?vil', 'M\u00F3vil'],
  ['informaci?n', 'informaci\u00F3n'],
  ['Informaci?n', 'Informaci\u00F3n'],
  ['B?sica', 'B\u00E1sica'],
  ['B?sqica', 'B\u00E1sica'],
  ['panor?mico', 'panor\u00E1mico'],
  ['Hu?spedes', 'Hu\u00E9spedes'],
  ['hu?spedes', 'hu\u00E9spedes'],
  ['hu?sped', 'hu\u00E9sped'],
  ['Ba?os', 'Ba\u00F1os'],
  ['Descripci?n', 'Descripci\u00F3n'],
  ['descripci?n', 'descripci\u00F3n'],
  ['ayudar?', 'ayudar\u00E1'],
  ['autom?ticamente', 'autom\u00E1ticamente'],
  ['pesta?a', 'pesta\u00F1a'],
  ['Direcci?n', 'Direcci\u00F3n'],
  ['Din?micos', 'Din\u00E1micos'],
  ['T?tulo', 'T\u00EDtulo'],
  ['C?digo', 'C\u00F3digo'],
  ['Tel?fono', 'Tel\u00E9fono'],
  ['cajet?n', 'cajet\u00EDn'],
  ['Anfitri?n', 'Anfitri\u00F3n'],
  ['anfitri?n', 'anfitri\u00F3n'],
  ['n?meros', 'n\u00FAmeros'],
  ['n?mero', 'n\u00FAmero'],
  ['Antic?pate', 'Antic\u00EDpate'],
  ['c?mo', 'c\u00F3mo'],
  ['devolvi?', 'devolvi\u00F3'],
  ['categor?a', 'categor\u00EDa'],
  ['peque?as', 'peque\u00F1as'],
  ['mostrar?', 'mostrar\u00E1'],
  ['ajustar?', 'ajustar\u00E1'],
  ['armon?a', 'armon\u00EDa'],
  ['Tecnolog?a', 'Tecnolog\u00EDa'],
  ['conexi?n', 'conexi\u00F3n'],
  ['Ubicaci?n', 'Ubicaci\u00F3n'],
  ['est?', 'est\u00E1'],
  ['sal?n', 'sal\u00F3n'],
  ['detr?s', 'detr\u00E1s'],
  ['rein?cialo', 'rein\u00EDcialo'],
  ['desenchuf?ndolo', 'desenchuf\u00E1ndolo'],
  ['Dotaci?n', 'Dotaci\u00F3n'],
  ['configuraci?n', 'configuraci\u00F3n'],
  ['Secci?n', 'Secci\u00F3n'],
  ['Validaci?n', 'Validaci\u00F3n'],
  ['Regeneraci?n', 'Regeneraci\u00F3n'],
  ['Mar?a', 'Mar\u00EDa'],
  ['aqu?', 'aqu\u00ED'],
  ['ver?n', 'ver\u00E1n'],
  ['C?mo', 'C\u00F3mo'],
  ['m?s ', 'm\u00E1s '],
  ['m?s.', 'm\u00E1s.'],
  ['navegaci?n', 'navegaci\u00F3n'],
  ['N?mero', 'N\u00FAmero'],
  ['pa?s', 'pa\u00EDs'],
  ['precisi?n', 'precisi\u00F3n'],
  ['Espa?a', 'Espa\u00F1a'],
  ['m?gica', 'm\u00E1gica'],
  ['TECNOLOG?A', 'TECNOLOG\u00CDA'],
  ['Contrase?a', 'Contrase\u00F1a'],
  ['ESC?NER', 'ESC\u00C1NER'],
  ['actualizar?', 'actualizar\u00E1'],
];

let count = 0;
for (const [from, to] of pairs) {
  const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const before = content;
  content = content.replace(re, to);
  if (before !== content) count++;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('OK. Reemplazos aplicados. Archivo guardado en UTF-8.');
