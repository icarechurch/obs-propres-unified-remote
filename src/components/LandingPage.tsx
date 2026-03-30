import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  Film,
  Presentation,
  Wifi,
  Zap,
} from 'lucide-react'

const highlights = [
  {
    value: 'One Workspace',
    label: 'OBS and ProPresenter control in a single, focused interface.',
  },
  {
    value: 'Two Live Connections',
    label: 'OBS WebSocket and ProPresenter API managed side by side.',
  },
  {
    value: 'Zero Login Steps',
    label: 'Open, connect, and operate directly without sign-in friction.',
  },
]

const features = [
  {
    title: 'OBS Scene And Source Control',
    description:
      'Switch scenes, manage preview/program, and run stream actions from one control rail.',
    icon: Film,
  },
  {
    title: 'ProPresenter Slides And Macros',
    description:
      'Navigate slides, trigger macros, and handle transport commands with immediate feedback.',
    icon: Presentation,
  },
  {
    title: 'Clear Connection Status',
    description:
      'Always-visible indicators make pre-service checks and troubleshooting faster for operators.',
    icon: Wifi,
  },
  {
    title: 'Pressure-Ready Controls',
    description:
      'High-use actions stay close so teams can react confidently when every second counts.',
    icon: Zap,
  },
]

const setupSteps = [
  {
    title: 'Open Connect Dashboard',
    description: 'Use Connect to jump directly into the dual-panel remote workspace.',
  },
  {
    title: 'Connect OBS And ProPresenter',
    description:
      'Enter host and port values for both systems and verify connection state in one screen.',
  },
  {
    title: 'Operate The Event',
    description:
      'Run scenes, slides, macros, timers, and transport controls from one streamlined surface.',
  },
]

const obsActions = [
  'Scene and source control',
  'Preview to program workflow',
  'Stream and recording actions',
]

const propresenterActions = [
  'Slide transport and jump',
  'Macros and timer control',
  'Playlist and presentation actions',
]

export function LandingPage() {
  return (
    <div className="landing-page">
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
            <div className="landing-hero-copy reveal reveal-0">
              <p className="landing-kicker">One command center for live production</p>

              <h1 className="landing-title">
                Run OBS and ProPresenter in sync without tab chaos.
              </h1>

              <p className="landing-subtitle">
                Switch scenes, trigger slides, run macros, and keep your media team in flow
                from a single control surface designed for real-time services, events, and
                broadcasts.
              </p>

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
                No sign-in. No setup wizard. Open and connect in seconds.
              </p>
            </div>

            <aside className="landing-surface reveal reveal-1" aria-label="Live dashboard preview">
              <div className="landing-surface-top">
                <span className="landing-surface-title">Live Control Snapshot</span>
                <span className="landing-surface-status">Ready</span>
              </div>

              <div className="landing-surface-grid">
                <article className="landing-surface-card landing-surface-card-obs">
                  <header>
                    <span>OBS Studio</span>
                    <span>ws://localhost:4455</span>
                  </header>
                  <ul>
                    {obsActions.map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={14} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="landing-surface-card landing-surface-card-pp">
                  <header>
                    <span>ProPresenter</span>
                    <span>http://localhost:50001</span>
                  </header>
                  <ul>
                    {propresenterActions.map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={14} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </aside>
          </section>

          <section className="landing-highlights reveal reveal-1">
            {highlights.map((item) => (
              <article key={item.value} className="landing-highlight-card">
                <p className="landing-highlight-value">{item.value}</p>
                <p className="landing-highlight-label">{item.label}</p>
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
                  style={{ animationDelay: `${120 + index * 60}ms` }}
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
                  style={{ animationDelay: `${140 + index * 80}ms` }}
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
            <p>Go straight to the dashboard and connect your systems when you are ready.</p>
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
