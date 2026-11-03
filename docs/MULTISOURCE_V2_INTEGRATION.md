# Integración cinematográfica V2.2 — instalación exacta
Entorno: n8n 2.x, EasyPanel servicio de pruebas `youtube-remotion-v10-test`. No alterar producción.

## 1. Desplegar GitHub
En EasyPanel > servicio de pruebas > Deploy desde `feature/manifest-v8-bridge-20261102`.
Comprobar GET `https://personal-youtube-remotion-v10-test.x4ede1.easypanel.host/health`.

## 2. Sustituir Code PREP
Nodo existente `PREP - Cinematic Search Queries V1`; pegar **entero** `n8n/PREP-Cinematic-Search-Queries-V2.js`.
Mode **Run Once for All Items**; entrada `V6.8 - ENRICH - Semantic Assets`.
Emite 1-2 consultas por escena (S1 a S10), sin S0 ni S11.
Son consultas de investigación por escena, NO decisiones finales shot por shot.

## 3. Configurar HTTP
Nodo `SEARCH - Multi Source Cinematic Media`. Entrada desde PREP V2.
- Method POST; Authentication None.
- URL `https://personal-youtube-remotion-v10-test.x4ede1.easypanel.host/media/search`
- Headers: Content-Type application/json.
- Body Content Type JSON, Specify Body **Using JSON**, modo **Expression**.
- Pegar exactamente esta expresión (sin agregar otro = al inicio):

```js
{{ JSON.stringify({
  shotId: $json.shotId,
  sceneId: $json.sceneId,
  query: $json.searchQuery,
  context: $json.context || "",
  limit: $json.limit || 6,
  mediaTypes: $json.mediaTypes || ["image","video"],
  providers: $json.providers || ["openverse","commons"]
}) }}
```

## 4. Evitar saturación
Usar **Loop Over Items** batch size 1 y **Wait** 1-2 segundos por item ANTES del HTTP, si devuelve 429.
No lanzar en paralelo todas las consultas ni aplicar reintentos masivos.
Openverse sin autenticación puede tener límites, interrupciones o errores HTTP.
Si un proveedor falla, `providerErrors` debe mostrarlo.

## 5. QC
El endpoint ofrece `candidates` con `lexicalScore`, `mediaType`, `license`, `sourcePage`.
Estos son CANDIDATOS sin aprobación (`approved=false`).
Un 35/100 de coincidencia lexical solo evita búsquedas absurdas, NO comprueba el contenido real del vídeo.
Revisar manual o automáticamente con análisis visual real antes de usar en Remotion.
No permitir mezclar respuesta del HTTP con Accepted Stock Asset ni Film First hasta verificar
pertinencia, permisos y disponibilidad del archivo; generar clips o capturas demostrativas del contenido real del guion es prioritario.

## 6. Decisiones
- Openverse: fotografía, no es un banco de B-roll en vídeo.
- Wikimedia: fotografía documental y vídeo, metadatos por fichero.
- NASA: solo cuando query/context explicite ciencia/espacio y se solicite como proveedor.
- Pexels: deshabilitado por falta de acceso a nuevas claves.
- No se ha integrado todavía un grabador de demostraciones de software ni un pipeline de licencias completo.
