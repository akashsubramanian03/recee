export default function Footer() {
  return (
    <footer className="footer">
      {/* Sits on the same 12 columns as the stage so the closing lines land
          under the centre column rather than floating free of the grid. */}
      <div className="footer__inner">
        <p>Recee &copy; 2024 &middot; All rights reserved</p>
        <p>Celebrating stories. Creating community.</p>
      </div>
    </footer>
  )
}
