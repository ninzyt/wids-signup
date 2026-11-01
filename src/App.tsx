import type { ReactNode } from 'react'
import { SiteMenu } from '@/components/SiteMenu'
import widsLogo from '@/assets/WidsLogo.webp'
import { EventBoard } from '@/features/events/EventBoard'

// Set to false to keep every decorative sparkle still.
const ANIMATE_SPARKLES = true

function PixelFlower({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 20" className={className} fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M6 0h4v4h4v6h-4v4H6v-4H2V4h4z" />
      <path d="M6 5h4v4H6z" fill="var(--flower-center)" />
      <path d="M7 14h2v6H7zM3 15h4v2H3zM9 17h4v2H9z" fill="var(--stem)" />
    </svg>
  )
}

export default function App({ children }: { children?: ReactNode }) {
  return (
    <div>
      <div className={`wids-page${ANIMATE_SPARKLES ? ' sparkles-animated' : ''}`}>
        <div className="page-sparkles" aria-hidden="true">
          {['✦', '✧', '✦', '✧', '✦', '✧', '✦', '✧'].map((sparkle, index) =>
            <span key={index}>{sparkle}</span>,
          )}
        </div>
        <a className="skip-link" href="#main-content" onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}>Skip to content</a>
        <header className="site-header">
          <div className="brand" aria-label="Women in Data Science">
            <img className="brand-logo" src={widsLogo} alt="WiDS at UBC logo" width={80} height={80} />
          </div>
          <SiteMenu />
        </header>
        <div className="pixel-awning" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => <span key={index} />)}
        </div>

        <main id="main-content" tabIndex={-1} className="main-content">
          {children ?? <>
          <section className="hero-centered" aria-label="WiDS exec space">
            <h1 className="sr-only">WiDS events and shift sign-ups</h1>
            <aside className="desktop-scene" aria-label="Welcome to your WiDS space">
              <span className="scene-spark spark-one" aria-hidden="true">✦</span>
              <div className="welcome-window">
                <div className="window-bar"><span>wids / team-notes.txt</span><span className="window-controls" aria-hidden="true">− □ ×</span></div>
                <div className="window-content">
                  <div className="pixel-heart" aria-hidden="true">
                    <svg viewBox="0 0 13 11" fill="currentColor" shapeRendering="crispEdges"><path d="M2 0h3v1h3V0h3v1h1v1h1v4h-1v1h-1v1h-1v1H9v1H8v1H5v-1H4V9H3V8H2V7H1V6H0V2h1V1h1z" /><path d="M2 2h2v1H2z" fill="var(--card)" /></svg>
                  </div>
                  <p className="window-greeting">Hi, WiDS!</p>
                  <div className="window-divider" />
                  <span className="window-note">event shifts <span aria-hidden="true">♡</span></span>
                </div>
              </div>
              <div className="flower-sticker"><PixelFlower /></div>
              <span className="scene-caption">WiDS execs sign up here!</span>
              <span className="scene-spark spark-two" aria-hidden="true">✧</span>
            </aside>
          </section>
          <EventBoard />
          </>}
        </main>
        <footer className="site-footer"><span>UBC Women in Data Science <span aria-hidden="true">✦</span> WiDS</span><span>An internal space for our exec team.</span></footer>
      </div>
    </div>
  )
}
