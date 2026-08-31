# Selector de imágenes drone

Widget profesional para ArcGIS Experience Builder Developer Edition 1.20 que
filtra, analiza y compara capas fechadas dentro de un `GroupLayer` del web map.

## Convención predeterminada

- Grupo PAO: `Imagenes Drone`
- Nombre de capa: `AA_MM_DD_texto`, `AAAA_MM_DD_texto` o variantes con guion
- Ejemplo PAO: `26_05_25_Subestacion-El-Mauro_A_E35`

La expresión regular configurable `(\d{2}|\d{4})[_-](\d{2})[_-](\d{2})`
extrae año, mes y día. Los años de dos dígitos se interpretan dentro del siglo
XXI (`26` → `2026`). No se requieren footprints ni IDs fijos de capas.

Si el grupo configurado no existe en otro Web Map, el widget detecta
automáticamente el grupo que contenga más capas con esta nomenclatura. Por
ejemplo, puede reconocer tanto `Drone` como `NDWI`.

## Uso

1. Agregar **Selector de imágenes drone** a la experiencia.
2. En la configuración del widget, conectarlo al widget Mapa.
3. En **Apariencia**, escribir el título que se mostrará en el encabezado.
4. Confirmar el nombre del grupo y, si es necesario, ajustar el patrón.
5. Publicar la experiencia.

Al iniciar, el widget ordena las capas por fecha descendente, muestra la más
reciente y apaga las demás. Si se agregan capas al grupo durante la sesión,
vuelve a leer la colección automáticamente.

## Interacciones

- Búsqueda por nombre o fecha.
- Filtro por rango de fechas.
- Selección exclusiva de una capa.
- Navegación anterior/siguiente.
- Comparación opcional entre dos capas mediante una cortina Swipe vertical.
- Acercamiento opcional a la extensión de la capa seleccionada.
