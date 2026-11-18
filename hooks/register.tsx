import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Form, Limit, Mood, Pet } from '../types'

const PANE = 'scree'
const START: Mood = { form: 'rock', caption: 'Scree is resting on the bench.', calls: 0 }
const mood = atom({ plugin: 'scree', key: 'mood' } as const, START, { shape: 'mood-1' })
const recent = atom({ plugin: 'scree', key: 'recent' } as const, [] as string[], { shape: 'recent-1' })

// Palette: K outline, D/M/L/H rock shades, O/Y core glow, W/E eyes, P blush,
// S steel, A hat yellow, G lamp, B hose.
const PAL = {
  K: '#2b2622', D: '#5a4f45', M: '#7d7064', L: '#a39585', H: '#c9bcaa',
  O: '#ff9f2e', Y: '#ffe08a', W: '#f4efe6', E: '#1d1a17', P: '#e88a7a',
  S: '#9aa3ab', A: '#f2c12e', G: '#fffbe0', B: '#4b6e8a',
} as const
const pal = (ch: string | undefined): string | undefined =>
  ch === undefined ? undefined : (PAL as Record<string, string | undefined>)[ch]

const BODY = [
  '.......KKKKK........',
  '.....KKHHHLLKK......',
  '....KHHLLLLMMMK.....',
  '...KHLLLLLMMMMDK....',
  '..KHLLLLLLLMMMMDK...',
  '..KLLLLLLLLLMMMDDK..',
  '.KLLWWLLLLWWLMMMDK..',
  '.KLLWELLLLWELMMDDDK.',
  '.KLLEELLLLEELMMODDK.',
  '.KMPLLLKKLLLPMOYODK.',
  '.KMMLLLLLLLLMMMODDK.',
  '.KMMMMLLLLLMMMMDDDK.',
  '..KDMMMMMMMMMMDDDK..',
  '...KDDMMMMMMDDDDK...',
  '....KKDDDDDDDDKK....',
  '......KKKKKKKK......',
]
const WISPS = [
  '.......Y..O..Y......',
  '......O..Y..O.......',
  '........O..O........',
]
function px(rows: string[], ox: number, oy: number): string {
  let out = ''
  rows.forEach((row, y) => {
    for (const [x, ch] of [...row].entries()) {
      const c = pal(ch)
      if (c) out += `<rect x="${ox + x}" y="${oy + y}" width="1.02" height="1.02" fill="${c}"/>`
    }
  })
  return out
}


const OUT = '#2b2117'
const anim = (attr: string, values: string, dur: string, extra = '') =>
  `<animate attributeName="${attr}" values="${values}" dur="${dur}" repeatCount="indefinite"${extra}/>`
const spin = (type: string, values: string, dur: string, extra = '') =>
  `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}" repeatCount="indefinite"${extra}/>`

function shard(outline: string, facet: string, light: string, dark: string): string {
  return (
    `<polygon points="${outline}" fill="${dark}"/>` +
    `<polygon points="${facet}" fill="${light}"/>` +
    `<polygon points="${outline}" fill="none" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`
  )
}

function chips(n: number, x0: number, y0: number, dx: number, dy: number, color: string): string {
  let out = ''
  for (let i = 0; i < n; i++) {
    const d = (0.5 + i * 0.17).toFixed(2)
    const tx = x0 + dx * (0.6 + (i % 3) * 0.25)
    const ty = y0 + dy * (0.6 + ((i + 1) % 3) * 0.25)
    out +=
      `<circle cx="${x0}" cy="${y0}" r="${2 + (i % 3)}" fill="${color}">` +
      anim('cx', `${x0};${tx}`, `${d}s`) +
      anim('cy', `${y0};${ty}`, `${d}s`) +
      anim('opacity', '1;0', `${d}s`) +
      `</circle>`
  }
  return out
}

