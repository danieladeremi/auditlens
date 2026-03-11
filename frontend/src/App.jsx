import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import RiskScoreCard from './components/RiskScoreCard.jsx'
import BenfordChart from './components/BenfordChart.jsx'
import AnomalyTable from './components/AnomalyTable.jsx'
import TrendChart from './components/TrendChart.jsx'
import CompanyComparison from './components/CompanyComparison.jsx'
import { fetchCompanies, fetchSummary, fetchBenford, fetchAnomalies, fetchRisk, fetchFinancials, fetchTxnSummary } from './api/client.js'
import { RefreshCw, Building2 } from 'lucide-react'

function Section({ title, children }) {
  return (
    <div className="bg-[#0a0f16] border border-[#1a2535] rounded-xl p-6">
      <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3 text-slate-500 font-mono text-sm">
        <RefreshCw size={14} className="animate-spin" />
        Loading...
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('overview')
  const [companies, setCompanies] = useState([])
  const [summaries, setSummaries] = useState([])
  const [selectedId, setSelectedId] = useState('C001')
  const [loading, setLoading] = useState(false)

  // Per-company data
  const [benford, setBenford]     = useState(null)
  const [anomalyData, setAnomaly] = useState(null)
  const [riskData, setRisk]       = useState(null)
  const [finData, setFin]         = useState(null)

  useEffect(() => {
    fetchCompanies().then(setCompanies)
    fetchSummary().then(setSummaries)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    Promise.all([
      fetchBenford(selectedId),
      fetchAnomalies(selectedId),
      fetchRisk(selectedId),
      fetchFinancials(selectedId),
    ]).then(([b, a, r, f]) => {
      setBenford(b); setAnomaly(a); setRisk(r); setFin(f)
      setLoading(false)
    })
  }, [selectedId])

  const company = companies.find(c => c.id === selectedId)

  return (
    <div className="flex min-h-screen">
      <Sidebar
        view={view} setView={setView}
        companies={companies} selectedId={selectedId}
        setSelectedId={setSelectedId} summaries={summaries}
      />

      <main className="flex-1 p-8 overflow-auto">

        {/* OVERVIEW */}
        {view === 'overview' && (
          <div className="fade-up space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Portfolio Overview</h1>
              <p className="text-slate-500 text-sm font-mono mt-1">Audit risk intelligence across all monitored entities</p>
            </div>
            <Section title="Company Risk Comparison">
              <CompanyComparison summaries={summaries} />
            </Section>
          </div>
        )}

        {/* COMPANY ANALYSIS */}
        {view === 'company' && (
          <div className="space-y-6">
            <div className="fade-up">
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-blue-400" />
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">{company?.name}</h1>
                  <p className="text-slate-500 text-sm font-mono">{company?.sector} · {selectedId}</p>
                </div>
              </div>
            </div>

            {loading ? <Loader /> : (
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <RiskScoreCard risk={riskData} />
                </div>
                <div className="col-span-2 space-y-6">
                  <Section title="Financial Trends (2022–2024)">
                    <TrendChart financials={finData} anomalies={anomalyData} />
                  </Section>
                  <Section title="Top Anomalies">
                    <AnomalyTable data={anomalyData} />
                  </Section>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BENFORD */}
        {view === 'benford' && (
          <div className="space-y-6">
            <div className="fade-up">
              <h1 className="font-display text-2xl font-bold text-white">Benford's Law Analysis</h1>
              <p className="text-slate-500 text-sm font-mono mt-1">First-digit distribution test for financial data authenticity</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {loading ? <Loader /> : summaries.map(s => {
                const isSel = s.id === selectedId
                return (
                  <button key={s.id} onClick={() => setSelectedId(s.id)} className="text-left">
                    <Section title={`${s.name} · ${s.benford_verdict}`}>
                      {isSel && benford
                        ? <BenfordChart data={benford} />
                        : <div className="text-slate-600 text-xs font-mono">Click to load Benford analysis</div>
                      }
                    </Section>
                  </button>
                )
              })}
            </div>

            {selectedId && !loading && (
              <Section title={`${company?.name} — Benford Detail`}>
                <BenfordChart data={benford} />
              </Section>
            )}
          </div>
        )}

        {/* ANOMALIES */}
        {view === 'anomalies' && (
          <div className="space-y-6">
            <div className="fade-up">
              <h1 className="font-display text-2xl font-bold text-white">Anomaly Detector</h1>
              <p className="text-slate-500 text-sm font-mono mt-1">
                Z-Score and IQR outlier detection across quarterly financial metrics
              </p>
            </div>

            {/* Company selector strip */}
            <div className="flex gap-2 flex-wrap">
              {summaries.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono border transition-all ${
                    s.id === selectedId
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                      : 'border-[#1a2535] text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {s.name.split(' ').slice(0,2).join(' ')}
                  {s.anomaly_count > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      s.anomaly_count > 8 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>{s.anomaly_count}</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? <Loader /> : (
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <Section title="Financial Trends">
                    <TrendChart financials={finData} anomalies={anomalyData} />
                  </Section>
                  <Section title={`Anomaly Log — ${company?.name}`}>
                    <AnomalyTable data={anomalyData} />
                  </Section>
                </div>
                <div className="col-span-1">
                  <RiskScoreCard risk={riskData} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
