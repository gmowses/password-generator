import { useState, useCallback, useEffect } from 'react'
import { Copy, RefreshCw, ShieldCheck, ShieldAlert, ShieldOff, Sun, Moon, Languages } from 'lucide-react'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'Secure Password Generator',
    subtitle: 'Generate cryptographically secure passwords with entropy analysis. Everything runs client-side.',
    config: 'Configuration',
    configDesc: 'Set your password options',
    length: 'Length',
    chars: 'characters',
    charTypes: 'Character types',
    numbers: 'Numbers (0-9)',
    lowercase: 'Lowercase (a-z)',
    uppercase: 'Uppercase (A-Z)',
    symbols: 'Symbols (!@#$...)',
    generate: 'Generate',
    regenerate: 'Regenerate',
    copy: 'Copy',
    copied: 'Copied!',
    result: 'Result',
    resultDesc: 'Your generated password',
    placeholder: 'Click "Generate" to start...',
    strength: 'Strength',
    entropy: 'Entropy',
    crackTime: 'Crack time',
    poolSize: 'Pool size',
    disclaimer: 'Estimate based on offline GPU attacks at 4 billion guesses/second. No data is sent to any server.',
    errorSelect: 'Select at least one character type.',
    veryWeak: 'Very Weak',
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
    veryStrong: 'Very Strong',
    tipWeak: 'Very weak password. Increase length and add more character types.',
    tipFair: 'Fair password. Recommended only for low-risk systems.',
    tipStrong: 'Strong password. Suitable for most production systems.',
    tipExcellent: 'Excellent password. Ideal for critical systems and privileged access.',
    instant: 'Instant',
    second: 'second', seconds: 'seconds',
    minute: 'minute', minutes: 'minutes',
    hour: 'hour', hours: 'hours',
    day: 'day', days: 'days',
    month: 'month', months: 'months',
    year: 'year', years: 'years',
    kYears: 'k years', mYears: 'M years',
    eternity: 'Eternity',
    builtBy: 'Built by',
  },
  pt: {
    title: 'Gerador de Senhas Seguras',
    subtitle: 'Gere senhas criptograficamente seguras com analise de entropia. Tudo roda no navegador.',
    config: 'Configuracao',
    configDesc: 'Defina as opcoes da senha',
    length: 'Comprimento',
    chars: 'caracteres',
    charTypes: 'Tipos de caractere',
    numbers: 'Numeros (0-9)',
    lowercase: 'Minusculas (a-z)',
    uppercase: 'Maiusculas (A-Z)',
    symbols: 'Simbolos (!@#$...)',
    generate: 'Gerar',
    regenerate: 'Gerar Nova',
    copy: 'Copiar',
    copied: 'Copiado!',
    result: 'Resultado',
    resultDesc: 'Sua senha gerada',
    placeholder: 'Clique em "Gerar" para comecar...',
    strength: 'Forca',
    entropy: 'Entropia',
    crackTime: 'Tempo p/ quebrar',
    poolSize: 'Pool',
    disclaimer: 'Estimativa baseada em ataques offline com GPUs modernas (4 bilhoes de tentativas/s). Nenhum dado e enviado ao servidor.',
    errorSelect: 'Selecione pelo menos um tipo de caractere.',
    veryWeak: 'Muito Fraca',
    weak: 'Fraca',
    fair: 'Media',
    strong: 'Forte',
    veryStrong: 'Muito Forte',
    tipWeak: 'Senha muito fraca. Aumente o comprimento e adicione mais tipos de caractere.',
    tipFair: 'Senha media. Recomendada apenas para sistemas de baixo risco.',
    tipStrong: 'Senha forte. Adequada para a maioria dos sistemas de producao.',
    tipExcellent: 'Senha excelente. Ideal para sistemas criticos e acesso privilegiado.',
    instant: 'Instantaneo',
    second: 'segundo', seconds: 'segundos',
    minute: 'minuto', minutes: 'minutos',
    hour: 'hora', hours: 'horas',
    day: 'dia', days: 'dias',
    month: 'mes', months: 'meses',
    year: 'ano', years: 'anos',
    kYears: 'mil anos', mYears: 'milhoes de anos',
    eternity: 'Eternidade',
    builtBy: 'Criado por',
  }
} as const

