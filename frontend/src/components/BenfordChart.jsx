import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const VERDICT_CFG = {
  PASS: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.3)',  label: 'PASS — Distribution conforms to Benford\'s Law' },
  WARN: { color: '#eab308', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.3)',  label: 'WARNING — Minor deviation detected' },
  FAIL: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  label: 'FAIL — Significant Benford\'s Law violation' },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1520] border border-[#1a2535] rounded-lg p-3 text-xs font-mono">
      <p className="text-slate-300 mb-1">Digit: <strong className="text-white">{label}</strong></p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value?.toFixed(2)}%</p>
      ))}
      {payload.length === 2 && (
        <p className="text-slate-500 mt-1">Δ {Math.abs(payload[0].value - payload[1].value).toFixed(2)}%</p>
      )}
    </div>
  )
}

export default function BenfordChart({ data }) {
  if (!data || data.error) return (
    <div className="text-slate-500 text-xs font-mono p-4">Insufficient data for Benford analysis.</div>
  )

  const cfg = VERDICT_CFG[data.verdict] || VERDICT_CFG.PASS
  const chartData = data.digits.map((d, i) => ({
    digit: `${d}`,
    'Observed %': data.observed_pct[i],
    'Benford Expected %': data.expected_pct[i],
  }))

  return (
    <div className="fade-up">
      {/* Verdict banner */}
      <div className="rounded-lg border px-4 py-3 mb-5 flex items-center justify-between"
        style={{ background: cfg.bg, borderColor: cfg.border }}>
        <span className="text-sm font-mono" style={{ color: cfg.color }}>{cfg.label}</span>
        <div className="flex gap-4 text-[11px] font-mono text-slate-400">
          <span>χ² = <strong className="text-slate-200">{data.chi2_stat}</strong></span>
          <span>p = <strong className="text-slate-200">{data.p_value}</strong></span>
          <span>MAD = <strong className="text-slate-200">{data.mad}</strong></span>
          <span>n = <strong className="text-slate-200">{data.sample_size?.toLocaleString()}</strong></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
          <XAxis dataKey="digit" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Mono' }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'DM Mono' }} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', color: '#94a3b8' }} />
          <Bar dataKey="Observed %" fill="#3b82f6" radius={[3,3,0,0]} opacity={0.9} />
          <Bar dataKey="Benford Expected %" fill="#1e3a5f" radius={[3,3,0,0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>

      <p className="text-[11px] font-mono text-slate-600 mt-3">
        Benford's Law predicts the natural frequency of leading digits in financial data.
        Significant deviation is a forensic indicator of potential data manipulation.
      </p>
    </div>
  )
}