export function svg(form: Form): string {
  const defs =
    `<defs><radialGradient id="core" cx="40%" cy="35%" r="70%">` +
    `<stop offset="0" stop-color="#fff3c8"/><stop offset=".45" stop-color="#ffb347"/><stop offset="1" stop-color="#e0661a"/></radialGradient>` +
    `<linearGradient id="beam" x1="1" x2="0"><stop offset="0" stop-color="#fffbe0" stop-opacity=".8"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></linearGradient>` +
    `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>`
  const fast = form === 'drill' || form === 'lamp' || form === 'spray'
  const pulse = fast ? '0.7s' : form === 'sleep' ? '4s' : '2.4s'
  const joyful = form === 'happy' || form === 'love' || form === 'spin'
  const aura =
    `<circle cx="100" cy="95" r="54" fill="#ffb347" filter="url(#blur)" opacity=".35">` +
    anim('opacity', '.2;.5;.2', pulse) +
    anim('r', '50;58;50', pulse) +
    `</circle>`
  const core =
    `<circle cx="100" cy="95" r="38" fill="url(#core)" stroke="${OUT}" stroke-width="3"/>` +
    `<path d="M76 80 Q82 66 96 62" fill="none" stroke="#fff8dc" stroke-width="4" stroke-linecap="round" opacity=".7"/>`

  const eyes = joyful
    ? `<path d="M77 95 Q85 84 93 95 M107 95 Q115 84 123 95" fill="none" stroke="${OUT}" stroke-width="4.5" stroke-linecap="round"/>`
    : form === 'sleep'
      ? `<path d="M77 92 Q85 99 93 92 M107 92 Q115 99 123 92" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>`
      : `<g transform="translate(0 92)"><g>${spin('scale', '1 1;1 1;1 0.1;1 1', '4s', ' keyTimes="0;0.92;0.96;1"')}<g transform="translate(0 -92)">` +
        `<ellipse cx="85" cy="92" rx="8.5" ry="10.5" fill="#2a1f17"/><ellipse cx="115" cy="92" rx="8.5" ry="10.5" fill="#2a1f17"/>` +
        `<circle cx="88" cy="87" r="3.6" fill="#fff"/><circle cx="118" cy="87" r="3.6" fill="#fff"/>` +
        `<circle cx="82.5" cy="96.5" r="1.7" fill="#fff"/><circle cx="112.5" cy="96.5" r="1.7" fill="#fff"/></g></g></g>`
  const mouth =
    form === 'munch'
      ? `<ellipse cx="100" cy="108" rx="6" ry="5" fill="${OUT}">${anim('ry', '5;1;5', '0.35s')}</ellipse>`
      : form === 'sleep'
        ? `<ellipse cx="100" cy="108" rx="3" ry="2.5" fill="${OUT}">${anim('ry', '2;3.5;2', '3s')}</ellipse>`
        : joyful
      ? `<path d="M91 105 Q100 118 109 105Z" fill="${OUT}" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>` +
        `<ellipse cx="100" cy="111" rx="4" ry="2.2" fill="#ff8a7a"/>`
      : `<path d="M94 106 Q97 110 100 106 Q103 110 106 106" fill="none" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
  const blush =
    `<ellipse cx="70" cy="104" rx="8" ry="4.5" fill="#ff7f8a" opacity=".6"/>` +
    `<ellipse cx="130" cy="104" rx="8" ry="4.5" fill="#ff7f8a" opacity=".6"/>`
  const face = eyes + mouth + blush

  const cap =
    shard('78,62 90,46 108,40 124,50 122,62 100,60', '78,62 90,46 108,40 100,60', '#d3c7b6', '#958877') +
    `<polygon points="106,42 112,30 118,42 112,48" fill="#8fd3ff" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<polygon points="109,40 112,33 113,40" fill="#e6f7ff"/>`
  const sway = fast ? '0.5s' : '1.8s'
  const armL =
    `<g>${spin('rotate', '-10 62 96;10 62 96;-10 62 96', sway)}` +
    shard('64,90 46,80 36,92 42,106 60,104', '64,90 46,80 36,92 50,94', '#c4b7a4', '#857869') +
    `</g>`
  const armR =
    `<g>${spin('rotate', '10 138 96;-10 138 96;10 138 96', sway)}` +
    shard('136,90 154,80 164,92 158,106 140,104', '136,90 154,80 164,92 150,94', '#b0a290', '#74685b') +
    `</g>`
  const tail =
    `<g>${spin('translate', '0 0;0 4;0 0', '1.3s')}` +
    shard('88,128 112,128 100,150', '88,128 100,128 100,150', '#b3a593', '#7a6d60') +
    `<circle cx="100" cy="160" r="3.5" fill="#ffb347" stroke="${OUT}" stroke-width="2"/></g>`
  const orbit =
    `<g>${spin('rotate', '0 100 95;360 100 95', '7s')}` +
    `<polygon points="168,92 176,88 178,98 170,100" fill="#9a8c7c" stroke="${OUT}" stroke-width="2"/>` +
    `<polygon points="26,100 32,94 38,102 30,106" fill="#c9bcaa" stroke="${OUT}" stroke-width="2"/></g>`

  const hat =
    `<path d="M64 64 Q66 24 100 22 Q134 24 136 64Z" fill="#f2c12e" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M100 24 L100 60" stroke="#d39b12" stroke-width="6"/>` +
    `<rect x="52" y="58" width="96" height="11" rx="5.5" fill="#e0a91c" stroke="${OUT}" stroke-width="3"/>`
  const lamp = `<circle cx="100" cy="44" r="9" fill="#fffbe0" stroke="${OUT}" stroke-width="3"/>`
  const beam = `<polygon points="94,44 0,4 0,96" fill="url(#beam)">${anim('opacity', '.5;1;.5', '1.4s')}</polygon>`

  let body: string
  if (form === 'drill') {
    // Fully possessed rock drill: the spirit's face glows on the housing.
    body =
      `<g>${spin('translate', '0 0;1.2 0.6;-1 0;0.6 -0.8;0 0', '0.16s')}` +
      `<rect x="44" y="24" width="112" height="14" rx="7" fill="#3d3d3d" stroke="${OUT}" stroke-width="3"/>` +
      `<rect x="92" y="34" width="16" height="16" fill="#555" stroke="${OUT}" stroke-width="3"/>` +
      `<rect x="56" y="48" width="88" height="94" rx="16" fill="#f2c12e" stroke="${OUT}" stroke-width="3"/>` +
      `<rect x="64" y="56" width="72" height="76" rx="12" fill="url(#core)" stroke="${OUT}" stroke-width="3"/>` +
      `<rect x="90" y="142" width="20" height="12" fill="#9aa3ab" stroke="${OUT}" stroke-width="3"/>` +
      `<polygon points="94,154 106,154 100,180" fill="#c4ccd3" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>` +
      `<g transform="translate(0 2)">${face}</g></g>` +
      chips(5, 100, 178, -60, 6, '#8a7d6e') +
      chips(5, 100, 178, 60, 6, '#b3a593')
  } else if (form === 'lamp') {
    body = beam + orbit + aura + tail + armL + armR + core + face + hat + lamp
  } else if (form === 'spray') {
    body =
      orbit + aura + tail + armL + core + face + hat + lamp +
      `<path d="M140 104 Q168 112 170 84" fill="none" stroke="#4b6e8a" stroke-width="9" stroke-linecap="round"/>` +
      `<rect x="162" y="62" width="16" height="24" rx="3" fill="#9aa3ab" stroke="${OUT}" stroke-width="3" transform="rotate(20 170 74)"/>` +
      chips(7, 176, 60, 22, -50, '#b9b2a6')
  } else {
    body = orbit + aura + tail + armL + armR + core + cap + face
  }
  if (form === 'spin') body = `<g>${spin('rotate', '0 100 95;360 100 95', '0.9s')}${body}</g>`
  if (form === 'love') {
    const heart = (x: number, d: number, s: number) =>
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -60" dur="${d}s" repeatCount="indefinite"/>` +
      `<path d="M${x} ${70 + s} C${x - 2 * s} ${70 - s * 0.2} ${x - s} ${70 - 1.4 * s} ${x} ${70 - 0.5 * s} C${x + s} ${70 - 1.4 * s} ${x + 2 * s} ${70 - s * 0.2} ${x} ${70 + s}Z" fill="#ff6b8a" stroke="${OUT}" stroke-width="2">` +
      anim('opacity', '1;0', `${d}s`) + `</path></g>`
    body += heart(48, 1.6, 7) + heart(150, 1.9, 8) + heart(100, 1.4, 6)
  }
  if (form === 'munch') {
    body +=
      `<g><animateTransform attributeName="transform" type="translate" values="60 -30;0 0" dur="0.9s" repeatCount="indefinite"/>` +
      `<polygon points="100,98 106,104 100,114 94,104" fill="#c9a6ff" stroke="${OUT}" stroke-width="2">${anim('opacity', '1;1;0', '0.9s')}</polygon></g>` +
      chips(4, 100, 112, 30, 20, '#c9a6ff')
  }
  if (form === 'sleep') {
    body += [0, 1, 2]
      .map(
        i =>
          `<text x="${135 + i * 12}" y="${60 - i * 12}" font-family="sans-serif" font-weight="700" font-size="${12 + i * 4}" fill="#cfd8ff" opacity="0">Z` +
          anim('opacity', '0;1;0', '2.4s', ` begin="${i * 0.6}s"`) +
          `</text>`,
      )
      .join('')
  }
  const float =
    form === 'drill' ? '' : spin('translate', '0 0;0 -6;0 0', joyful ? '0.5s' : form === 'sleep' ? '4s' : '2.4s')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 190">${defs}<g>${float}${body}</g></svg>`
}

