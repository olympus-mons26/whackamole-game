# Whack-a-Mole Game

An arcade browser reflex game built with React, Vite, Tailwind CSS, and TypeScript. Choose your difficulty level and round duration, test your reaction speed, and catch as many pop-up characters as you can before the clock runs out!

## Features

- **Multiple Game Modes & Difficulties**:
  - **Easy**: Relaxed pace, generous pop-up window
  - **Medium**: Balanced reflex challenge
  - **Hard**: Faster appearances and tighter windows
  - **Expert**: Rapid pop-ups with quick ramps
- **Adjustable Timers**: Select between 30-second quick rounds or 60-second endurance challenges.
- **Dynamic Synthesized Audio**: Built-in arcade sound effects powered by the Web Audio API (pop-up, whack impact, miss thud, round start fanfare, and game-over jingle) with full sound toggle support.
- **Character Customization**: Choose between Mole, Bunny, Cat, Frog, and Fox.
- **Responsive & Accessible Controls**:
  - **Desktop**: Click on holes or use numeric keyboard shortcuts (`1` to `9`)
  - **Mobile / Touch**: Fast tap-to-catch interface
- **Theme Support**: Seamless toggle between Dark and Light mode.
- **Local Persistence**: Saves your high score and preferences in your browser. Includes a one-click reset option.

---

## File Structure

```text
Whack-a-Mole-Game/
├── README.md                          # Project documentation
├── package.json                       # Root workspace configuration
├── pnpm-workspace.yaml                # pnpm workspace definition
├── pnpm-lock.yaml                     # Dependency lockfile
├── tsconfig.base.json                 # Shared TypeScript base configuration
├── tsconfig.json                      # Workspace TypeScript project references
├── artifacts/
│   └── whack-a-mole/                  # Main Whack-a-Mole application
│       ├── index.html                 # HTML entry point
│       ├── package.json               # App dependencies and scripts
│       ├── vite.config.ts             # Vite build configuration
│       ├── tsconfig.json              # App TypeScript configuration
│       ├── public/                    # Static assets
│       └── src/
│           ├── main.tsx               # React root entry point
│           ├── App.tsx                # Main game view, logic, and state
│           ├── index.css              # Styling and animations
│           ├── components/
│           │   ├── AnimalSprite.tsx   # Character SVGs (Mole, Bunny, Cat, Frog, Fox)
│           │   ├── error-boundary.tsx # Application crash resilience
│           │   └── ui/                # UI components (Radix primitives)
│           │       ├── alert-dialog.tsx
│           │       ├── button.tsx
│           │       ├── card.tsx
│           │       ├── dialog.tsx
│           │       ├── toast.tsx
│           │       ├── toaster.tsx
│           │       └── tooltip.tsx
│           ├── hooks/                 # Reusable React hooks
│           │   ├── use-mobile.tsx
│           │   └── use-toast.ts
│           ├── lib/
│           │   ├── sounds.ts          # Web Audio API sound synthesizer
│           │   └── utils.ts           # Classnames and utility helpers
│           └── pages/
│               └── not-found.tsx      # 404 fallback page
└── lib/                               # Shared workspace libraries
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (v9+)

### Installation

Clone the repository and install dependencies:

```bash
pnpm install
```

### Running the App

Start the development server for the Whack-a-Mole game:

```bash
pnpm --filter @workspace/whack-a-mole run dev
```

Then open `http://localhost:5173` in your browser.

---

## Scripts & Commands

| Command | Description |
|---|---|
| `pnpm --filter @workspace/whack-a-mole run dev` | Start the local Vite development server |
| `pnpm --filter @workspace/whack-a-mole run build` | Build the game for production |
| `pnpm --filter @workspace/whack-a-mole run serve` | Preview the production build locally |
| `pnpm --filter @workspace/whack-a-mole run typecheck` | Run TypeScript typechecking on the game |
| `pnpm run typecheck` | Run typechecking across all workspace packages |
| `pnpm run build` | Run typechecks and builds across all packages |

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons, Radix UI Primitives
- **Audio Engine**: Web Audio API (zero audio file dependencies)
- **Bundler**: Vite 7
- **Package Manager**: pnpm workspaces

---

## Credits

Made by [olympus-mons26](https://github.com/olympus-mons26/whack-a-mole).

---

## License

MIT
