import { AlertTriangle, BarChart3, Building2, Grid3x3 } from 'lucide-react'

const NAV = [
  { id: 'overview',    label: 'Portfolio Overview', icon: Grid3x3 },
  { id: 'company',     label: 'Company Analysis',   icon: Building2 },
  { id: 'benford',     label: "Benford's Law",       icon: BarChart3 },
  { id: 'anomalies',   label: 'Anomaly Detector',    icon: AlertTriangle },
]

const RISK_COLORS = {
  CRITICAL: 'text-red-400',
  HIGH:     'text-orange-400',
  MEDIUM:   'text-yellow-400',
  LOW:      'text-green-400',
}

const RISK_BG = {
  CRITICAL: 'bg-red-500/10 border-red-500/30',
  HIGH:     'bg-orange-500/10 border-orange-500/30',
  MEDIUM:   'bg-yellow-500/10 border-yellow-500/30',
  LOW:      'bg-green-500/10 border-green-500/30',
}

export default function Sidebar({ view, setView, companies, selectedId, setSelectedId, summaries }) {
  return (
    <aside className="w-64 min-h-screen bg-[#0a0f16] border-r border-[#1a2535] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#1a2535]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-xs font-display font-800 text-white">AL</span>
          </div>
          <span className="font-display text-lg font-bold text-white tracking-tight">AuditLens</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">Financial Risk Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left w-full
              ${view === id
                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Icon size={15} />
            <span className="font-mono text-xs">{label}</span>
          </button>
        ))}
      </nav>

      {/* Company list */}
      <div className="px-3 mt-2 flex-1">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-2">Companies</p>
        <div className="flex flex-col gap-1">
          {companies.map(c => {
            const s = summaries?.find(x => x.id === c.id)
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setView('company') }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all w-full
                  ${selectedId === c.id
                    ? 'bg-[#1a2535] border border-[#2a3a55]'
                    : 'hover:bg-white/5'}`}
              >
                <div>
                  <p className={`text-xs font-mono ${selectedId === c.id ? 'text-white' : 'text-slate-300'}`}>
                    {c.name.split(' ').slice(0,2).join(' ')}
                  </p>
                  <p className="text-[10px] text-slate-600">{c.sector}</p>
                </div>
                {s && (
                  <span className={`text-[10px] font-mono font-bold ${RISK_COLORS[s.risk_level]}`}>
                    {s.risk_score}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[#1a2535]">
        <p className="text-[10px] text-slate-600">Data: 2022–2024 synthetic</p>
        <p className="text-[10px] text-slate-600">5 companies · 4,000 txns</p>
      </div>
    </aside>
  )
}