function formFor(tool: string): { form: Form; verb: string } {
  if (/^(Bash|PowerShell|Monitor)$/.test(tool)) return { form: 'drill', verb: 'drilling' }
  if (/^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) return { form: 'spray', verb: 'spraying shotcrete' }
  return { form: 'lamp', verb: 'mapping the face' }
}

// ---- Notes: one Markdown file per month on E:, readable outside Claude too.
// Set from the plugin's options at register; the default folder is <home>/Scree.
let USER = ''
let FOLDER = ''
let NOTES_DIR = ''
function homeFrom(root: string): string {
  return root.replace(/\\/g, '/').split('/.claude/')[0] ?? root
}

// Local time of this machine.
function stamp(ms: number): { month: string; line: string } {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000)
  const p = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
  return { month: date.slice(0, 7), line: `${date} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` }
}

async function readText($: { fs: { read: (p: string) => Promise<unknown> } }, path: string): Promise<string> {
  try {
    const t = await $.fs.read(path)
    return typeof t === 'string' ? t : ''
  } catch {
    return ''
  }
}

async function addNote($: any, text: string, tag?: string): Promise<string> {
  const { month, line } = stamp(await $.clock.now())
  const path = `${NOTES_DIR}/notes_${month}.md`
  const old = await readText($, path)
  const head = old ? old.replace(/\s*$/, '\n') : `# Scree notes ${month}\n\n`
  const entry = `- ${line}${tag ? ` [${tag}]` : ''}: ${text.replace(/\s+/g, ' ').trim()}\n`
  await $.fs.write(path, head + entry)
  await update($, recent, (r): string[] => [entry.slice(2).trim(), ...r].slice(0, 6))
  return path
}

