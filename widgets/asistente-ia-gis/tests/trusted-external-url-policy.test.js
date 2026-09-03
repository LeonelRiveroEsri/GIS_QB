/* Lightweight trusted URL policy tests. Run with Node from C:\EXP\client. */
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
const { checkTrustedExternalUrl } = loadTs(path.join(widgetRoot, 'src/security/trusted-external-url-policy.ts'))
const accepted = (value, rules) => assert.equal(checkTrustedExternalUrl(value, rules).trusted, true)
const rejected = (value, reason, rules) => assert.deepEqual(checkTrustedExternalUrl(value, rules), { trusted: false, reason })

accepted('https://teckresources.sharepoint.com/site') // A
accepted('https://teck-qb2.maps.arcgis.com/home') // B
accepted('https://04ab42a0aa15e4028f705db8155b64.07.environment.api.powerplatform.com/path') // C
accepted('https://TECKRESOURCES.SHAREPOINT.COM/site') // D
rejected('https://teckresources.sharepoint.com.evil.com', 'host_not_allowed') // E
rejected('https://evil-teckresources.sharepoint.com', 'host_not_allowed') // F
rejected('https://teck-qb2.maps.arcgis.com.evil.com', 'host_not_allowed') // G
rejected('https://example.com', 'host_not_allowed') // H
rejected('http://teckresources.sharepoint.com', 'protocol_not_allowed') // I
accepted('http://localhost:3001/test') // J
accepted('http://127.0.0.1:8080/test') // K
rejected('javascript:alert(1)', 'protocol_not_allowed') // L
rejected('data:text/plain,test', 'protocol_not_allowed') // M
rejected('ftp://teckresources.sharepoint.com/file', 'protocol_not_allowed') // N
rejected('https://user:password@teckresources.sharepoint.com', 'credentials_not_allowed') // O
rejected('https://teckresources.sharepoint.com:8443/site', 'port_not_allowed') // P
rejected('not a URL', 'invalid_url') // Q

const subdomainRule = [{ hostname: 'services.example.test', allowSubdomains: true }]
accepted('https://maps.services.example.test/path', subdomainRule) // R
rejected('https://maps.services.example.test/path', 'host_not_allowed', [{ hostname: 'services.example.test' }]) // S
accepted('https://teck-qb2.maps.arcgis.com/home?view=map') // T
rejected('https://teck-qb2.maps.arcgis.com/home?token=secret', 'sensitive_query_not_allowed') // U

console.log('Trusted external URL policy: A-U passed')