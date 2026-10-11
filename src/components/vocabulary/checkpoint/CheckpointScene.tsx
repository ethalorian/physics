import s from './checkpoint.module.css'

export default function CheckpointScene({ kind }: { kind: 'roundtrip' | 'track' }) {
  return <figure className={s.scene}>
    {kind === 'roundtrip' ? <svg viewBox="0 0 620 135" role="img" aria-label="The rover travels from its starting point to a marker, then returns to the same starting point.">
      <path d="M90 46 H521 l-12 -8 m12 8 l-12 8" fill="none" stroke="var(--primary)" strokeWidth="3" />
      <path d="M525 80 H94 l12 -8 m-12 8 l12 8" fill="none" stroke="var(--muted-foreground)" strokeWidth="3" />
      <circle cx="80" cy="63" r="9" fill="var(--primary)" /><path d="M541 34 V92 M541 34 h20 l-8 8 8 8 h-20" fill="none" stroke="var(--foreground)" strokeWidth="2" />
      <text x="307" y="29" textAnchor="middle">outward trip</text><text x="307" y="108" textAnchor="middle">return trip</text>
      <text x="80" y="128" textAnchor="middle">start &amp; finish</text><text x="549" y="128" textAnchor="middle">marker</text>
    </svg> : <svg viewBox="0 0 620 110" role="img" aria-label="A cart is four meters east of the doorway, which is the zero reference point.">
      <path d="M65 60 H560 l-10 -7 m10 7 l-10 7" stroke="var(--muted-foreground)" strokeWidth="2" fill="none" />
      {[0, 1, 2, 3, 4].map((n) => <g key={n}><path d={`M${75+n*100} 52 V68`} stroke="var(--foreground)" /><text x={75+n*100} y="91" textAnchor="middle">{n} m</text></g>)}
      <path d="M60 45 V15 H90 V45" stroke="var(--foreground)" strokeWidth="2" fill="none" />
      <rect x="452" y="24" width="46" height="22" rx="4" fill="var(--primary)" /><circle cx="462" cy="49" r="5" fill="var(--foreground)" /><circle cx="488" cy="49" r="5" fill="var(--foreground)" />
      <text x="565" y="42" textAnchor="end">east →</text>
    </svg>}
  </figure>
}
