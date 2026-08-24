export default function Footer() {
  return (
    <footer className="footer">
      {/* Split to the page margins rather than centred: the description sits
          under the left corner block, the legal line under the right one, so
          the footer closes the same frame the corner brackets open. */}
      <p className="footer__note">
        Recee is a cinema community that believes
        <br />
        every film watched together is a story created.
      </p>

      <p className="footer__legal">&copy; 2024 Recee. All rights reserved.</p>
    </footer>
  )
}
