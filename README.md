# AIP Meal Tracker

A free, open-source meal tracking and planning app for the **Autoimmune Protocol (AIP)** diet. Track your meals, hit your macro targets, plan your week, and build a recipe library — all in one place.

**No account required. No subscriptions. Your data stays on your machine.**

---

## What You Get

| Feature | Description |
|---------|-------------|
| **Daily Meal Tracker** | Log breakfast, lunch, dinner, and snacks with one tap. See your day at a glance or zoom out to the full week. |
| **Macro Dashboard** | Real-time calorie, protein, carb, and fat tracking against your personal targets. |
| **Onboarding Wizard** | Guided setup for your macro goals, fasting window, AIP restrictions, and health priorities. |
| **47 Starter Recipes** | Pre-loaded AIP recipes with full nutritional data — chicken, beef, pork, bison, turkey, seafood, snacks, and more. |
| **Recipe Database** | Add your own recipes with ingredients, instructions, tags, and per-serving macros. |
| **Weekly Meal Planner** | Plan 7 days of dinners. Leftovers automatically become the next day's lunch. |
| **Grocery Lists** | Auto-generated from your meal plan with smart unit conversion and AIP quality preferences (organic, grass-fed, wild-caught). |
| **AIP Food Browser** | Look up any food by AIP phase, category, histamine level, and tyramine sensitivity. |
| **Progress Reports** | Weekly and monthly views with adherence rates, macro trends, and flags for potential issues. |
| **Monthly Calendar** | See your planned meals laid out across the whole month. |
| **Dark Mode** | Full dark/light theme that follows your preference. |
| **Mobile Friendly** | Works great on phones and tablets with touch-optimized controls. |
| **AI Features** | *Optional* — connect any AI provider (OpenAI, Ollama, etc.) for recipe generation and meal suggestions. Works perfectly fine without it. |

---

## Getting Started

### What You'll Need

- **Docker Desktop** — [Download here](https://www.docker.com/products/docker-desktop/) (free, works on Mac/Windows/Linux)
  - This is the only thing you need to install. Docker handles everything else.

> **Don't have Docker?** See [Manual Setup](#manual-setup-without-docker) below.

### Step 1: Download the App

Open a terminal (Terminal on Mac, PowerShell on Windows) and run:

```bash
git clone https://github.com/ryrob55/aip-meal-tracker.git
cd aip-meal-tracker
```

> **Don't have git?** You can also [download the ZIP](https://github.com/ryrob55/aip-meal-tracker/archive/refs/heads/main.zip), unzip it, and open a terminal in that folder.

### Step 2: Start the App

```bash
docker compose up -d --build
```

This downloads everything needed and starts the app. It takes 1-2 minutes the first time.

### Step 3: Set Up the Database

```bash
cd web
npm install
npx prisma db push
```

### Step 4: Load the Starter Recipes

```bash
npm run db:seed
```

This loads 47 AIP-compliant recipes with full nutritional data so you can start planning meals right away.

### Step 5: Open the App

Go to **http://localhost:3002** in your browser.

You'll see the dashboard. Start by clicking **Get Started** on the AIP Diet card — the onboarding wizard will walk you through setting up your personal targets.

---

### Stopping and Starting

```bash
# Stop the app
docker compose down

# Start it again (your data is saved)
docker compose up -d
```

---

## Manual Setup (Without Docker)

If you prefer not to use Docker, you'll need:
- **Node.js 18+** — [Download here](https://nodejs.org/)
- **PostgreSQL 15+** — [Download here](https://www.postgresql.org/download/)

```bash
git clone https://github.com/ryrob55/aip-meal-tracker.git
cd aip-meal-tracker/web

# Install dependencies
npm install

# Configure your database connection
cp .env.example .env
# Edit .env and set DATABASE_URL to your PostgreSQL connection string
# Example: DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/aip

# Set up the database
npx prisma generate
npx prisma db push

# Load starter recipes
npm run db:seed

# Start the app
npm run dev
```

Go to **http://localhost:3002**

---

## Adding AI Features (Optional)

The app works great without AI. But if you want recipe generation and smart meal suggestions, you can connect any OpenAI-compatible API.

Edit your `.env` file (in the `web/` folder) and add:

```bash
# --- Pick ONE of these providers ---

# OpenAI
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

# Ollama (free, runs locally on your machine — https://ollama.com)
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3

# Any other OpenAI-compatible API
LLM_BASE_URL=http://your-server:port/v1
LLM_API_KEY=your-key
LLM_MODEL=your-model
```

Then restart the app (`docker compose restart app` or re-run `npm run dev`).

---

## Claude Code Integration

If you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code), the included `plan-meals` skill gives you an interactive meal planning workflow right from the terminal:

```
/plan-meals
```

It will walk you through choosing proteins, picking recipes, generating a full week of meals with macro totals, and optionally creating a grocery list — all created directly in the app.

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15
- **State**: TanStack React Query
- **AI**: OpenAI-compatible API (optional)

---

## Contributing

Contributions are welcome! Feel free to open issues or pull requests.

## License

MIT — free to use, modify, and distribute.
