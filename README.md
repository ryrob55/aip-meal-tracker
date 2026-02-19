# AIP Meal Tracker

A comprehensive meal tracking and planning app for the **Autoimmune Protocol (AIP)** diet. Built with Next.js, Prisma, and PostgreSQL.

## Features

- **Daily Meal Tracking** — Log meals, track eaten/skipped status, week and day views
- **Macro Progress** — Real-time calorie, protein, and net carb tracking against your targets
- **Onboarding Wizard** — Set up custom macro targets, fasting window, restrictions, and health goals
- **Recipe Database** — Full CRUD with nutritional data, tags, AIP compliance flag, and search
- **Weekly Meal Planning** — 7-day dinner plan with leftover lunches and servings tracking
- **Grocery List Generation** — Auto-aggregated from meal plans with smart unit conversion and AIP quality preferences (organic, grass-fed, wild-caught)
- **AIP Food Database** — Browse foods by phase, category, tyramine/histamine levels
- **Progress Reports** — Macro tracking, adherence rates, weekly trends, flags/concerns
- **Monthly Calendar** — Calendar display of planned meals
- **AI Features** — Recipe generation and meal suggestions (optional, requires API key)
- **Claude Code Skill** — Interactive `plan-meals` skill for weekly meal planning via CLI
- **Dark Mode** — Full dark/light theme support
- **Mobile Friendly** — Responsive design with touch-optimized controls

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/ryrob55/aip-meal-tracker.git
cd aip-meal-tracker

# Start PostgreSQL and the app
docker compose up -d --build

# Apply database schema
cd web && npx prisma db push

# Seed AIP food database (optional but recommended)
npm run db:seed-aip
```

Visit `http://localhost:3002`

### Option 2: Manual Setup

```bash
git clone https://github.com/ryrob55/aip-meal-tracker.git
cd aip-meal-tracker/web

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client and apply schema
npx prisma generate
npx prisma db push

# Seed AIP food database (optional)
npm run db:seed-aip

# Start development server
npm run dev
```

Visit `http://localhost:3002`

## LLM Configuration (Optional)

AI features (recipe generation, meal suggestions, ingredient categorization) work with any OpenAI-compatible API. Set these environment variables:

```bash
# OpenAI
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

# Anthropic (via OpenAI-compatible endpoint)
LLM_BASE_URL=https://api.anthropic.com/v1
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-3-haiku-20240307

# Ollama (local, no API key needed)
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3

# vLLM / TensorRT-LLM
LLM_BASE_URL=http://localhost:8000/v1
LLM_MODEL=your-model-name
```

AI features gracefully degrade when no `LLM_BASE_URL` is set — the app is fully functional without AI.

## Claude Code Skill

If you use [Claude Code](https://claude.ai/code), the included `plan-meals` skill provides an interactive weekly meal planning workflow:

```
/plan-meals
```

This walks you through:
1. Analyzing recent meal history
2. Choosing proteins and recipes for the week
3. Generating a full meal plan with macro totals
4. Creating all entries in the app automatically
5. Optionally generating a grocery list

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **UI**: Lucide icons, class-variance-authority, tailwind-merge
- **State**: TanStack React Query
- **AI**: OpenAI-compatible API (optional)

## License

MIT
