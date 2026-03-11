import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'

const METHOD_COLORS = {
  'Z-Score': 'text-purple-400 bg-purple-400/10',
  'IQR':     'text-cyan-400 bg-cyan-400/10',
}

function fmt(val, metric) {
  if (metric.includes('margin')) return `${val.toFixed(1)}%`
  if (Math.abs(val) >= 1e6) return `$${(val/1e6).toFixed(2)}M`
  if (Math.abs(val) >= 1e3) return `$${(val/1e3).toFixed(1)}K`
  return `$${val.toFixed(2)}`
}

export default function AnomalyTable({ data }) {
  if (!data) return null
  const { anomaly_count, anomalies } = data
  if (!anomalies?.length) return (
    <div className="text-green-400 text-xs font-mono p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
      ✓ No financial anomalies detected across all metrics.
    </div>
  )

  return (
    <div className="fade-up">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={14} className="text-orange-400" />
        <span className="text-sm font-mono text-slate-300">
          <strong className="text-white">{anomaly_count}</strong> anomalies detected
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1a2535]">
              {['Metric','Quarter','Value','vs Avg','Δ%','Method','Signal'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-slate-600 font-normal text-[10px] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {anomalies.slice(0,20).map((a, i) => (
              <tr key={i} className="border-b border-[#0d1520] hover:bg-white/3 transition-colors">
                <td className="py-2.5 px-3 text-slate-300">{a.metric_label}</td>
                <td className="py-2.5 px-3 text-slate-400">{a.quarter}</td>
                <td className="py-2.5 px-3 text-white font-medium">{fmt(a.value, a.metric)}</td>
                <td className="py-2.5 px-3 text-slate-500">{fmt(a.mean_value, a.metric)}</td>
                <td className={`py-2.5 px-3 font-bold ${a.direction === 'above' ? 'text-red-400' : 'text-blue-400'}`}>
                  <span className="flex items-center gap-1">
                    {a.direction === 'above' ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                    {a.direction === 'above' ? '+' : ''}{a.pct_diff}%
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${METHOD_COLORS[a.method] || 'text-slate-400'}`}>
                    {a.method}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {a.z_score && (
                    <span className={`text-[10px] ${Math.abs(a.z_score) > 3.5 ? 'text-red-400' : 'text-orange-400'}`}>
                      z={a.z_score}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
