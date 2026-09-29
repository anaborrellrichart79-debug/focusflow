# Calendarios escolares

Un fichero JSON por curso (`2026-2027.json`, `2027-2028.json`...). FocusFlow los lee de esta carpeta para avisar de las vacaciones y saber qué días no hay clase. **Para el curso siguiente no hay que tocar código**: basta con añadir su fichero.

## Cómo preparar el curso siguiente

1. Copia el fichero del último curso con el nombre nuevo, por ejemplo `2027-2028.json`.
2. Cambia `"curso"` para que coincida con el nombre del fichero (`"2027-2028"`) y actualiza `"fuente"` (de dónde salen las fechas: BOE, boletín de cada comunidad, prensa...).
3. Cambia las fechas de `festivosNacionales` y de cada comunidad:
   - `inicioClases` y `finClases`: primer y último día de clase de Infantil/Primaria (si ESO acaba más tarde, el más tardío).
   - `navidad` y `semanaSanta`: primer y último día **sin** clase (`inicio` y `fin`).
   - `diaComunidad` (opcional): solo si cae en día lectivo, con su `nombre` y `fecha`.
   - Los festivos nacionales solo si caen en día lectivo (12 de octubre, 8 de diciembre...).
4. Todas las fechas van como `AAAA-MM-DD` y tienen que estar dentro del curso (del 1 de septiembre al 31 de agosto).
5. Comprueba que es válido: `pnpm test calendario-escolar` (en `backend/`). Si hay algún error, el test dice exactamente qué comunidad y qué fecha fallan.

No hace falta reiniciar el servidor: detecta los ficheros nuevos o cambiados. El curso se elige solo según la fecha (el 1 de septiembre pasa al siguiente si ya está su fichero). Si un fichero tiene errores, se ignora y el log del servidor dice por qué.

Las fiestas locales y los días de libre disposición de cada centro no van aquí: cada usuario los añade como días no lectivos propios en Recordatorios.

La carpeta se puede cambiar con `CALENDARIOS_ESCOLARES_DIR` en `backend/.env` (por defecto, esta, relativa a la carpeta desde la que se arranca el backend).
