# OBS Propres Remote ICC

## Project Overview
OBS Propres Remote ICC is a comprehensive solution for managing and controlling OBS Studio remotely. This project enables users to streamline their broadcasting workflow, ensuring an efficient and user-friendly experience for remote stream management and control.

## Key Features
- **Remote Control Capabilities** – Control OBS Studio from anywhere in the world
- **Intuitive User Interface** – Easy-to-navigate interface for all experience levels
- **Scene & Source Management** – Manage multiple scenes and sources efficiently
- **Customizable Shortcuts** – Create quick-access shortcuts for frequent actions
- **Real-time Updates** – Instant feedback and status synchronization
- **Multi-platform Support** – Works seamlessly across different operating systems

## Quick Start

### Prerequisites
- Node.js v14.0 or higher
- npm or yarn package manager
- OBS Studio installed

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Thalanas110/obs-propres-remote-icc.git
   ```
2. Navigate to the project directory:
   ```bash
   cd obs-propres-remote-icc
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Production Deployment

To build for production:
```bash
npm run build
npm run start
```

## Development

### Available Scripts
- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run start` – Run production server
- `npm run test` – Run test suite
- `npm run lint` – Run ESLint
- `npm run format` – Format code with Prettier

### Technology Stack
- **Frontend Framework** – React with TypeScript
- **Routing** – TanStack Router
- **Styling** – Tailwind CSS
- **State Management** – TanStack Store
- **Data Fetching** – TanStack Query (React Query)
- **Testing** – Vitest
- **Build Tool** – Vite
- **Code Quality** – ESLint & Prettier

## Project Structure
```
src/
├── routes/          # File-based routing with TanStack Router
├── components/      # Reusable React components
├── stores/          # State management with TanStack Store
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── App.tsx          # Main application component
```

## Contributing
Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support & Contact
For questions, issues, or suggestions:
- **GitHub Issues** – Report bugs and request features
- **GitHub Discussions** – General questions and discussions
- **Email** – Contact the maintainer at thalanas110@example.com

---

**Project maintained by:** [Thalanas110](https://github.com/Thalanas110)