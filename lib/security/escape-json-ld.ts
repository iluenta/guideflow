// Escape seguro para incrustar JSON dentro de un <script type="application/ld+json">.
//
// JSON.stringify NO escapa '<', '>', '&' ni los separadores de línea U+2028/U+2029.
// Si un campo controlado por el usuario (nombre de propiedad, descripción, etc.)
// contiene "</script>", rompería el tag y ejecutaría JS en el navegador de
// cualquier visitante (XSS almacenado). Convertimos esos caracteres a su forma
// \uXXXX, que sigue siendo una cadena JSON válida y ya no puede cerrar el <script>.
//
// Se usan String.fromCharCode / split-join en vez de un literal de expresión
// regular con el carácter crudo: U+2028/U+2029 son terminadores de línea para el
// lexer de JS y romperían el propio fichero fuente si se escribieran literales.

const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)

export function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .split(LINE_SEPARATOR).join('\\u2028')
    .split(PARAGRAPH_SEPARATOR).join('\\u2029')
}

/** Serializa un objeto a JSON ya escapado para incrustarlo en un <script>. */
export function stringifyJsonLd(value: unknown): string {
  return escapeJsonForScript(JSON.stringify(value))
}
