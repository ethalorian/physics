'use client'

/**
 * MathSpineDiagram — a small, explicit schematic for each competency, shown in
 * the warm-up mini-lesson. Keyed by competency CODE. Grayscale-safe (uses the
 * theme's foreground/muted/border vars), so it survives black-and-white printing.
 */
import type { ReactElement, ReactNode } from 'react'

const FG = 'var(--foreground)'
const MUTED = 'var(--muted-foreground)'
const ACCENT = 'var(--primary)'

function Frame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <svg viewBox="0 0 340 120" width="100%" style={{ maxWidth: 360, height: 'auto' }} role="img" aria-label={label ?? 'diagram'}>
      {children}
    </svg>
  )
}

const DIAGRAMS: Record<string, ReactElement> = {
  // Number sense — place value chart
  NS1: (
    <Frame label="place value">
      {['thousands', 'hundreds', 'tens', 'ones'].map((lbl, i) => (
        <g key={lbl}>
          <rect x={30 + i * 70} y="30" width="60" height="44" fill="none" stroke={FG} strokeWidth="1.5" rx="4" />
          <text x={60 + i * 70} y="60" fontSize="22" fill={FG} textAnchor="middle" fontFamily="Georgia, serif">{['8', '5', '0', '0'][i]}</text>
          <text x={60 + i * 70} y="90" fontSize="10" fill={MUTED} textAnchor="middle">{lbl}</text>
        </g>
      ))}
      <text x="30" y="20" fontSize="13" fill={ACCENT}>8,500 — each spot is 10× the one to its right</text>
    </Frame>
  ),
  // Number sense — fraction = decimal = percent
  NS2: (
    <Frame label="fraction decimal percent">
      <rect x="30" y="40" width="240" height="34" fill="none" stroke={FG} strokeWidth="1.5" />
      <rect x="30" y="40" width="180" height="34" fill={ACCENT} opacity="0.25" />
      <line x1="90" y1="40" x2="90" y2="74" stroke={FG} strokeWidth="1" />
      <line x1="150" y1="40" x2="150" y2="74" stroke={FG} strokeWidth="1" />
      <line x1="210" y1="40" x2="210" y2="74" stroke={FG} strokeWidth="1" />
      <text x="30" y="30" fontSize="14" fill={FG}>3 of 4 parts shaded</text>
      <text x="30" y="98" fontSize="15" fill={ACCENT} fontFamily="Georgia, serif">3/4  =  0.75  =  75%</text>
    </Frame>
  ),
  // Proportional reasoning — two equal ratios, cross-scaled
  PR1: (
    <Frame label="ratio scaling">
      <text x="20" y="50" fontSize="15" fill={FG} fontFamily="Georgia, serif">old amount</text>
      <text x="34" y="78" fontSize="15" fill={FG} fontFamily="Georgia, serif">14 d</text>
      <line x1="20" y1="58" x2="120" y2="58" stroke={FG} strokeWidth="1.5" />
      <text x="135" y="64" fontSize="18" fill={FG}>=</text>
      <text x="170" y="50" fontSize="15" fill={FG} fontFamily="Georgia, serif">new amount</text>
      <text x="188" y="78" fontSize="15" fill={FG} fontFamily="Georgia, serif">49 d</text>
      <line x1="170" y1="58" x2="280" y2="58" stroke={FG} strokeWidth="1.5" />
      <text x="120" y="105" fontSize="13" fill={ACCENT}>× 3.5 (49 ÷ 14) scales BOTH</text>
    </Frame>
  ),
  // Inverse-square — half the distance, four times the value
  PR2: (
    <Frame label="inverse square">
      <circle cx="30" cy="60" r="9" fill={ACCENT} />
      <line x1="39" y1="60" x2="150" y2="60" stroke={MUTED} strokeWidth="1.5" />
      <text x="80" y="50" fontSize="12" fill={MUTED}>d</text>
      <text x="155" y="64" fontSize="14" fill={FG}>12 N/kg</text>
      <line x1="39" y1="92" x2="260" y2="92" stroke={MUTED} strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="150" y="86" fontSize="12" fill={MUTED}>2d</text>
      <text x="265" y="96" fontSize="14" fill={FG}>3 N/kg</text>
      <text x="40" y="22" fontSize="13" fill={ACCENT}>2× farther → ¼ as strong (÷ 2²)</text>
    </Frame>
  ),
  // Scientific notation — move the decimal
  QE1: (
    <Frame label="scientific notation">
      <text x="20" y="55" fontSize="22" fill={FG} fontFamily="Georgia, serif">8500.</text>
      <path d="M40 40 q40 -22 78 0" fill="none" stroke={ACCENT} strokeWidth="1.5" markerEnd="url(#arr)" />
      <text x="150" y="60" fontSize="22" fill={FG}>→</text>
      <text x="185" y="55" fontSize="22" fill={FG} fontFamily="Georgia, serif">8.5 × 10³</text>
      <text x="20" y="95" fontSize="13" fill={MUTED}>move decimal 3 places left → power +3</text>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill={ACCENT} />
        </marker>
      </defs>
    </Frame>
  ),
  // Units cancel
  QE2: (
    <Frame label="unit cancellation">
      <text x="30" y="60" fontSize="20" fill={FG} fontFamily="Georgia, serif">m/s × s = m</text>
      <line x1="92" y1="52" x2="120" y2="40" stroke={ACCENT} strokeWidth="2" />
      <line x1="150" y1="60" x2="172" y2="44" stroke={ACCENT} strokeWidth="2" />
      <text x="30" y="95" fontSize="13" fill={MUTED}>the s&apos;s cancel — the unit that&apos;s left checks your answer</text>
    </Frame>
  ),
  // Order of magnitude
  QE3: (
    <Frame label="order of magnitude">
      <line x1="20" y1="60" x2="320" y2="60" stroke={FG} strokeWidth="1.5" />
      {['10¹⁸', '10¹⁹', '10²⁰', '10²¹'].map((t, i) => (
        <g key={t}>
          <line x1={40 + i * 90} y1="54" x2={40 + i * 90} y2="66" stroke={FG} strokeWidth="1.5" />
          <text x={40 + i * 90 - 12} y="84" fontSize="13" fill={MUTED}>{t}</text>
        </g>
      ))}
      <circle cx="155" cy="60" r="6" fill={ACCENT} />
      <text x="120" y="40" fontSize="13" fill={ACCENT}>≈ 5 × 10¹⁹ J</text>
    </Frame>
  ),
  // Significant figures
  QE4: (
    <Frame label="significant figures">
      <text x="40" y="58" fontSize="24" fill={FG} fontFamily="Georgia, serif">1.47</text>
      <text x="103" y="58" fontSize="24" fill={MUTED} textDecoration="line-through">32</text>
      <text x="150" y="58" fontSize="22" fill={FG}>→ 1.47 m/s</text>
      <text x="40" y="92" fontSize="13" fill={MUTED}>keep only the digits the data can be trusted to</text>
    </Frame>
  ),
  // Rearrange
  SM1: (
    <Frame label="rearrange">
      <text x="20" y="48" fontSize="17" fill={FG} fontFamily="Georgia, serif">v² = v₀² + 2ax</text>
      <text x="20" y="78" fontSize="17" fill={ACCENT} fontFamily="Georgia, serif">x = (v² − v₀²) / 2a</text>
      <text x="200" y="64" fontSize="13" fill={MUTED}>isolate x</text>
      <path d="M180 56 l14 0" stroke={MUTED} strokeWidth="1.5" markerEnd="url(#arr2)" />
      <defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill={MUTED} /></marker></defs>
      <text x="20" y="104" fontSize="13" fill={MUTED}>solve for the symbol BEFORE plugging in numbers</text>
    </Frame>
  ),
  // Substitute
  SM2: (
    <Frame label="substitute">
      <text x="20" y="48" fontSize="18" fill={FG} fontFamily="Georgia, serif">F = m · a</text>
      <text x="20" y="78" fontSize="18" fill={ACCENT} fontFamily="Georgia, serif">F = (1200 kg)(3.5 m/s²)</text>
      <text x="20" y="104" fontSize="15" fill={FG} fontFamily="Georgia, serif">= 4200 N</text>
      <text x="210" y="48" fontSize="13" fill={MUTED}>keep the units</text>
    </Frame>
  ),
  // Read graph slope
  GV1: (
    <Frame label="slope">
      <line x1="40" y1="100" x2="40" y2="20" stroke={FG} strokeWidth="1.5" />
      <line x1="40" y1="100" x2="300" y2="100" stroke={FG} strokeWidth="1.5" />
      <line x1="50" y1="92" x2="250" y2="36" stroke={ACCENT} strokeWidth="2.5" />
      <line x1="150" y1="64" x2="250" y2="64" stroke={MUTED} strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="250" y1="64" x2="250" y2="36" stroke={MUTED} strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="185" y="60" fontSize="12" fill={MUTED}>run</text>
      <text x="255" y="54" fontSize="12" fill={MUTED}>rise</text>
      <text x="120" y="22" fontSize="13" fill={ACCENT}>slope = rise/run = velocity</text>
    </Frame>
  ),
  // Linearize
  GV2: (
    <Frame label="linearize">
      <line x1="40" y1="100" x2="40" y2="20" stroke={FG} strokeWidth="1.5" />
      <line x1="40" y1="100" x2="300" y2="100" stroke={FG} strokeWidth="1.5" />
      <line x1="40" y1="100" x2="270" y2="34" stroke={ACCENT} strokeWidth="2" />
      {[[70, 88], [110, 76], [150, 64], [190, 53], [230, 42]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={FG} />
      ))}
      <text x="300" y="104" fontSize="12" fill={MUTED}>F</text>
      <text x="30" y="20" fontSize="12" fill={MUTED}>a</text>
      <text x="120" y="22" fontSize="13" fill={ACCENT}>straight line → slope = 1/mass</text>
    </Frame>
  ),
  // Vector components
  GV3: (
    <Frame label="vector components">
      <line x1="40" y1="100" x2="220" y2="30" stroke={ACCENT} strokeWidth="2.5" markerEnd="url(#arr3)" />
      <line x1="40" y1="100" x2="220" y2="100" stroke={MUTED} strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="220" y1="100" x2="220" y2="30" stroke={MUTED} strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="120" y="116" fontSize="12" fill={MUTED}>x = v·cos θ</text>
      <text x="226" y="70" fontSize="12" fill={MUTED}>y = v·sin θ</text>
      <text x="60" y="92" fontSize="12" fill={FG}>θ</text>
      <text x="120" y="50" fontSize="13" fill={ACCENT}>v</text>
      <defs><marker id="arr3" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill={ACCENT} /></marker></defs>
    </Frame>
  ),
}

export default function MathSpineDiagram({ code }: { code: string | undefined | null }) {
  if (!code || !DIAGRAMS[code]) return null
  return <div className="my-2">{DIAGRAMS[code]}</div>
}
