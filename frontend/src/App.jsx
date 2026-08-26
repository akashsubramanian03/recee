import { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import HeroMeta from './components/Footer.jsx'
import BentoGrid from './components/BentoGrid.jsx'
import './styles/hero.css'
import './styles/bento.css'

export default function App() {
  /* Two pieces of state rather than one: the nav tab drives the RIGHT column
     and the join form the LEFT, and on desktop either can change without
     disturbing the other — opening the form while reading Meetups leaves the
     mosaic on Meetups. */
  const [section, setSection] = useState('home')
  const [joining, setJoining] = useState(false)

  /* Which way round the mosaic is laid out. It is RELATIVE, not a property of
     the section: every move flips it, so wherever you are, going somewhere
     else rearranges the page. Stored per section instead, About and Meetups
     would both be permanently mirrored and moving between those two would
     change nothing. */
  const [flipped, setFlipped] = useState(false)

  const selectSection = (slug) => {
    /* Only an actual move flips it — re-clicking the tab you are already on
       is not going anywhere. */
    if (slug !== section) setFlipped((f) => !f)
    setSection(slug)
    /* Choosing a section also closes the form. On mobile a section takes the
       whole page and the hero — which is where the form lives — is not
       rendered, so leaving `joining` set would strand it in a hidden column. */
    setJoining(false)
  }

  /* Which of the three regions mobile shows. Desktop shows all of them at
     once and ignores this entirely; it exists because CSS cannot ask what the
     active section is. */
  const view = joining ? 'joining' : section === 'home' ? 'home' : 'section'

  return (
    <>
      {/* The brushed-aluminium desktop, fixed behind the page. Pure CSS —
          every panel above floats on it. */}
      <div className="backdrop" aria-hidden="true" />

      <div className="page">
        <Navbar
          section={section}
          onSelectSection={selectSection}
          onJoin={() => setJoining(true)}
        />

        {/* On a phone the three regions are stacked and only one of them is
            wanted at a time — the landing pitch, a chosen section, or the join
            form. `body--*` is how the CSS knows which; see global.css. Desktop
            shows the hero and the mosaic side by side regardless. */}
        <main className={`body body--${view}`}>
          {/* The hero and the meta row are ONE panel on desktop and two
              separate ones on mobile, where the meta row also has to move
              below the mosaic. `.hero-col` is that switch: a real panel here,
              `display: contents` there — which dissolves the wrapper so its
              two children become grid items of .body and can be reordered
              around the mosaic independently. */}
          <div className="hero-col panel">
            <Hero
              joining={joining}
              onJoin={() => setJoining(true)}
              onCancelJoin={() => setJoining(false)}
            />
            <HeroMeta />
          </div>

          <BentoGrid section={section} flipped={flipped} />
        </main>
      </div>
    </>
  )
}
