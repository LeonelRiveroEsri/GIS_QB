/* Static safeguards for temporal chart controls UX. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const renderer = fs.readFileSync(path.resolve(__dirname, '../src/runtime/charts/chart-renderer.tsx'), 'utf8')
const controls = fs.readFileSync(path.resolve(__dirname, '../src/runtime/charts/chart-presentation-controls.tsx'), 'utf8')
const notice = 'Seleccione un campo de fecha en el eje X para habilitar segmentación temporal y proyecciones.'

assert.match(controls, /presentationState\.trendType !== 'none' && presentationModel\.temporalAxisValid && <TrendDataControls/) // A
assert.match(controls, /supportsProjection && presentationState\.trendType === 'linear' && presentationModel\.temporalAxisValid && <ProjectionControls/) // B
assert.doesNotMatch(controls, /disabled=\{!presentationModel\.temporalAxisValid\}/) // C
assert.match(controls, new RegExp(`supportsProjection && presentationState\\.trendType !== 'none' && !presentationModel\\.temporalAxisValid && <div className='ai-chart-temporal-notice'>${notice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)) // D, H

assert.match(controls, /onPresentationStateChange\(\{ segmentDays: mode === 'all' \? null : mode, projectionDays: null \}\)/) // E, F
assert.match(renderer, /<ChartPresentationControls/) // G

const trendControlsStart = controls.indexOf("supportsTrends && presentationModel.points.length > 0")
const trendControls = controls.slice(trendControlsStart)
assert.ok(trendControlsStart >= 0)
assert.ok(trendControls.includes('<TrendlineControls'))
assert.ok(trendControls.includes('<TrendDataControls'))
assert.ok(trendControls.includes('<ProjectionControls')) // I: bar remains outside all trend controls
assert.match(controls, /const supportsProjection = artifact\.chartType === 'line' \|\| artifact\.chartType === 'area'/)
assert.equal((controls.match(new RegExp(notice, 'g')) || []).length, 1)
assert.doesNotMatch(controls, /La proyección en días requiere un eje temporal válido\./)