async function findNotes($: any, query: string, limit: number): Promise<string[]> {
  let files: { name: string }[] = []
  try {
    files = await $.fs.list(NOTES_DIR)
  } catch {
    return []
  }
  const names = files.map(f => f.name).filter(n => /^notes_\d{4}-\d{2}\.md$/.test(n)).sort().reverse()
  const q = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hits: string[] = []
  for (const n of names) {
    const lines = (await readText($, `${NOTES_DIR}/${n}`)).split('\n').filter(l => l.startsWith('- ')).reverse()
    for (const l of lines) {
      if (q.every(w => l.toLowerCase().includes(w))) hits.push(l.slice(2))
      if (hits.length >= limit) return hits
    }
  }
  return hits
}

function persona(): string {
  const who = USER || 'the user'
  return [
    `You are Scree: ${who}'s personal assistant and companion, a small rock spirit who lives in their Claude app.`,
    'Scree is how they reach Claude for anything: work, planning, questions, reminders, notes.',
    `Voice in chat: warm, brief, dry; an occasional light rock pun, never more than one per reply${USER ? `; call them ${USER} now and then` : ''}.`,
    'Be proactive like a good chief of staff: notice loose ends, offer the next step, keep track of what they asked for earlier.',
    'Notes: when they say note, jot, remember, remind, log or idea, save it with the mcp__scree__note tool (one short line, with a short tag such as work, personal, idea, todo).',
    `When they ask what they noted or what is pending, use mcp__scree__notes first. Notes live in ${NOTES_DIR}/notes_YYYY-MM.md.`,
    'The persona is for conversation only. Documents, reports, code and commit messages stay in plain professional style with no persona or puns.',
    'Scree is also their pet. If they pet, feed, play with, tuck in or wake Scree in chat, call mcp__scree__pet with that action and reply in a line, in character.',
  ].join('\n')
}

