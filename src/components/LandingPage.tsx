import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  Film,
  Layers,
  Presentation,
  ShieldCheck,
  Wifi,
  Zap,
} from 'lucide-react'

const outcomes = [
  {
    value: '1 Interface',
    label: 'Control OBS and ProPresenter in one place',
  },
  {
    value: '2 Connections',
    label: 'OBS WebSocket + ProPresenter API',
  },
  {
    value: '0 Account Steps',
    label: 'Open and connect directly, no sign-in needed',
  },
]

const features = [
  {
    title: 'OBS Scene And Source Control',
    description:
      'Switch scenes, manage preview/program, and run streaming actions without leaving the page.',
    icon: Film,
  },
  {
    title: 'ProPresenter Slides And Macros',
    description:
      'Navigate slides, fire macros, and handle transport controls with immediate response.',
    icon: Presentation,
  },
  {
    title: 'Live Connection Visibility',
    description:
      'Connection indicators stay visible so operators can diagnose quickly before service starts.',
    icon: Wifi,
  },
  {
    title: 'Dual Panel Command Surface',
    description:
      'OBS and ProPresenter stay side by side so your team can operate both systems in sync.',
    icon: Layers,
  },
  {
    title: 'Fast, Pressure-Ready Actions',
    description:
      'High-frequency controls are always nearby for moments when every second matters.',
    icon: Zap,
  },
  {
    title: 'Built For Production Reliability',
    description:
      'Purpose-driven controls and visual feedback help reduce mistakes during live operations.',
    icon: ShieldCheck,
  },
]

const setupSteps = [
  {
    title: 'Open The Connect Dashboard',
    description: 'Use the Connect button to jump straight into the dual control workspace.',
  },
  {
    title: 'Connect OBS And ProPresenter',
    description:
      'Enter your host and port values for both systems and establish connection in one screen.',
  },
  {
    title: 'Run The Service Or Broadcast',
    description:
      'Operate scenes, slides, macros, timers, and transport controls from a single interface.',
  },
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-orb landing-orb-cyan" />
      <div className="landing-orb landing-orb-violet" />
      <div className="landing-grid-noise" />

      <div className="landing-shell">
        <header className="landing-nav reveal reveal-0">
          <div className="landing-brand">
            <span className="landing-brand-mark" aria-hidden="true">
              <span className="landing-brand-v" />
              <span className="landing-brand-h" />
            </span>
            <div>
              <p className="landing-brand-name">Media Team Combined Remote</p>
              <p className="landing-brand-sub">Unified OBS + ProPresenter control</p>
            </div>
          </div>

          <Link to="/connect" className="landing-btn landing-btn-primary landing-btn-sm">
            Connect
            <ArrowRight size={16} />
          </Link>
        </header>

        <main className="landing-main">
          <section className="landing-hero">
            <div className="landing-hero-copy reveal reveal-1">
              <p className="landing-kicker">One command center for live production</p>

              <h1 className="landing-title">
                Run OBS and ProPresenter in sync without tab chaos.
              </h1>

              <p className="landing-subtitle">
                Switch scenes, trigger slides, run macros, and keep your media team in flow
                from a single control surface designed for real-time services, events, and
                broadcasts.
              </p>

              <div className="landing-badges">
                <span className="landing-badge">No Sign-In Required</span>
                <span className="landing-badge">Desktop + Tablet Ready</span>
                <span className="landing-badge">Live Event Focused</span>
              </div>

              <div className="landing-actions">
                <Link to="/connect" className="landing-btn landing-btn-primary">
                  Connect Now
                  <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" className="landing-btn landing-btn-ghost">
                  How It Works
                </a>
              </div>

              <p className="landing-footnote">
                Start in seconds: open dashboard, connect endpoints, and take control.
              </p>
            </div>

            <aside className="landing-preview reveal reveal-2" aria-label="Live dashboard preview">
              <div className="landing-preview-header">
                <span>Live Control Snapshot</span>
                <span className="landing-preview-pill">Ready To Connect</span>
              </div>

              <div className="landing-preview-panels">
                <article className="landing-mini-panel landing-mini-panel-obs">
                  <header>
                    <span>OBS Studio</span>
                    <span>ws://localhost:4455</span>
                  </header>
                  <ul>
                    <li>
                      <CheckCircle2 size={14} />
                      Scene and source control
                    </li>
                    <li>
                      <CheckCircle2 size={14} />
                      Preview to program workflow
                    </li>
                    <li>
                      <CheckCircle2 size={14} />
                      Stream and recording actions
                    </li>
                  </ul>
                </article>

                <article className="landing-mini-panel landing-mini-panel-pp">
                  <header>
                    <span>ProPresenter</span>
                    <span>http://localhost:50001</span>
                  </header>
                  <ul>
                    <li>
                      <CheckCircle2 size={14} />
                      Slide transport and jump
                    </li>
                    <li>
                      <CheckCircle2 size={14} />
                      Macros and timer control
                    </li>
                    <li>
                      <CheckCircle2 size={14} />
                      Playlist and presentation actions
                    </li>
                  </ul>
                </article>
              </div>
            </aside>
          </section>

          <section className="landing-outcomes reveal reveal-2">
            {outcomes.map((item) => (
              <article key={item.value} className="landing-outcome-card">
                <p className="landing-outcome-value">{item.value}</p>
                <p className="landing-outcome-label">{item.label}</p>
              </article>
            ))}
          </section>

          <section id="features" className="landing-section">
            <div className="landing-section-head reveal reveal-1">
              <p className="landing-section-kicker">Core capabilities</p>
              <h2>Everything your operator needs during a live moment.</h2>
            </div>

            <div className="landing-feature-grid">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="landing-feature-card reveal"
                  style={{ animationDelay: `${100 + index * 70}ms` }}
                >
                  <div className="landing-feature-icon">
                    <feature.icon size={18} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="how-it-works" className="landing-section landing-workflow">
            <div className="landing-section-head reveal reveal-1">
              <p className="landing-section-kicker">Simple setup</p>
              <h2>Connect and operate in three straightforward steps.</h2>
            </div>

            <ol className="landing-step-list">
              {setupSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="landing-step reveal"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <span className="landing-step-index">0{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="landing-cta reveal reveal-2">
            <h2>Ready to run your next service with one coordinated remote?</h2>
            <p>
              Skip account setup and go directly to your live control dashboard.
            </p>
            <Link to="/connect" className="landing-btn landing-btn-primary">
              Connect To Dashboard
              <ArrowRight size={18} />
            </Link>
          </section>
        </main>
      </div>
    </div>
  )
}
