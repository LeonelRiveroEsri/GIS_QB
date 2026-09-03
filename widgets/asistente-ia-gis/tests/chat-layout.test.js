/* Static safeguards for the bounded chat layout. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const widgetRoot = path.resolve(__dirname, '..')
const style = fs.readFileSync(path.join(widgetRoot, 'src/runtime/style.ts'), 'utf8')
const widget = fs.readFileSync(path.join(widgetRoot, 'src/runtime/widget.tsx'), 'utf8')

assert.match(style, /display:flex; flex-direction:column;[^\n]*height:100%; min-height:0;/)
assert.match(style, /\.ai-conversation\{flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;/)
assert.match(style, /\.ai-composer\{flex:0 0 auto;/)
assert.doesNotMatch(style, /position:(?:fixed|absolute)/)

const conversationStart = widget.indexOf("<main className='ai-conversation'")
const conversationEnd = widget.indexOf('</main>', conversationStart)
const composerStart = widget.indexOf("<footer className='ai-composer'>")
assert.ok(conversationStart >= 0 && conversationEnd > conversationStart)
assert.ok(composerStart > conversationEnd)

assert.match(widget, /conversationRef\.current\?\.scrollTo\(\{ top: conversationRef\.current\.scrollHeight/)
assert.doesNotMatch(widget, /scrollIntoView/)