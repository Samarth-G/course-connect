function Footer() {
  return (
    <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #eee' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <span>𝕏</span>
        <span>📷</span>
        <span>▶</span>
        <span>in</span>
      </div>
      <div style={{ display: 'flex', gap: '32px' }}>
        <a href="/about">About</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </div>
    </footer>
  )
}
export default Footer