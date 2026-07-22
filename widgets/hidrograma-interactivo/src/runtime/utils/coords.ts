// =============================================
// CONVERSIÓN DE COORDENADAS UTM 19S -> WGS84 -> WEBMERCATOR
// =============================================

// UTM 19S (Chile) -> Lat/Lon
export function utm19sToLonLat(easting: number, northing: number) {
  const a = 6378137.0
  const eccSquared = 0.00669438
  const k0 = 0.9996

  const zoneNumber = 19
  const northernHemisphere = false

  let x = easting - 500000.0
  let y = northing

  if (!northernHemisphere) {
    y -= 10000000.0
  }

  const longOrigin = (zoneNumber - 1) * 6 - 180 + 3
  const eccPrimeSquared = eccSquared / (1 - eccSquared)

  const m = y / k0
  const mu = m / (
    a *
    (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared ** 3 / 256)
  )

  const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared))

  const j1 = 3 * e1 / 2 - 27 * e1 ** 3 / 32
  const j2 = 21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32
  const j3 = 151 * e1 ** 3 / 96
  const j4 = 1097 * e1 ** 4 / 512

  const fp = mu +
    j1 * Math.sin(2 * mu) +
    j2 * Math.sin(4 * mu) +
    j3 * Math.sin(6 * mu) +
    j4 * Math.sin(8 * mu)

  const sinFp = Math.sin(fp)
  const cosFp = Math.cos(fp)
  const tanFp = Math.tan(fp)

  const c1 = eccPrimeSquared * cosFp ** 2
  const t1 = tanFp ** 2
  const n1 = a / Math.sqrt(1 - eccSquared * sinFp ** 2)
  const r1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * sinFp ** 2, 1.5)
  const d = x / (n1 * k0)

  const latRad = fp -
    (n1 * tanFp / r1) *
    (
      d ** 2 / 2 -
      (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * eccPrimeSquared) * d ** 4 / 24 +
      (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * eccPrimeSquared - 3 * c1 ** 2) * d ** 6 / 720
    )

  const lonRad = (
    d -
    (1 + 2 * t1 + c1) * d ** 3 / 6 +
    (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * eccPrimeSquared + 24 * t1 ** 2) * d ** 5 / 120
  ) / cosFp

  const lat = latRad * 180 / Math.PI
  const lon = longOrigin + lonRad * 180 / Math.PI

  return { lon, lat }
}

// WGS84 -> WebMercator
export function lonLatToWebMercator(lon: number, lat: number) {
  const originShift = 20037508.342789244

  const x = lon * originShift / 180

  let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180)
  y = y * originShift / 180

  return { x, y }
}

// Helper directo: UTM -> WebMercator
export function utm19sToWebMercator(easting: number, northing: number) {
  const { lon, lat } = utm19sToLonLat(easting, northing)
  return lonLatToWebMercator(lon, lat)
}
