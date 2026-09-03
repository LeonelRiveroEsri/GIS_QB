/* Lightweight agent integration configuration validation tests. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const loadTs = (file) => {
  const source = fs.readFileSync(file, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText
  const module = { exports: {} }
  Function('require', 'module', 'exports', output)(require, module, module.exports)
  return module.exports
}

const widgetRoot = path.resolve(__dirname, '..')
const { validateAgentIntegrationConfig } = loadTs(path.join(widgetRoot, 'src/validation/agent-integration-config-validator.ts'))
const endpoint = 'https://04ab42a0aa15e4028f705db8155b64.07.environment.api.powerplatform.com/copilotstudio/dataverse-backed/authenticated/bots/cr341_asistenteGisTeck/conversations?api-version=2022-03-01-preview'
const completeAuth = {
  enabled: true,
  tenantId: 'tenant-id',
  clientId: 'spa-client-id',
  redirectUri: 'https://localhost:3001/',
  scopes: ['https://api.powerplatform.com/.default']
}
const validate = (auth, copilotStudio = { enabled: false, endpoint: '' }) => validateAgentIntegrationConfig({ auth, copilotStudio })
const hasIssue = (result, code) => result.issues.some(issue => issue.code === code)

assert.equal(validate({ enabled: false, tenantId: '', clientId: '', redirectUri: '', scopes: [] }).valid, true) // A
assert.equal(hasIssue(validate({ ...completeAuth, tenantId: '' }), 'AUTH_TENANT_ID_REQUIRED'), true) // B
assert.equal(hasIssue(validate({ ...completeAuth, clientId: '' }), 'AUTH_CLIENT_ID_REQUIRED'), true) // C
assert.equal(hasIssue(validate({ ...completeAuth, redirectUri: '' }), 'AUTH_REDIRECT_URI_REQUIRED'), true) // D
assert.equal(hasIssue(validate({ ...completeAuth, scopes: [] }), 'AUTH_SCOPES_REQUIRED'), true) // E
assert.equal(validate(completeAuth).valid, true) // F
assert.equal(hasIssue(validate({ enabled: false }, { enabled: true, endpoint }), 'COPILOT_AUTH_REQUIRED'), true) // G
assert.equal(hasIssue(validate(completeAuth, { enabled: true, endpoint: '' }), 'COPILOT_ENDPOINT_REQUIRED'), true) // H
assert.equal(validate(completeAuth, { enabled: true, endpoint }).valid, true) // I
assert.equal(hasIssue(validate(completeAuth, { enabled: true, endpoint: endpoint.replace('https:', 'http:') }), 'COPILOT_ENDPOINT_INVALID'), true) // J
assert.equal(hasIssue(validate(completeAuth, { enabled: true, endpoint: endpoint.replace('https:', 'ftp:') }), 'COPILOT_ENDPOINT_INVALID'), true) // K
assert.equal(Object.prototype.hasOwnProperty.call(completeAuth, 'clientSecret'), false)
assert.equal(validate(completeAuth).valid, true) // L

console.log('Agent integration configuration validation: A-L passed')