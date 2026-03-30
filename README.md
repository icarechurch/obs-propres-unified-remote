# OBS + ProPresenter Remote

A unified remote control interface for managing both OBS Studio and ProPresenter simultaneously. Built for seamless media team workflows during live events and broadcasts.

## Features

### OBS Studio Control
- **Scene Management** – Switch scenes, create/rename/delete scenes with ease
- **Studio Mode Support** – Manage preview and program scenes with smooth transitions
- **Live Preview** – Real-time thumbnail previews of your scenes
- **Stream & Recording Control** – Start/stop streaming and recording with one click
- **Scene Items** – Add, remove, and manage browser sources directly
- **Source Control** – Enable/disable and manipulate source settings

### ProPresenter Integration
- **Presentation Control** – Load and switch between presentations from your library or playlists
- **Slide Navigation** – Jump to specific slides with thumbnails and instant previews
- **Macros** – Trigger ProPresenter macros on demand
- **Timers** – Control timers (start, stop, reset)
- **Transport Controls** – Next/previous slide navigation

### Interface
- **Dual-Panel Layout** – OBS on the left, ProPresenter on the right
- **Real-time Status** – Live connection indicators and feedback
- **Responsive Design** – Works on desktop and tablet
- **Dark Theme** – Purpose-built UI optimized for live event environments

## Tech Stack
- **Frontend** – React 19 + TypeScript
- **Build Tool** – Vite
- **Routing** – TanStack Router
- **State Management** – TanStack Query
- **Styling** – Tailwind CSS + Radix UI
- **OBS Connection** – obs-websocket-js
- **ProPresenter API** – HTTP REST API integration

## Getting Started

### Prerequisites
- Node.js v18+ and npm
- OBS Studio (with WebSocket server enabled)
- ProPresenter (with HTTP API enabled)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Thalanas110/obs-propres-remote-icc.git
cd obs-propres-remote-icc
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

## Configuration

### Connecting to OBS
1. Open OBS Studio
2. Go to Tools → WebSocket Server Settings
3. Enable the WebSocket server (default port: 4455)
4. On the app's OBS panel, enter the connection details (usually localhost:4455)
5. Click Connect

### Connecting to ProPresenter
1. Open ProPresenter
2. Go to Preferences → Network
3. Enable API and note the port (usually 50001 on HTTP)
4. On the app's ProPresenter panel, enter the host and port
5. Click Connect to ProPresenter

## Development

### Project Structure
```
src/
├── components/              # React components
│   ├── OBSPanel.tsx        # Main OBS control panel
│   ├── ProPresenterRemotePanel.tsx  # ProPresenter control panel
│   ├── obs/                # OBS-specific components
│   └── propresenter/       # ProPresenter-specific components
├── services/               # API integration services
│   ├── obs.service.ts      # OBS WebSocket service
│   └── propresenter.service.ts  # ProPresenter HTTP API service
├── routes/                 # TanStack Router routes
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
└── styles.css             # Global styles
```

### Available Scripts
- `npm run dev` – Start development server with hot reload
- `npm run build` – Build for production
- `npm run start` – Run production server
- `npm run test` – Run unit tests with Vitest
- `npm run test:e2e` – Run all Playwright end-to-end tests
- `npm run test:e2e:ui` – Open Playwright UI mode for authoring/debugging
- `npm run test:e2e:headed` – Run Playwright tests in headed mode
- `npm run test:e2e:debug` – Run Playwright in debug mode
- `npm run test:e2e:report` – Open the latest Playwright HTML report
- `npm run lint` – Check code with ESLint
- `npm run format` – Format code with Prettier

### End-to-End Testing (Playwright)

Playwright is preconfigured to run against the local app on `http://127.0.0.1:3000`.

1. Run all e2e tests:
```bash
npm run test:e2e
```

2. Run a single browser project while building tests:
```bash
npx playwright test --project=chromium
```

3. If your app is already running elsewhere, set a base URL and skip auto-start:
```bash
# PowerShell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'; npm run test:e2e

# bash/zsh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

Starter e2e tests live in `tests/e2e`.

## Contributing

Contributions are welcome! Please feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to your fork (`git push origin feature/your-feature`)
5. Open a Pull Request

## Roadmap

- [ ] WebSocket support for ProPresenter (real-time sync)
- [ ] Preset layouts and customizable panels
- [ ] Macro/scene triggering via keyboard shortcuts
- [ ] Multi-monitor support improvements
- [ ] Docker containerization
- [ ] Mobile app (React Native)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions, please:
- Open an [issue on GitHub](https://github.com/Thalanas110/obs-propres-remote-icc/issues)
- Contact the maintainer at [@Thalanas110](https://github.com/Thalanas110)

---

**Built for media teams and live event operators who need powerful, unified control.**