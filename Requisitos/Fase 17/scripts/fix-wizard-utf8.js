#!/usr/bin/env node
/**
 * Arregla caracteres inválidos UTF-8 en PropertySetupWizard.tsx.
 * Ejecutar: node scripts/fix-wizard-utf8.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'dashboard', 'PropertySetupWizard.tsx');
let buf = fs.readFileSync(filePath);

// Mapa: byte Latin-1 (0x80-0xFF) -> secuencia UTF-8 (Buffer)
const LATIN1_TO_UTF8 = {
  0xC0: Buffer.from([0xC3, 0x80]), // À
  0xC1: Buffer.from([0xC3, 0x81]), // Á
  0xC9: Buffer.from([0xC3, 0xA9]), // é
  0xCD: Buffer.from([0xC3, 0xAD]), // í
  0xD1: Buffer.from([0xC3, 0xB1]), // ñ
  0xD3: Buffer.from([0xC3, 0xB3]), // ó
  0xDA: Buffer.from([0xC3, 0xBA]), // ú
  0xE0: Buffer.from([0xC3, 0xA0]), // à
  0xE1: Buffer.from([0xC3, 0xA1]), // á
  0xE9: Buffer.from([0xC3, 0xA9]), // é
  0xED: Buffer.from([0xC3, 0xAD]), // í
  0xF1: Buffer.from([0xC3, 0xB1]), // ñ
  0xF3: Buffer.from([0xC3, 0xB3]), // ó
  0xFA: Buffer.from([0xC3, 0xBA]), // ú
  0xB3: Buffer.from([0xC3, 0xB3]), // ó (Windows-1252)
  0xBA: Buffer.from([0xC2, 0xBA]), // º
  0xA1: Buffer.from([0xC2, 0xA1]), // ¡
  191: Buffer.from([0xC2, 0xBF])   // ¿ (0xBF)
};

const out = [];
let i = 0;
let fixes = 0;

while (i < buf.length) {
  const b = buf[i];

  if (b <= 0x7F) {
    out.push(b);
    i++;
    continue;
  }

  // Ya es inicio de secuencia UTF-8 válida de 2 bytes (C2-DF) o 3 (E0-EF)
  if (b >= 0xC2 && b <= 0xDF && i + 1 < buf.length && buf[i + 1] >= 0x80 && buf[i + 1] <= 0xBF) {
    out.push(b);
    out.push(buf[i + 1]);
    i += 2;
    continue;
  }
  if (b >= 0xE0 && b <= 0xEF && i + 2 < buf.length &&
      buf[i + 1] >= 0x80 && buf[i + 1] <= 0xBF && buf[i + 2] >= 0x80 && buf[i + 2] <= 0xBF) {
    out.push(b);
    out.push(buf[i + 1]);
    out.push(buf[i + 2]);
    i += 3;
    continue;
  }

  // Byte suelto o inválido: sustituir por UTF-8 si está en el mapa
  if (LATIN1_TO_UTF8[b]) {
    out.push(...LATIN1_TO_UTF8[b]);
    fixes++;
    i++;
    continue;
  }

  // Continuación UTF-8 suelta (0x80-0xBF) o otro byte: reemplazar por espacio para no romper el parse
  if (b >= 0x80 && b <= 0xBF) {
    out.push(0x20);
    fixes++;
    i++;
    continue;
  }

  // Cualquier otro 0x80-0xFF no mapeado -> espacio
  if (b >= 0x80) {
    out.push(0x20);
    fixes++;
    i++;
    continue;
  }

  out.push(b);
  i++;
}

fs.writeFileSync(filePath, Buffer.from(out), 'utf8');
console.log('OK. Archivo guardado en UTF-8. Caracteres corregidos:', fixes);
