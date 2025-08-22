#!/usr/bin/env node
// Usage:
//   node embed-font.js MyFont.ttf
//   node embed-font.js MyFont.ttf "Custom Name"
//   node embed-font.js MyFont.ttf "Custom Name" woff2

const fs = require('fs')
const path = require('path')

// Mapping of extensions to formats
const formatMap = {
  ttf: 'truetype',
  otf: 'opentype',
  woff: 'woff',
  woff2: 'woff2',
}

const [, , fontPath, fontNameArg, fontFormatArg] = process.argv

if (!fontPath) {
  console.error(
    '❌ Please provide the font file path.\nUsage: node embed-font.js MyFont.ttf "Font Name" format',
  )
  process.exit(1)
}

const absPath = path.resolve(fontPath)
if (!fs.existsSync(absPath)) {
  console.error(`❌ File not found: ${absPath}`)
  process.exit(1)
}

const ext = path.extname(absPath).toLowerCase().replace('.', '')
const guessedFormat = formatMap[ext] || 'truetype'
const fontFormat = fontFormatArg || guessedFormat

// Default font name to filename without extension if not provided
const defaultFontName = path.basename(absPath, path.extname(absPath))
const fontName = fontNameArg || defaultFontName

const fontData = fs.readFileSync(absPath).toString('base64')

const css = `
@font-face {
  font-family: '${fontName}';
  src: url('data:font/${fontFormat};base64,${fontData}') format('${fontFormat}');
  font-weight: normal;
  font-style: normal;
}
`

console.log(css)
