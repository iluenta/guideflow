# Arreglar errores UTF-8 en el wizard

Si el build falla con **"invalid utf-8 sequence"** en `PropertySetupWizard.tsx`:

## Solución rápida

Desde la raíz del proyecto:

```bash
npm run fix-utf8
```

O directamente:

```bash
node scripts/fix-wizard-utf8.js
```

El script convierte caracteres Latin-1/Windows-1252 sueltos a UTF-8 y guarda el archivo en UTF-8.

## Cómo evitar que vuelva a pasar

1. **En Cursor/VS Code**: Asegúrate de que el archivo se guarde en UTF-8.
   - Barra inferior: haz clic donde pone "UTF-8" (o la codificación actual).
   - Elige "Save with Encoding".
   - Selecciona **UTF-8**.

2. **En Windows**: Si copias texto desde Word, Notepad antiguo o páginas con codificación incorrecta, puede colarse un carácter no UTF-8. Pega en un editor que use UTF-8 o usa "Pegar como texto sin formato" antes de pegar en el código.

3. **Git**: El proyecto debería tener en `.gitattributes` algo como `* text=auto` para que los archivos de texto se normalicen; así se reduce el riesgo de mezclar codificaciones.
