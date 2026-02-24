#!/usr/bin/env node
/**
 * Fix invalid UTF-8 in a file by reading as buffer and decoding with replacement.
 * Usage: node scripts/fix-utf8.js [file]
 * Default file: components/dashboard/PropertySetupWizard.tsx
 */

const fs = require('fs');
const path = require('path');

const file = path.resolve(
  process.cwd(),
  process.argv[2] || 'components/dashboard/PropertySetupWizard.tsx'
);

if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}

const buf = fs.readFileSync(file);
const decoder = new TextDecoder('utf-8', { fatal: false });
const decoded = decoder.decode(buf);

// Replace replacement chars (U+FFFD) with common Spanish fixes where we have mojibake
const replacements = [
  ['creaci\uFFFDn', 'creación'],
  ['creaci?n', 'creación'],
  ['direcci\uFFFDn', 'dirección'],
  ['direcci?n', 'dirección'],
  ['\uFFFDltima', 'última'],
  ['?ltima', 'última'],
  ['pesta\uFFFDa', 'pestaña'],
  ['pesta?a', 'pestaña'],
  ['Atenci\uFFFDn', 'Atención'],
  ['Atenci?n', 'Atención'],
  ['tambi\uFFFDn', 'también'],
  ['tambi?n', 'también'],
  ['ubicaci\uFFFDn', 'ubicación'],
  ['ubicaci?n', 'ubicación'],
  ['a\uFFFDadido', 'añadido'],
  ['a?adido', 'añadido'],
  ['a??adido', 'añadido'],
  ['Gu\uFFFDa', 'Guía'],
  ['Gu?a', 'Guía'],
  ['Gu??a', 'Guía'],
  ['M\uFFFDgica', 'Mágica'],
  ['M?gica', 'Mágica'],
  ['M??gica', 'Mágica'],
  ['informaci\uFFFDn', 'información'],
  ['informaci?n', 'información'],
  ['informaci??n', 'información'],
  ['hu\uFFFDspedes', 'huéspedes'],
  ['hu?spedes', 'huéspedes'],
  ['hu??spedes', 'huéspedes'],
  ['est\uFFFDn', 'están'],
  ['est?n', 'están'],
  ['est??n', 'están'],
  ['selecci\uFFFDn', 'selección'],
  ['selecci?n', 'selección'],
  ['gu\uFFFDas', 'guías'],
  ['gu?as', 'guías'],
  ['Tel\uFFFDfono', 'Teléfono'],
  ['Tel?fono', 'Teléfono'],
  ['T\uFFFDtulo', 'Título'],
  ['T?tulo', 'Título'],
  ['C\uFFFDdigo', 'Código'],
  ['C?digo', 'Código'],
  ['Anfitri\uFFFDn', 'Anfitrión'],
  ['Anfitri?n', 'Anfitrión'],
  ['n\uFFFDmeros', 'números'],
  ['n?meros', 'números'],
  ['Descripci\uFFFDn', 'Descripción'],
  ['Descripci?n', 'Descripción'],
  ['cajet\uFFFDn', 'cajetín'],
  ['cajet?n', 'cajetín'],
  ['Din\uFFFDmicos', 'Dinámicos'],
  ['Din?micos', 'Dinámicos'],
  ['A\uFFFDadir', 'Añadir'],
  ['A?adir', 'Añadir'],
  ['A??adir', 'Añadir'],
  ['m\uFFFDs', 'más'],
  ['m?s', 'más'],
  ['espec\uFFFDfico', 'específico'],
  ['espec?fico', 'específico'],
  ['Sanitizaci\uFFFDn', 'Sanitización'],
  ['Sanitizaci?n', 'Sanitización'],
  ['posici\uFFFDn', 'posición'],
  ['posici?n', 'posición'],
  ['dispar\uFFFD', 'disparó'],
  ['dispar?', 'disparó'],
  ['B\uFFFDsica', 'Básica'],
  ['B?sica', 'Básica'],
  ['panor\uFFFDmico', 'panorámico'],
  ['panor?mico', 'panorámico'],
  ['autom\uFFFDticamente', 'automáticamente'],
  ['autom?ticamente', 'automáticamente'],
  ['t\uFFFDcnicos', 'técnicos'],
  ['t?cnicos', 'técnicos'],
  ['generaci\uFFFDn', 'generación'],
  ['generaci?n', 'generación'],
  ['int\uFFFDntalo', 'inténtalo'],
  ['int?ntalo', 'inténtalo'],
  ['Tecnolog\uFFFDa', 'Tecnología'],
  ['Tecnolog?a', 'Tecnología'],
  ['conexi\uFFFDn', 'conexión'],
  ['conexi?n', 'conexión'],
  ['Contrase\uFFFDa', 'Contraseña'],
  ['Contrase?a', 'Contraseña'],
  ['Ubicaci\uFFFDn', 'Ubicación'],
  ['rein\uFFFDcialo', 'reinícialo'],
  ['rein?cialo', 'reinícialo'],
  ['desenchuf\uFFFDndolo', 'desenchufándolo'],
  ['mostrar\uFFFD', 'mostrará'],
  ['mostrar?', 'mostrará'],
  ['Dotaci\uFFFDn', 'Dotación'],
  ['Dotaci?n', 'Dotación'],
  ['actualizar\uFFFD', 'actualizará'],
  ['actualizar?', 'actualizará'],
  ['configuraci\uFFFDn', 'configuración'],
  ['configuraci?n', 'configuración'],
  ['Antic\uFFFDpate', 'Anticípate'],
  ['Antic?pate', 'Anticípate'],
  ['c\uFFFDmo', 'cómo'],
  ['c?mo', 'cómo'],
  ['Secci\uFFFDn', 'Sección'],
  ['Secci?n', 'Sección'],
  ['peque\uFFFDas', 'pequeñas'],
  ['peque?as', 'pequeñas'],
  ['armon\uFFFDa', 'armonía'],
  ['armon?a', 'armonía'],
  ['ajustar\uFFFD', 'ajustará'],
  ['ajustar?', 'ajustará'],
  ['ESC\uFFFDNER', 'ESCÁNER'],
  ['ESC?NER', 'ESCÁNER'],
  ['devolvi\uFFFD', 'devolvió'],
  ['devolvi?', 'devolvió'],
  ['categor\uFFFDa', 'categoría'],
  ['categor?a', 'categoría'],
  ['aqu\uFFFD', 'aquí'],
  ['aqu?', 'aquí'],
  ['pa\uFFFDs', 'país'],
  ['pa?s', 'país'],
  ['Espa\uFFFDa', 'España'],
  ['Espa?a', 'España'],
  ['N\uFFFDmero', 'Número'],
  ['N?mero', 'Número'],
  ['precisi\uFFFDn', 'precisión'],
  ['precisi?n', 'precisión'],
  ['Validaci\uFFFDn', 'Validación'],
  ['Regeneraci\uFFFDn', 'Regeneración'],
  ['S\uFFFD', 'Sí'],
  ['S?', 'Sí'],
  ['\uFFFDQuieres', '¿Quieres'],
  ['?Quieres', '¿Quieres'],
  ['\uFFFD\uFFFD\uFFFD', '►'],
  ['\uFFFD\uFFFD', '►'],
];

let out = decoded;
for (const [from, to] of replacements) {
  const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  if (out.includes(from)) {
    out = out.split(from).join(to);
  }
}

// Ensure no replacement character remains that could cause issues (optional: replace with ?)
out = out.replace(/\uFFFD/g, '?');

fs.writeFileSync(file, out, 'utf8');
console.log('Fixed UTF-8 in', path.relative(process.cwd(), file));
