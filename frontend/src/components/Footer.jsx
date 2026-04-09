function Footer() {
  return (
    <footer className="site-footer">
      <nav className="social-links" aria-label="Social">
        <a href="https://x.com" target="_blank" rel="noreferrer">X</a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer">IG</a>
        <a href="https://youtube.com" target="_blank" rel="noreferrer">YT</a>
        <a href="https://linkedin.com" target="_blank" rel="noreferrer">in</a>
      </nav>

      <div className="footer-links">
        <a href="/about">About</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </div>
    </footer>
  )
}

export default Footer