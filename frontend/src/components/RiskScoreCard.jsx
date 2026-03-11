import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

const CFG = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  icon: ShieldX,     label: 'CRITICAL RISK' },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)', icon: ShieldAlert, label: 'HIGH RISK' },
  MEDIUM:   { color: '#eab308', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.3)',  icon: Shield,      label: 'MEDIUM RISK' },
  LOW:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.3)',  icon: ShieldCheck, label: 'LOW RISK' },
}

function GaugeArc({ score, color }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const arc  = circ * 0.75
  const fill = arc * (score / 100)
  const offset = circ * 0.125

  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      <circle cx="70" cy="80" r={r} fill="none" stroke="#1a2535" strokeWidth="10"
        strokeDasharray={`${arc} ${circ - arc}`} strokeDashoffset={-offset}
        strokeLinecap="round" />
      <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={-offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}80)` }} />
      <text x="70" y="74" textAnchor="middle" fill="white" fontSize="22"
        fontFamily="Syne, sans-serif" fontWeight="700">{score}</text>
      <text x="70" y="88" textAnchor="middle" fill="#64748b" fontSize="9"
        fontFamily="DM Mono, monospace">/ 100</text>
    </svg>
  )
}

export default function RiskScoreCard({ risk }) {
  if (!risk) return null
  const cfg = CFG[risk.risk_level] || CFG.LOW
  const Icon = cfg.icon

  return (
    <div className="rounded-xl border p-5 fade-up" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Audit Risk Score</p>
          <div className="flex items-center gap-2 mt-1">
            <Icon size={16} style={{ color: cfg.color }} />
            <span className="text-sm font-display font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-2">
        <GaugeArc score={risk.overall_score} color={cfg.color} />
      </div>

      {/* Component breakdown */}
      <div className="mt-3 flex flex-col gap-2">
        {Object.entries(risk.components).map(([key, val]) => {
          const w = risk.weights[key] * 100
          return (
            <div key={key}>
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-slate-400 capitalize">{key.replace('_',' ')}</span>
                <span className="text-slate-300">{val.toFixed(1)} <span className="text-slate-600">× {w}%</span></span>
              </div>
              <div className="h-1 bg-[#1a2535] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(val,100)}%`,
                  background: val > 65 ? cfg.color : val > 35 ? '#eab308' : '#22c55e',
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Flags */}
      {risk.top_flags?.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Key Findings</p>
          {risk.top_flags.map((f, i) => (
            <div key={i} className="text-[11px] font-mono text-slate-300 bg-black/20 rounded px-2.5 py-1.5 border border-white/5 leading-relaxed">
              ↳ {f}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