type Lang = keyof typeof translations

// ── Password logic ───────────────────────────────────────────────────────────
const CHARS_NUM = '0123456789'
const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz'
const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const CHARS_SPEC = '!@#$%^&*()_+~`|}{[]:;?><,./-='

function getPoolSize(pw: string) {
  let p = 0
  if (/[0-9]/.test(pw)) p += 10
  if (/[a-z]/.test(pw)) p += 26
  if (/[A-Z]/.test(pw)) p += 26
  if (/[^0-9a-zA-Z]/.test(pw)) p += 30
  return p
}

function calcEntropy(pw: string) {
  const p = getPoolSize(pw)
  return (!p || !pw.length) ? 0 : Math.log2(Math.pow(p, pw.length))
}

function calcCrackSec(pw: string) {
  const p = getPoolSize(pw)
  return p ? Math.pow(p, pw.length) / 4e9 : 0
}

function fmtCrack(s: number, t: Record<string, string>) {
  if (s < 1) return t.instant
  if (s < 60) return `${Math.round(s)} ${s > 1.5 ? t.seconds : t.second}`
  const m = s / 60
  if (m < 60) return `${Math.round(m)} ${m > 1.5 ? t.minutes : t.minute}`
  const h = m / 60
  if (h < 24) return `${Math.round(h)} ${h > 1.5 ? t.hours : t.hour}`
  const d = h / 24
  if (d < 30) return `${Math.round(d)} ${d > 1.5 ? t.days : t.day}`
  const mo = d / 30.44
  if (mo < 12) return `${Math.round(mo)} ${mo > 1.5 ? t.months : t.month}`
  const y = mo / 12
  if (y < 1000) return `${Math.round(y)} ${y > 1.5 ? t.years : t.year}`
  if (y < 1e6) return `${(y / 1000).toFixed(1).replace('.0', '')} ${t.kYears}`
  if (y < 1e9) return `${(y / 1e6).toFixed(1).replace('.0', '')} ${t.mYears}`
  return t.eternity
}

function getStrength(entropy: number, t: Record<string, string>) {
  if (entropy < 28) return { score: 0, label: t.veryWeak, color: '#ef4444' }
  if (entropy < 36) return { score: 1, label: t.weak, color: '#f97316' }
  if (entropy < 60) return { score: 2, label: t.fair, color: '#eab308' }
  if (entropy < 128) return { score: 3, label: t.strong, color: '#3b82f6' }
  return { score: 4, label: t.veryStrong, color: '#22c55e' }
}

