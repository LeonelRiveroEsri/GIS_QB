# Selector de imágenes drone

Widget para ArcGIS Experience Builder Developer Edition 1.20 que controla capas
de teselas fechadas dentro de un `GroupLayer` del web map.

## Convención predeterminada

- Grupo: `Drone`
- Nombre de capa: `AAAA_MM_DD_texto` o `AAAA-MM-DD-texto`
- Ejemplo: `2026_04_28_Drone`

La expresión regular configurable `(\d{4})[_-](\d{2})[_-](\d{2})` extrae año,
mes y día. No se requieren footprints, mosaic datasets ni Image Server.

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
