import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#22c55e',
}

const RISK_BG = {
  CRITICAL: 'rgba(239,68,68,0.08)',
  HIGH:     'rgba(249,115,22,0.08)',
  MEDIUM:   'rgba(234,179,8,0.08)',
  LOW:      'rgba(34,197,94,0.08)',
}

function fmtRev(v) {
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`
  return `$${(v/1e3).toFixed(0)}K`
}

const BENFORD_ORDER = { FAIL: 3, WARN: 2, PASS: 1 }

export default function CompanyComparison({ summaries }) {
  if (!summaries?.length) return (
    <div className="text-slate-500 text-xs font-mono p-8 text-center">Loading portfolio data...</div>
  )

  // Build radar data: invert so LOW risk = large area
  const radarData = [
    { metric: 'Benford Score' },
    { metric: 'Anomaly Count' },
    { metric: 'Risk Score' },
    { metric: 'Revenue Scale' },
  ]
  const maxAnomaly = Math.max(...summaries.map(s => s.anomaly_count), 1)
  const maxRev     = Math.max(...summaries.map(s => s.latest_revenue), 1)

  const COLORS = ['#3b82f6','#22c55e','#a78bfa','#f59e0b','#f97316']

  return (
    <div className="fade-up space-y-8">
      {/* Risk heatmap table */}
      <div>
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Risk Heatmap — All Companies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1a2535]">
                {['Rank','Company','Sector','Risk Score','Level','Benford','Anomalies','Q4 Revenue','Top Flag'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-slate-600 font-normal text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaries.map((s, i) => (
                <tr key={s.id} className="border-b border-[#0d1520] hover:bg-white/3 transition-colors">
                  <td className="py-3 px-3 text-slate-600">#{i+1}</td>
                  <td className="py-3 px-3 text-white font-medium">{s.name}</td>
                  <td className="py-3 px-3 text-slate-400">{s.sector}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#1a2535] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width:`${s.risk_score}%`,
                          background: RISK_COLORS[s.risk_level]
                        }}/>
                      </div>
                      <span className="font-bold" style={{ color: RISK_COLORS[s.risk_level] }}>{s.risk_score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
                      color: RISK_COLORS[s.risk_level],
                      background: RISK_BG[s.risk_level],
                    }}>{s.risk_level}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold ${
                      s.benford_verdict === 'FAIL' ? 'text-red-400' :
                      s.benford_verdict === 'WARN' ? 'text-yellow-400' : 'text-green-400'
                    }`}>{s.benford_verdict}</span>
                  </td>
                  <td className={`py-3 px-3 font-bold ${s.anomaly_count > 8 ? 'text-red-400' : s.anomaly_count > 4 ? 'text-orange-400' : 'text-slate-300'}`}>
                    {s.anomaly_count}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{fmtRev(s.latest_revenue)}</td>
                  <td className="py-3 px-3 text-slate-500 max-w-xs truncate text-[10px]">{s.top_flags?.[0] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score cards */}
      <div>
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Risk Score Distribution</h3>
        <div className="grid grid-cols-5 gap-3">
          {summaries.map((s, i) => (
            <div key={s.id} className="rounded-lg border p-4 text-center" style={{
              background: RISK_BG[s.risk_level],
              borderColor: RISK_COLORS[s.risk_level] + '40',
            }}>
              <div className="text-2xl font-display font-bold" style={{ color: RISK_COLORS[s.risk_level] }}>
                {s.risk_score}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 leading-tight">
                {s.name.split(' ').slice(0,2).join(' ')}
              </div>
              <div className="text-[10px] font-mono mt-1.5 font-bold" style={{ color: RISK_COLORS[s.risk_level] }}>
                {s.risk_level}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
