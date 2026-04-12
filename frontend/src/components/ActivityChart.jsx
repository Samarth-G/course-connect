import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
          (arr || []).forEach(({ _id, count }) => {
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
      <h3>Activity Over Time</h3>

      <div className="activity-chart-filters">
        <label>From</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>To</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {loading && <p className="panel-message">Loading activity...</p>}

      {!loading && chartData.length === 0 && (
        <p className="panel-message">No activity data for this period.</p>
      )}

      {!loading && chartData.length > 0 && (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="threads" stroke="#4f46e5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="replies" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resources" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
