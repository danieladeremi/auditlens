import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'

const METRICS = [
  { key: 'revenue',      label: 'Revenue',       color: '#3b82f6' },
  { key: 'gross_profit', label: 'Gross Profit',  color: '#22c55e' },
  { key: 'ebitda',       label: 'EBITDA',        color: '#a78bfa' },
  { key: 'net_income',   label: 'Net Income',    color: '#f59e0b' },
  { key: 'gross_margin', label: 'Gross Margin %',color: '#06b6d4' },
  { key: 'net_margin',   label: 'Net Margin %',  color: '#f97316' },
]

function fmtVal(v, isMargin) {
  if (isMargin) return `${v.toFixed(1)}%`
  if (Math.abs(v) >= 1e6) return `$${(v/1e6).toFixed(2)}M`
  return `$${(v/1e3).toFixed(1)}K`
}

const CustomTooltip = ({ active, payload, label, isMargin }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1520] border border-[#1a2535] rounded-lg p-3 text-xs font-mono">
      <p className="text-slate-400 mb-1">{label}</p>
      <p style={{ color: payload[0]?.color }} className="font-bold">
        {fmtVal(payload[0]?.value || 0, isMargin)}
      </p>
    </div>
  )
}

export default function TrendChart({ financials, anomalies }) {
  const [active, setActive] = useState('revenue')
  const m = METRICS.find(m => m.key === active)
  const isMargin = active.includes('margin')

  // Flag quarters with anomalies for this metric
  const flagged = new Set(
    (anomalies?.anomalies || [])
      .filter(a => a.metric === active)
      .map(a => a.quarter)
  )

  if (!financials?.length) return null

  return (
    <div className="fade-up">
      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all ${
              active === key
                ? 'border-transparent text-white'
                : 'border-[#1a2535] text-slate-500 hover:text-slate-300'
            }`}
            style={active === key ? { background: color + '22', borderColor: color + '66', color } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={financials} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
          <XAxis dataKey="quarter" tick={{ fill:'#64748b', fontSize:10, fontFamily:'DM Mono' }}
            interval={2} />
          <YAxis tick={{ fill:'#64748b', fontSize:10, fontFamily:'DM Mono' }}
            tickFormatter={v => fmtVal(v, isMargin)} width={60} />
          <Tooltip content={<CustomTooltip isMargin={isMargin} />} />
          <Line
            type="monotone" dataKey={active} stroke={m.color} strokeWidth={2}
            dot={({ cx, cy, payload }) => {
              const isFlagged = flagged.has(payload.quarter)
              return isFlagged
                ? <circle key={payload.quarter} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#0d1520" strokeWidth={2} />
                : <circle key={payload.quarter} cx={cx} cy={cy} r={3} fill={m.color} opacity={0.8} />
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {flagged.size > 0 && (
        <p className="text-[11px] font-mono text-red-400/70 mt-2">
          ● Red dots indicate anomaly-flagged quarters
        </p>
      )}
    </div>
  )
}
