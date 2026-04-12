import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function HotThreads() {
  const [hotThreads, setHotThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHot() {
      try {
        const res = await fetch('/api/analytics/hot-threads?limit=3&days=7')
        const data = await res.json()
        if (res.ok && Array.isArray(data.results)) {
          setHotThreads(data.results)
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchHot()
  }, [])

  if (loading) return null
  if (hotThreads.length === 0) return null

  const chartData = hotThreads.map((t, i) => ({
    name: t.title.length > 20 ? t.title.slice(0, 20) + '...' : t.title,
    replies: t.recentReplyCount,
  }))

  return (
    <div className="hot-threads-section">
      <h3>🔥 Trending Threads (Last 7 Days)</h3>

      <ul className="hot-thread-list">
        {hotThreads.map((t, idx) => (
          <li key={t._id} className="hot-thread-item">
            <span className="hot-thread-rank">#{idx + 1}</span>
            <div className="hot-thread-info">
              <div className="hot-thread-title">{t.title}</div>
              <div className="hot-thread-meta">{t.courseId} · {t.authorName}</div>
            </div>
            <span className="hot-thread-replies">{t.recentReplyCount} recent {t.recentReplyCount === 1 ? 'reply' : 'replies'}</span>
          </li>
        ))}
      </ul>

      {hotThreads.length > 1 && (
        <div style={{ width: '100%', height: 90, marginTop: 8 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 16, top: 2, bottom: 2 }} barSize={10}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="replies" fill="#4f46e5" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