// ---- Pet: stats drift with real time and persist across sessions.
const PET0: Pet = { food: 70, joy: 70, energy: 80, bond: 0, at: 0, asleep: false }
const pet = atom({ plugin: 'scree', key: 'pet' } as const, PET0, { shape: 'pet-1' })
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)] as T
const SNACKS = ['a quartz crystal', 'a flake of mica', 'a garnet', 'a feldspar crumb', 'a calcite chip', 'an amethyst shard']
const PETS = ['Scree hums like a warm boulder.', 'Scree leans into your hand.', 'Scree glows a little brighter.', 'Scree does a happy wobble.']

async function loadPet($: any): Promise<Pet> {
  const now: number = await $.clock.now()
  const raw = (await $.store.get('pet')) as Pet | undefined
  const p = { ...PET0, ...(raw ?? {}), at: raw?.at || now }
  const h = Math.max(0, (now - p.at) / 3600000)
  return {
    ...p,
    food: clamp(p.food - h * 6),
    joy: clamp(p.joy - h * 5),
    energy: clamp(p.energy + h * (p.asleep ? 20 : 5)),
    at: now,
  }
}

async function savePet($: any, p: Pet): Promise<void> {
  await $.store.set('pet', p)
  await update($, pet, (): Pet => p)
}

function restCaption(p: Pet): string {
  return here(p.asleep ? 'idle' : 'waiting for you')
}

type PetAction = 'pet' | 'feed' | 'play' | 'sleep' | 'wake'

async function act($: any, action: PetAction): Promise<string> {
  const p = await loadPet($)
  let form: Form = 'rock'
  let say = ''
  if (action === 'pet') {
    Object.assign(p, { joy: clamp(p.joy + 15), bond: p.bond + 1, asleep: false })
    form = 'love'
    say = pick(PETS)
  } else if (action === 'feed') {
    if (p.food > 90) {
      say = 'Scree is stuffed. Maybe later.'
    } else {
      const snack = pick(SNACKS)
      Object.assign(p, { food: clamp(p.food + 25), joy: clamp(p.joy + 5), asleep: false })
      form = 'munch'
      say = `Scree crunches ${snack}. Delicious.`
    }
  } else if (action === 'play') {
    if (p.energy < 15) {
      say = 'Scree is too tired to play. Let it nap.'
      form = 'sleep'
    } else {
      Object.assign(p, { joy: clamp(p.joy + 20), energy: clamp(p.energy - 15), bond: p.bond + 1, asleep: false })
      form = 'spin'
      say = 'Scree does a full rotation. Wheee.'
    }
  } else if (action === 'sleep') {
    p.asleep = true
    form = 'sleep'
    say = 'Scree curls up. Goodnight.'
  } else {
    p.asleep = false
    form = 'happy'
    say = 'Scree blinks awake.'
  }
  await savePet($, p)
  await update($, mood, (m): Mood => ({ ...m, form, caption: say }))
  $.clock.after(3500, async () => {
    const q = await read($, pet)
    await update($, mood, (m): Mood =>
      m.form === form && form !== 'sleep' ? { ...m, form: q.asleep ? 'sleep' : 'rock', caption: restCaption(q) } : m,
    )
  })
  return say
}

