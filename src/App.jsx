import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Footer from './components/Footer.jsx'
import { BloomFieldGradient } from './components/ui/bloom-field-gradient.jsx'
import './styles/hero.css'

export default function App() {
  return (
    <>
      {/* The animated Bloom Field mesh, fixed behind the page and owning the
          whole surface — it is the only thing the backdrop is made of. */}
      <div className="backdrop" aria-hidden="true">
        <BloomFieldGradient className="backdrop__field" />
      </div>

      <div className="page">
        <Navbar />
        <Hero />
        <Footer />
      </div>
    </>
  )
}
