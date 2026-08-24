import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Footer from './components/Footer.jsx'
import CrtFilters from './components/CrtFilters.jsx'
import { GradientBackground } from '@/components/ui/bloom-field-gradient'
import './styles/hero.css'

export default function App() {
  return (
    <>
      {/* Wrapped rather than restyled: GradientBackground sets
          `position: relative` as an INLINE style, which beats any class, so
          passing className="backdrop" left it in flow as a fourth grid row
          and collapsed the layout. The wrapper does the positioning and the
          component just fills it. */}
      <div className="backdrop" aria-hidden="true">
        <GradientBackground />
      </div>

      <div className="page">
        <CrtFilters />
        <Navbar />
        <Hero />
        <Footer />
      </div>
    </>
  )
}