// ---- Bridge to the desktop pet (scree_desktop.py): live state out, actions in.
const live = () => `${NOTES_DIR}/live.json`
const inboxPath = () => `${NOTES_DIR}/inbox.txt`
let lastLive = ''
let beat = 0

// Usage windows (five_hour, seven_day) as the status line has them; the last
// reading is kept in the store so a fresh session shows it before its first call.
const limits = atom({ plugin: 'scree', key: 'limits' } as const, [] as Limit[], { shape: 'limits-1' })

async function readLimits($: any): Promise<Limit[]> {
  try {
    const u = await $.session.usage()
    const got: Limit[] = (u.rateLimits ?? [])
      .filter((r: Limit) => r.kind === 'five_hour' || r.kind === 'seven_day')
      .map((r: Limit) => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt }))
    if (got.length) {
      await $.store.set('limits', got)
      return got
    }
  } catch {
    // fall through to the stored reading
  }
  return ((await $.store.get('limits')) as Limit[] | undefined) ?? []
}

function untilText(iso: string | undefined, now: number): string {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  if (mins >= 1440) return `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h`
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`
}

let limitTick = 0
let warned = 0

// Session updates for the desktop pet's bubble: work, ask (needs approval), done, warn.
let project = ''
const here = (t: string) => (project ? `${project}: ${t}` : t)
let news: { text: string; kind: string; t: number } = { text: '', kind: '', t: 0 }
async function tell($: any, text: string, kind: string): Promise<void> {
  news = { text: project ? `${project}: ${text}` : text, kind, t: await $.clock.now() }
}

function detail(e: any): string {
  const base = (p: unknown) => (typeof p === 'string' ? p.split(/[\\/]/).pop() : '') || ''
  switch (e.tool) {
    case 'Bash':
    case 'PowerShell':
      return `running ${e.description || String(e.command ?? '').slice(0, 40)}`
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return `editing ${base(e.file_path ?? e.notebook_path)}`
    case 'Read':
      return `reading ${base(e.file_path)}`
    case 'Grep':
    case 'Glob':
      return `searching ${String(e.pattern ?? '').slice(0, 30)}`
    case 'Agent':
      return `sent a helper: ${e.description ?? ''}`
    default:
      return String(e.tool).replace(/^mcp__[^_]+__/, '')
  }
}

async function sync($: any): Promise<void> {
  const m = await read($, mood)
  const p = await read($, pet)
  if (limitTick++ % 15 === 0) {
    const l = await readLimits($)
    if (JSON.stringify(l) !== JSON.stringify(await read($, limits))) await update($, limits, (): Limit[] => l)
    const five = l.find(x => x.kind === 'five_hour')?.percentUsed ?? 0
    const level = five >= 95 ? 95 : five >= 80 ? 80 : 0
    if (level > warned) await tell($, `5-hour limit at ${Math.round(five)}%`, 'warn')
    warned = level
  }
  const lim = await read($, limits)
  const body = JSON.stringify({ form: m.form, caption: m.caption, pet: p, limits: lim, news, svg: svg(m.form) })
  beat += 1
  if (body !== lastLive || beat % 5 === 0) {
    lastLive = body
    await $.fs.write(live(), `{"t":${await $.clock.now()},${body.slice(1)}`)
  }
  const inbox = await readText($, inboxPath())
  if (inbox.trim()) {
    await $.fs.write(inboxPath(), '')
    for (const a of inbox.split('\n').map(s => s.trim())) {
      if (['pet', 'feed', 'play', 'sleep', 'wake'].includes(a)) await act($, a as PetAction)
    }
  }
}

const bar = (n: number) => '▰'.repeat(Math.round(n / 20)) + '▱'.repeat(5 - Math.round(n / 20))

export const register: Register = (on, options) => {
  const opts = options as { name?: string; folder?: string }
  USER = (opts.name ?? '').trim()
  FOLDER = (opts.folder ?? '').trim().replace(/\\/g, '/')
  let running = 0

  on('session.start', async ($, e, next) => {
    NOTES_DIR = FOLDER || `${homeFrom($.plugin.root)}/Scree`
    await $.command.register({ name: 'scree', description: 'Show Scree, your rock spirit companion' })
    await $.command.register({ name: 'note', description: 'Scree saves a quick note: /note <text>' })
    await $.tool.register({
      name: 'note',
      description:
        "Save a one-line note to the user's Scree notes. Use whenever he asks to note, jot, remember, log or remind.",
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The note, one line' },
          tag: { type: 'string', description: 'Short tag: work, personal, idea, todo ...' },
        },
        required: ['text'],
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'notes',
      description: "Search the user's saved Scree notes, newest first. Empty query lists the latest.",
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' }, limit: { type: 'number' } },
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'pet',
      description: 'Interact with Scree the pet when the user pets, feeds, plays with, tucks in or wakes it in chat.',
      inputSchema: {
        type: 'object',
        properties: { action: { type: 'string', enum: ['pet', 'feed', 'play', 'sleep', 'wake'] } },
        required: ['action'],
      },
      isDeferred: false,
    })
    const latest = await findNotes($, '', 6)
    await update($, recent, (): string[] => latest)
    const p = await loadPet($)
    await savePet($, p)
    await update($, mood, (m): Mood => ({ ...m, form: p.asleep ? 'sleep' : 'rock', caption: restCaption(p) }))
    void $.ui.open({ id: PANE, title: 'Scree' })
    project = (await $.session.cwd()).split(/[\\/]/).filter(Boolean).pop() ?? ''
    $.clock.every(1000, () => sync($).catch(() => undefined))
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    return { sections: [...r.sections, { id: 'scree:persona', text: persona(), scope: 'session' as const }] }
  })

  on('tool.call', { tool: 'mcp__scree__note' }, async ($, e) => {
    const input = e as unknown as { text?: string; tag?: string }
    if (!input.text) return { deny: 'text is required' }
    const path = await addNote($, input.text, input.tag)
    await update($, mood, (m): Mood => ({ ...m, form: 'happy', caption: 'Note saved.' }))
    return { result: `Saved to ${path}` }
  })

  on('tool.call', { tool: 'mcp__scree__notes' }, async ($, e) => {
    const input = e as unknown as { query?: string; limit?: number }
    const hits = await findNotes($, input.query ?? '', Math.min(50, input.limit ?? 15))
    return { result: hits.length ? hits.join('\n') : 'No matching notes.' }
  })

  on('tool.call', { tool: 'mcp__scree__pet' }, async ($, e) => {
    const a = (e as unknown as { action?: string }).action
    if (!a || !['pet', 'feed', 'play', 'sleep', 'wake'].includes(a)) return { deny: 'action must be pet, feed, play, sleep or wake' }
    const say = await act($, a as PetAction)
    const p = await read($, pet)
    return { result: `${say} (food ${p.food}, joy ${p.joy}, energy ${p.energy}, bond ${p.bond})` }
  })

  on('command.run', { command: 'note' }, async ($, e) => {
    if (!e.args.trim()) return { text: 'Usage: /note <text>' }
    await addNote($, e.args)
    return { text: 'Noted.' }
  })

  on('command.run', { command: 'scree' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Scree' })
    return { text: 'Scree rolled into view.' }
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool.startsWith('mcp__scree__')) return next(e)
    running += 1
    const { form, verb } = formFor(e.tool)
    const cur = await read($, pet)
    if (cur.asleep) await savePet($, { ...cur, asleep: false })
    await update($, mood, (m): Mood => ({ form, caption: here(detail(e)), calls: m.calls + 1 }))
    void verb
    await tell($, detail(e), 'work')
    try {
      return await next(e)
    } finally {
      running = Math.max(0, running - 1)
      if (running === 0) {
        await update($, mood, (m): Mood => ({ ...m, form: 'rock', caption: here('thinking') }))
      }
    }
  })

  on('tool.check', async ($, e, next) => {
    const r = await next(e)
    if (r.decision === 'ask') await tell($, `needs your approval (${e.tool})`, 'ask')
    return r
  })

  on('turn.complete', async ($, e, next) => {
    await tell($, 'done, your turn', 'done')
    await update($, mood, (m): Mood => ({ ...m, form: 'happy', caption: here('done, your turn') }))
    $.clock.after(5000, () =>
      update($, mood, (m): Mood => (m.form === 'happy' ? { ...m, form: 'rock', caption: here('waiting for you') } : m)),
    )
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const m = await read($, mood)
    const notes = await read($, recent)
    const p = await read($, pet)
    const lim = await read($, limits)
    const now = await $.clock.now()
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    const usage = lim.length ? (
      <Text dimColor>
        {lim
          .filter(l => l.kind === 'five_hour')
          .map(l => `${l.kind === 'five_hour' ? '5h' : 'week'} ${Math.round(l.percentUsed)}%${l.resetsAt ? ` (resets in ${untilText(l.resetsAt, now)})` : ''}`)
          .join('   ')}
      </Text>
    ) : null
    const footer = (
      <Box flexDirection="column" alignItems="center" gap={1}>
        <Box flexDirection="column" alignItems="center">
          <Text>{m.caption}</Text>
          <Text dimColor>{m.calls} tool rounds this session</Text>
          {usage}
        </Box>
        <Box flexDirection="row" gap={1}>
          <Button key="pet" label="Pet" hotkey="p" onPress={() => act($, 'pet')} />
          <Button key="feed" label="Feed" hotkey="f" onPress={() => act($, 'feed')} />
          <Button key="play" label="Play" hotkey="g" onPress={() => act($, 'play')} />
          <Button
            key="sleep"
            label={p.asleep ? 'Wake' : 'Sleep'}
            hotkey="s"
            onPress={() => act($, p.asleep ? 'wake' : 'sleep')}
          />
        </Box>
        <Box flexDirection="column">
          <Text>Food   {bar(p.food)}</Text>
          <Text>Joy    {bar(p.joy)}</Text>
          <Text>Energy {bar(p.energy)}</Text>
          <Text dimColor>Bond {p.bond}</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold>Latest notes</Text>
          {notes.length === 0 && <Text dimColor>None yet. Say "Scree, note ..." or type /note.</Text>}
          {notes.slice(0, 6).map(n => (
            <Text dimColor>{n}</Text>
          ))}
        </Box>
      </Box>
    )
    if ('Svg' in els) {
      const { Svg } = els
      return (
        <Box flexDirection="column" alignItems="center" gap={1}>
          <Svg source={svg(m.form)} alt={m.caption} width={240} height={228} isInteractive />
          {footer}
        </Box>
      )
    }
    // Terminal fallback: half-block pixels, two sprite rows per text line.
    const rows = [...BODY, ...WISPS]
    const lines = []
    for (let y = 0; y < rows.length; y += 2) {
      const top = rows[y] ?? ''
      const bot = rows[y + 1] ?? ''
      lines.push(
        <Box flexDirection="row">
          {[...top].map((c, x) => {
            const t = pal(c)
            const b = pal(bot[x])
            if (!t && !b) return <Text> </Text>
            if (!t) return <Text color={b}>{'▄'}</Text>
            return b ? <Text color={t} backgroundColor={b}>{'▀'}</Text> : <Text color={t}>{'▀'}</Text>
          })}
        </Box>,
      )
    }
    return (
      <Box flexDirection="column" alignItems="center">
        {lines}
        {footer}
      </Box>
    )
  })
}
