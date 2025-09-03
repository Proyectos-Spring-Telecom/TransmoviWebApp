// add-devextreme-license.js (raíz)
const fs = require('fs');
const path = require('path');

// Mantén tu licencia aquí (o vía variable de entorno DEVEXTREME_LICENSE)
const licenseFromEnv = process.env.DEVEXTREME_LICENSE;
const licenseKey = licenseFromEnv || 'ewogICJmb3JtYXQiOiAxLAogICJjdXN0b21lcklkIjogImEwODE3YzBkLTNmNzYtNDJjYS1hZDE5LTllYmMyYzVmMWI5ZSIsCiAgIm1heFZlcnNpb25BbGxvd2VkIjogMjQxCn0=.jDVYl8D2frZn/DKgp33IHvycOBynlH7eg3YIyIo4TFkrIsKibx4k5SKn0UGtuM6pUwB+ZaG+v/qxpM20xJN8PNfFqZAd5oX6ZnRHVjGWrSy/8lRcq+6WwmuHDNwRU22lnRi/lQ==';

// Ruta de salida: siempre en src/
const outDir = path.resolve(__dirname, 'src');
const outFile = path.join(outDir, 'devextreme-license.ts');

// Contenido TS que exporta la licencia
const content =
  `// Archivo generado automáticamente en postinstall\n` +
  `// No lo edites manualmente ni lo subas a git\n` +
  `export const licenseKey = \`${licenseKey}\`;\n`;

try {
  // Asegura que exista /src
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Escribe el archivo (sobrescribe si ya existe)
  fs.writeFileSync(outFile, content, { encoding: 'utf8', flag: 'w' });

  console.log('[DevExtreme] Archivo src/devextreme-license.ts generado.');
  process.exit(0);
} catch (err) {
  // No rompas npm install si algo sale mal
  console.warn('[DevExtreme] No se pudo generar la licencia (no crítico):', err && err.message);
  process.exit(0);
}
