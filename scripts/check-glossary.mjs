// Fails when an exported identifier in src/ uses a word the domain glossary
// bans (GLOSSARY.md "_Avoid_" lines) — e.g. a preset type named "Sample*"
// when the glossary says avoid "sample" for Preset.
//
// GLOSSARY.md stays the source of truth: single-word avoid-terms are parsed
// from it. Two refinements live here:
// - Multi-word phrases ("form data", "auto zoom") are skipped: they are
//   guidance for prose and UI copy, not identifier tokens.
// - CONTEXTUAL words are left to code review: their banned sense is scoped
//   by the glossary itself (e.g. "copy" is banned as a Card Content synonym,
//   while "UI Copy" is the sanctioned term), so a mechanical match would
//   mostly produce false positives.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

const CONTEXTUAL = new Set(['copy', 'strings', 'labels', 'download', 'save', 'form'])

const banned = new Set()
for (const line of readFileSync(path.join(ROOT, 'GLOSSARY.md'), 'utf8').split('\n')) {
  const match = line.match(/_Avoid_:\s*(.+)$/)
  if (!match) continue
  for (let term of match[1].split(',')) {
    term = term.split('(')[0].trim().toLowerCase()
    if (/^[a-z]+$/.test(term) && !CONTEXTUAL.has(term)) banned.add(term)
  }
}

const DECLARATION =
  /export\s+(?:const|let|var|function|interface|type|class|enum)\s+([A-Za-z0-9_]+)/g

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

const violations = []
for (const file of sourceFiles(path.join(ROOT, 'src'))) {
  const source = readFileSync(file, 'utf8')
  for (const [, identifier] of source.matchAll(DECLARATION)) {
    const tokens = identifier
      .split('_')
      .flatMap((part) => (part === part.toUpperCase() ? [part] : part.split(/(?=[A-Z])/)))
      .map((token) => token.toLowerCase())
      .filter(Boolean)
    for (const token of tokens) {
      if (banned.has(token)) {
        violations.push(
          `${path.relative(ROOT, file)}: "${identifier}" contains banned term "${token}"`,
        )
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Banned glossary terms in exported identifiers (${violations.length}):`)
  for (const violation of violations) console.error(`  ${violation}`)
  process.exit(1)
}
console.log(
  `✓ no banned glossary terms in exported identifiers (enforcing: ${[...banned].sort().join(', ')})`,
)
