import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const SERIES = [
  { key: 'threads',   color: '#7c3aed', label: 'Threads'   },
  { key: 'replies',   color: '#10b981', label: 'Replies'   },
  { key: 'resources', color: '#f59e0b', label: 'Resources' },
]

function formatTick(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${m}/${d}`
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="activity-chart-tooltip">
      <p className="activity-chart-tooltip-label">{label}</p>
      {payload.map(({ name, value, color }) => (
        <div key={name} className="activity-chart-tooltip-row">
          <span style={{ color }}>{name}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function ActivityChart({ token }) {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(thirtyAgo)
  const [endDate, setEndDate] = useState(today)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ startDate, endDate })
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined
        const res = await fetch(`/api/analytics/activity?${params}`, headers ? { headers } : undefined)
        const data = await res.json()
        if (!res.ok) return

        const dateMap = {}
        const addToMap = (arr, key) => {
          ;(arr || []).forEach(({ _id, count }) => {
            if (!dateMap[_id]) dateMap[_id] = { date: _id }
            dateMap[_id][key] = count
          })
        }
        addToMap(data.threads, 'threads')
        addToMap(data.replies, 'replies')
        addToMap(data.resources, 'resources')

        const sorted = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date))
        setChartData(sorted)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchActivity()
  }, [token, startDate, endDate])

  return (
    <div className="activity-chart-section">
      <div className="activity-chart-header">
        <h3>Activity Over Time</h3>
        <div className="activity-chart-filters">
          <label>From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {loading && <p className="panel-message activity-chart-message">Loading activity...</p>}

      {!loading && chartData.length === 0 && (
        <p className="panel-message activity-chart-message">No activity data for this period.</p>
      )}

      {!loading && chartData.length > 0 && (
        <div className="activity-chart-canvas">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: -10, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ec" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '0.78rem', paddingTop: '8px' }}
              />
              {SERIES.map(({ key, color, label }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
