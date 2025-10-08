# eguez-2025-b-vaes-sw-gr3

Eguez Vicente Adrian Eguez Sarzosa vaes

Este repositorio contiene un pequeño playground de BabylonJS para desarrollo local.

Archivos incluidos:

- `index.html` — página principal que carga BabylonJS y `src/main.js`.
- `src/main.js` — script con la escena (BabylonJS).
- `src/styles.css` — estilos mínimos para el canvas.
- `package.json` — scripts útiles para servir el proyecto localmente.

Cómo ejecutar localmente

1. Instala dependencias de desarrollo (solo para `http-server` o `live-server`):

```powershell
npm install
```

2. Ejecuta el servidor estático (elige una opción):

```powershell
npm start      # usa http-server en el puerto 5500
# o
npm run live   # usa live-server y abre el navegador
```

3. Abre http://localhost:5500/ en tu navegador si no se abre automáticamente.

Notas

- Las texturas externas cargadas por URL deben permitir CORS. Si una textura no carga, prueba otra URL o descarga el archivo a la carpeta `assets/` y referencia localmente.
- Si prefieres no instalar paquetes, puedes usar la extensión Live Server de VS Code para servir `index.html`.
# eguez-2025-b-vaes-sw-gr3
Eguez Vicente Adrian Eguez Sarzosa vaes
Hola!