function genPassword(len: number, num: boolean, low: boolean, up: boolean, spec: boolean) {
  let chars = '', guaranteed = ''
  if (num) { chars += CHARS_NUM; guaranteed += CHARS_NUM[Math.floor(Math.random() * CHARS_NUM.length)] }
  if (low) { chars += CHARS_LOWER; guaranteed += CHARS_LOWER[Math.floor(Math.random() * CHARS_LOWER.length)] }
  if (up) { chars += CHARS_UPPER; guaranteed += CHARS_UPPER[Math.floor(Math.random() * CHARS_UPPER.length)] }
  if (spec) { chars += CHARS_SPEC; guaranteed += CHARS_SPEC[Math.floor(Math.random() * CHARS_SPEC.length)] }
  if (!chars) return ''
  const arr = new Uint32Array(len - guaranteed.length)
  crypto.getRandomValues(arr)
  let rest = ''
  for (let i = 0; i < arr.length; i++) rest += chars[arr[i] % chars.length]
  const shuffle = new Uint32Array(len)
  crypto.getRandomValues(shuffle)
  return (guaranteed + rest).split('').sort((_, __, i = shuffle[0]++) => (i % 2) - 0.5).join('')
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PasswordGenerator() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [length, setLength] = useState(16)
  const [useNum, setUseNum] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useSpec, setUseSpec] = useState(false)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const t = translations[lang]
  const entropy = calcEntropy(password)
  const strength = getStrength(entropy, t)
  const crackSec = calcCrackSec(password)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const handleGenerate = useCallback(() => {
    if (!useNum && !useLower && !useUpper && !useSpec) { setError(t.errorSelect); return }
    setError('')
    setPassword(genPassword(length, useNum, useLower, useUpper, useSpec))
  }, [length, useNum, useLower, useUpper, useSpec, t])

  const handleCopy = () => {
    if (!password) return
    navigator.clipboard.writeText(password).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const barWidth = password ? `${(strength.score + 1) * 20}%` : '0%'
  const Icon = strength.score >= 3 ? ShieldCheck : strength.score >= 2 ? ShieldAlert : ShieldOff

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="font-semibold">Password Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Toggle language">
              <Languages size={14} />
              {lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Toggle theme">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/password-generator" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Config */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
              <div>
                <h2 className="font-semibold">{t.config}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.configDesc}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t.length}</label>
                  <span className="text-sm font-bold text-blue-500 tabular-nums">{length} {t.chars}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setLength(l => Math.max(4, l - 1))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">-</button>
                  <input type="range" min={4} max={128} value={length} onChange={e => setLength(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-blue-500" />
                  <button onClick={() => setLength(l => Math.min(128, l + 1))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">+</button>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 px-1"><span>4</span><span>128</span></div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">{t.charTypes}</p>
                {[
                  { label: t.numbers, state: useNum, set: setUseNum },
                  { label: t.lowercase, state: useLower, set: setUseLower },
                  { label: t.uppercase, state: useUpper, set: setUseUpper },
                  { label: t.symbols, state: useSpec, set: setUseSpec },
                ].map(({ label, state, set }) => (
                  <label key={label} className="flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={state} onChange={e => set(e.target.checked)} className="h-4 w-4 cursor-pointer accent-blue-500 rounded" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>

              {error && <p className="rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button onClick={handleGenerate} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
                  <RefreshCw size={15} />
                  {password ? t.regenerate : t.generate}
                </button>
                <button onClick={handleCopy} disabled={!password} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40">
                  <Copy size={15} />
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
              <div>
                <h2 className="font-semibold">{t.result}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.resultDesc}</p>
              </div>

              <div className="relative">
                <div className="min-h-[56px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 font-mono text-base break-all select-all">
                  {password || <span className="text-zinc-400 italic text-sm">{t.placeholder}</span>}
                </div>
                {password && (
                  <button onClick={handleCopy} title={t.copy} className="absolute right-2 top-2 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <Copy size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Icon size={14} style={{ color: password ? strength.color : undefined }} className={!password ? 'text-zinc-400' : ''} />
                    {t.strength}
                  </span>
                  {password && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${strength.color}20`, color: strength.color }}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: barWidth, backgroundColor: password ? strength.color : 'transparent' }} />
                </div>
              </div>

              {password && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t.entropy, value: `${Math.round(entropy)} bits` },
                    { label: t.crackTime, value: crackSec < 1 ? t.instant : `~${fmtCrack(crackSec, t)}` },
                    { label: t.length, value: `${password.length} ${t.chars}` },
                    { label: t.poolSize, value: `${getPoolSize(password)} symbols` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {password && (
                <div className="rounded-lg border px-3 py-2.5 text-xs" style={{ borderColor: `${strength.color}40`, backgroundColor: `${strength.color}10`, color: strength.color }}>
                  {strength.score < 2 && t.tipWeak}
                  {strength.score === 2 && t.tipFair}
                  {strength.score === 3 && t.tipStrong}
                  {strength.score >= 4 && t.tipExcellent}
                </div>
              )}

              <p className="text-[10px] text-zinc-400">{t.disclaimer}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
