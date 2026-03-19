function CourseCard({ code, title, description }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', width: '260px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#e0e0e0', height: '100px', borderRadius: '4px', marginBottom: '10px', flexShrink: 0 }} />
      <strong style={{ fontSize: '14px', color: '#888' }}>{code}</strong>
      <p style={{ fontSize: '16px', fontWeight: '600', color: '#213547', margin: '4px 0 2px' }}>{title}</p>
      <p style={{ fontSize: '12px', color: '#555', margin: '4px 0', flex: 1 }}>{description}</p>
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
        <button>Discussion</button>
        <button>Resources</button>
      </div>
    </div>
  )
}
export default CourseCard