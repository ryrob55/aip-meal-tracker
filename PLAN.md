# AIP Meal Tracker — Comprehensive Improvement Plan

## The Problem This Solves

You walk out of a functional medicine appointment. The doctor hands you a list of 100+ foods to avoid and maybe a ChatGPT prompt. You're confused, overwhelmed, and not sure if you're doing it right. Without a system, you'll probably give up within 2 weeks — and you're not alone. AIP has a high dropout rate precisely because the information-to-action gap is enormous.

This tool bridges that gap: from "what is AIP?" to "I'm on Day 45 of elimination, my symptoms have improved 60%, and I'm ready to start reintroducing egg yolks next week."

---

## Architecture Principles

- All new features follow existing patterns: Next.js App Router, React Query, Prisma, Tailwind
- No new dependencies unless absolutely necessary
- AI features remain optional — everything works without LLM config
- Mobile-first (most meal tracking happens on phones)
- Each phase is independently deployable and useful

---

## Phase 1: Foundation — "I Just Got Diagnosed, Now What?"

**Goal:** Transform the app from a tracker into a guide. A new user should go from confused to confident in one sitting.

### 1.1 — New Welcome & Education Flow (before onboarding)

**New page: `/aip-diet/learn`**

When a brand-new user first visits, before asking them to configure macros, give them context. A multi-screen educational walkthrough:

1. **"What is AIP?"** — The autoimmune protocol explained in plain language. The leaky gut mechanism in 3 sentences. "This is a healing protocol, not a punishment diet."
2. **"What You'll Eliminate (and Why)"** — Each food group (grains, dairy, eggs, nightshades, nuts/seeds, legumes, alcohol) with a one-line explanation of WHY it's removed (e.g., "Nightshades contain saponins that can damage your gut lining"). Keep it short and non-scary.
3. **"What You CAN Eat" (The Abundance View)** — This is the most important screen. Show the massive list of allowed foods organized by category: all meats, all seafood, all vegetables (except nightshades), all fruits, healthy fats, herbs, bone broth. Flip the narrative from restriction to abundance.
4. **"The Timeline"** — Visual timeline: Elimination (4-8 weeks) → Reintroduction (months, one food at a time) → Your Personal Diet. Set expectations: first 1-2 weeks may feel worse, improvement typically at weeks 3-4.
5. **"How This App Helps"** — Quick overview: we'll track your meals, monitor your symptoms, tell you when you're ready to reintroduce foods, and keep you on track.

Then flow into the existing onboarding questionnaire.

**Files to create:**
- `web/src/app/aip-diet/learn/page.tsx` — Educational walkthrough page
- `web/src/lib/aip-education.ts` — Content data (food groups, elimination reasons, allowed foods, timeline)

**Files to modify:**
- `web/src/app/aip-diet/page.tsx` — Redirect to `/aip-diet/learn` instead of `/aip-diet/onboarding` for brand-new users

### 1.2 — AIP Phase Tracking on Questionnaire

**Schema changes to `AIPQuestionnaire`:**

```prisma
model AIPQuestionnaire {
  // ... existing fields ...

  // Phase tracking (NEW)
  currentPhase        AIPPhase  @default(ELIMINATION)
  phaseStartDate      DateTime  @default(now()) @db.Date
  eliminationStartDate DateTime? @db.Date  // When they first started AIP
}
```

**Update `AIPPhase` enum:**

```prisma
enum AIPPhase {
  ELIMINATION
  REINTRO_1    // Stage 1: egg yolks, ghee, seed spices, cocoa, coffee
  REINTRO_2    // Stage 2: egg whites, seeds, nuts, butter
  REINTRO_3    // Stage 3: nightshades, dairy, rice, legumes
  REINTRO_4    // Stage 4: gluten grains, corn, soy, processed
  MAINTENANCE  // Personal diet established
  AVOID
}
```

**Files to modify:**
- `web/prisma/schema.prisma` — Add fields and enum values
- `web/src/app/api/aip-diet/questionnaire/route.ts` — Handle new fields
- `web/src/components/aip-diet/QuestionnaireWizard.tsx` — Add phase selection step (or auto-set to ELIMINATION for new users)

### 1.3 — Redesigned Dashboard (`/`)

Replace the current 6-card link grid with a contextual, helpful dashboard:

**Top section: Phase Status Banner**
- "Day 23 of Elimination" with a progress ring
- "Earliest reintroduction: March 15" (4 weeks minimum)
- Or during reintro: "Reintroduction Stage 1 — Testing: Egg Yolks (Day 2 of 3)"

**Middle section: Today's Snapshot**
- Today's meals (filled/empty slots)
- Macro progress bars (cal/protein/carbs)
- Today's symptom score (if logged) or prompt to log
- Quick-add meal button

**Bottom section: Quick Actions Grid (4 cards)**
- "Track Today" → `/aip-diet`
- "Log Symptoms" → `/aip-diet/symptoms` (new)
- "What Can I Eat?" → `/aip-diet/foods` (filtered to current phase)
- "My Progress" → `/aip-diet/report`

**Files to modify:**
- `web/src/app/page.tsx` — Complete redesign
- `web/src/app/api/aip-diet/questionnaire/route.ts` — Return phase info for dashboard

---

## Phase 2: Symptom Tracking — "Is This Working?"

**Goal:** The single most impactful missing feature. Without symptom data, AIP is just a diet. With it, it's a controlled experiment.

### 2.1 — Symptom Data Model

```prisma
model AIPDailySymptoms {
  id              String       @id @default(uuid())
  dailyLogId      String       @unique
  dailyLog        AIPDailyLog  @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)

  // Core symptom domains (1-10 scale, null = not tracked)
  energy          Int?   // Overall energy level
  pain            Int?   // Joint/muscle pain
  digestion       Int?   // Bloating, regularity, comfort
  sleep           Int?   // Sleep quality
  skin            Int?   // Breakouts, rashes, eczema
  mood            Int?   // Emotional stability
  cognitive       Int?   // Brain fog, clarity, focus
  headache        Int?   // Headache/migraine intensity

  // Overall day rating
  overallRating   Int?   // 1-10 how do you feel today

  // Free-text for anything else
  notes           String?

  // Bowel tracking (Bristol stool scale, common in AIP)
  bowelMovements  Int?      // Count for the day
  bowelType       Int?      // Bristol scale 1-7

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Update `AIPDailyLog`:**
```prisma
model AIPDailyLog {
  // ... existing fields ...
  symptoms  AIPDailySymptoms?  // NEW relation
}
```

**Files to create:**
- `web/src/app/aip-diet/symptoms/page.tsx` — Daily symptom logging page
- `web/src/app/api/aip-diet/symptoms/route.ts` — CRUD for daily symptoms
- `web/src/components/aip-diet/SymptomSlider.tsx` — Reusable 1-10 slider with emoji/color scale

**Files to modify:**
- `web/prisma/schema.prisma` — New model + relation
- `web/src/app/page.tsx` — Dashboard symptom prompt

### 2.2 — Symptom Logging UI

**Page: `/aip-diet/symptoms`** (or inline on the daily tracker)

Design: A clean, fast-to-fill form. Should take under 60 seconds to complete.

- Date selector (defaults to today)
- 8 symptom sliders (1-10), each with:
  - Emoji scale indicator (e.g., energy: battery empty → battery full)
  - Color gradient (red at 1 → green at 10 for positive domains, inverse for pain/headache)
  - "Skip" option for domains not relevant today
- Overall "How do you feel?" rating
- Optional notes text area
- Optional bowel tracking (collapsible section)
- Save button

**Key UX decision:** Symptom logging should be prompted at the END of each day (evening), not morning. A gentle nudge on the daily tracker: "You haven't logged today's symptoms yet" after 6pm.

### 2.3 — Symptom Trends in Reports

**Enhance `/aip-diet/report`:**

- New "Symptom Trends" section with a line chart showing each domain over time
- "Symptom Heatmap" — grid of days x domains, colored by score
- Average symptom scores per week alongside existing macro trends
- Automated insights: "Your energy scores have improved 40% since Week 1"
- Correlation callouts: "Days when you ate [food] correlate with higher pain scores"

**Files to modify:**
- `web/src/app/aip-diet/report/page.tsx` — Add symptom trend sections
- `web/src/app/api/aip-diet/report/route.ts` — Include symptom data in report API

---

## Phase 3: Reintroduction Protocol — "What Can I Add Back?"

**Goal:** Guide users through the most confusing and failure-prone part of AIP — reintroducing foods safely.

### 3.1 — Reintroduction Data Model

```prisma
model AIPReintroduction {
  id              String              @id @default(uuid())
  questionnaireId String
  questionnaire   AIPQuestionnaire    @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)

  foodName        String              // "Egg Yolks", "Ghee", "Cumin"
  stage           Int                 // 1-4 (reintro stage)
  status          ReintroStatus       @default(NOT_STARTED)

  // Test protocol tracking
  testDate        DateTime?   @db.Date  // Day 0: the test day
  testAmount1     String?               // "1/2 tsp at 10am"
  testAmount2     String?               // "1 tsp at 10:15am"
  testAmount3     String?               // "normal portion at 10:30am"

  // Observation window (Days 1-3)
  observationEnd  DateTime?   @db.Date  // 72 hours after test

  // Result
  result          ReintroResult?
  reactionNotes   String?
  symptomsBefore  Json?       // Snapshot of symptom scores before test
  symptomsAfter   Json?       // Symptom scores during observation

  // Confirmation week (Days 4-7, eat daily if no reaction)
  confirmationStart DateTime? @db.Date
  confirmationEnd   DateTime? @db.Date
  confirmed         Boolean   @default(false)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([questionnaireId, foodName])
}

enum ReintroStatus {
  NOT_STARTED
  TESTING        // Day 0: eating the test food
  OBSERVING      // Days 1-3: 72-hour watch
  CONFIRMING     // Days 4-7: eating daily to confirm
  COMPLETED      // Result recorded
}

enum ReintroResult {
  PASS           // No reaction — food is safe
  FAIL           // Reaction detected — avoid for now
  INCONCLUSIVE   // Unclear — retry later
}
```

**Files to create:**
- `web/src/app/aip-diet/reintroduce/page.tsx` — Reintroduction hub
- `web/src/app/api/aip-diet/reintroduce/route.ts` — CRUD for reintroduction tests
- `web/src/components/aip-diet/ReintroTimeline.tsx` — Visual timeline of the 72-hour protocol
- `web/src/components/aip-diet/ReintroFoodCard.tsx` — Card showing food, stage, status, result

**Files to modify:**
- `web/prisma/schema.prisma` — New model + enums
- `web/src/app/page.tsx` — Show reintro status on dashboard

### 3.2 — Reintroduction Hub UI

**Page: `/aip-diet/reintroduce`**

**"Not Ready" state** (still in early elimination):
- Shows "You're on Day X of Elimination. The recommended minimum is 30 days before reintroducing."
- Progress bar toward reintroduction eligibility
- Educational content about what reintroduction looks like

**"Ready" state** (30+ days, symptoms improved):
- **Stage tabs:** Stage 1 | Stage 2 | Stage 3 | Stage 4
- Each stage shows a list of foods with status badges:
  - Not Started (gray)
  - Testing Today (yellow pulse)
  - Observing (orange, "Day 2 of 3")
  - Passed (green checkmark)
  - Failed (red X)
  - Inconclusive (gray question mark)

**Starting a test:**
1. Click "Start Test" on a food
2. Guided protocol screen:
   - "Step 1: Eat 1/2 teaspoon of [food]. Wait 15 minutes."
   - "Step 2: Eat 1 teaspoon. Wait 15 minutes."
   - "Step 3: Eat a normal portion. Done for today."
   - Timer/checklist for each step
3. After completing test day, enters 72-hour observation mode
4. During observation: daily symptom prompts with comparison to baseline
5. After 72 hours with no reaction: "Start confirmation week? Eat [food] daily for 3-4 days."
6. Record result: Pass / Fail / Inconclusive with notes

**Key rule enforcement:** Cannot start a new food test while another is in TESTING or OBSERVING status. Show clear warning.

### 3.3 — Phase Transitions

**Transitioning from Elimination to Reintroduction:**
- When user has been in elimination for 30+ days AND symptom trends show improvement
- Dashboard shows a "Ready to Reintroduce?" prompt
- Clicking it shows an explanation of the process and a "Begin Reintroduction" button
- Updates `AIPQuestionnaire.currentPhase` to `REINTRO_1`

**Moving through reintro stages:**
- Stages unlock sequentially — can't start Stage 2 foods until at least some Stage 1 foods tested
- UI encourages but doesn't force order within a stage

---

## Phase 4: "What Can I Eat?" — Quick Reference & Guidance

**Goal:** Answer the most common AIP question instantly.

### 4.1 — Enhanced Food Database Browser

**Improve `/aip-diet/foods`:**

- **Default view: "Safe for You" tab** — Shows only foods in your current phase, filtered by your personal restrictions. This is the "what can I eat?" answer.
- **Category grouping with visual icons** — Proteins, Vegetables, Fruits, Fats, Herbs, Beverages — each with a distinct icon and expandable section
- **"New to AIP?" callout cards** sprinkled in:
  - "Coconut aminos replace soy sauce"
  - "Cassava flour and tigernut flour replace wheat flour"
  - "Avocado oil is your go-to cooking oil"
- **Reintroduced foods section** — Foods you've successfully passed show in a "Your Reintroduced Foods" section with a green badge

**Files to modify:**
- `web/src/app/aip-diet/foods/page.tsx` — Redesign with tabs and smart filtering

### 4.2 — Meal Ideas / Quick Start Meals

**New section on food database page or separate page: `/aip-diet/quick-meals`**

Simple meal formula cards: Protein + Vegetable + Fat + Seasoning

Example cards:
- "Lemon Herb Salmon" — Salmon + Asparagus + Olive oil + Lemon, garlic, dill
- "Simple Chicken Bowl" — Chicken thighs + Sweet potato + Avocado + Turmeric, ginger, garlic

Each card shows estimated macros and a "one-tap add to today" button.

This solves the "I don't know what to cook tonight" problem without requiring full recipe creation.

**Files to create:**
- `web/src/lib/quick-meals.ts` — Curated simple meal combos with macros
- `web/src/components/aip-diet/QuickMealCard.tsx` — Visual meal formula card

---

## Phase 5: Fix What's Broken

**Goal:** Clean up stubs, dead code, and incomplete features.

### 5.1 — Fix Monthly Calendar View

The current monthly view at `/aip-diet/monthly` is a stub with static placeholder dots. Make it functional:

- Fetch actual `AIPDailyLog` data for the displayed month
- Show colored dots per day based on real meal completion:
  - Green: all planned meals eaten
  - Yellow: some meals eaten
  - Gray: no data
  - Red outline: meals skipped
- Add symptom score mini-indicator (small number or color bar) if symptoms were logged
- Fix the `?date=` query param so clicking a day navigates to that day's tracker
- Show the day's summary on tap/hover (total cals, protein, adherence %)

**Files to modify:**
- `web/src/app/aip-diet/monthly/page.tsx` — Fetch real data, render actual status
- `web/src/app/aip-diet/page.tsx` — Read `?date=` query param to set initial date

### 5.2 — Recipe Nutritional Data Entry

Currently there is NO UI for entering or editing a recipe's nutritional data. Add macro fields to the recipe create and edit forms:

- Calories, protein, carbs, fiber, fat, net carbs fields
- Per-serving basis (clearly labeled)
- Auto-calculate net carbs from carbs - fiber
- "Estimate with AI" button if LLM is configured

**Files to modify:**
- `web/src/app/recipes/page.tsx` — Add macro fields to `AddRecipeModal`
- `web/src/app/recipes/[id]/page.tsx` — Add macro fields to `RecipeEditView`

### 5.3 — Clean Up Dead Code

- Remove unused `MealSlot` and `QuickAddMeal` components from `web/src/components/meals/MealSlot.tsx`
- Remove unused `categorizeIngredient` from `web/src/lib/llm.ts`
- Fix `ThemeContext` localStorage key from `fcc-dark-mode` to `aip-dark-mode`
- Remove hardcoded `AIP_START_DATE` from report page — derive from `questionnaire.eliminationStartDate` or `questionnaire.phaseStartDate`
- Fix `isAIPCompliant` default in Recipe schema from `false` to `true` (CLAUDE.md says default true, schema says false)

### 5.4 — Fix Seed Script Reference

The CLAUDE.md references `npm run db:seed-aip` but package.json only has `db:seed`. Either:
- Add the `db:seed-aip` script to package.json, OR
- Update CLAUDE.md to match actual scripts

---

## Phase 6: Enhanced Reporting & Insights

### 6.1 — Food-Symptom Correlation

**New section in the report page:**

- "Foods & Symptoms" analysis
- For each food eaten multiple times, show average symptom scores on days it was eaten vs. days it wasn't
- Highlight foods that correlate with worse symptoms (potential triggers even within AIP-compliant foods)
- Works during both elimination (catch intolerances within allowed foods) and reintroduction (validate test results)

### 6.2 — Reintroduction Progress Report

- Show all tested foods with their results
- Timeline view of reintroduction journey
- "Your Personal Food Map" — visual showing what you can eat (original AIP + passed reintros) vs. what you react to

### 6.3 — Exportable Doctor Report

- "Share with Doctor" button that generates a clean, printable summary:
  - Protocol timeline and current phase
  - Symptom trend graphs
  - Macro averages and adherence
  - Reintroduction results
  - Flagged concerns

---

## Phase 7: Quality of Life Improvements

### 7.1 — AIP Compliance Checker

When adding a meal or recipe, scan ingredient names against the AIP food database and the user's restrictions:
- Warning badges on non-compliant ingredients
- "This recipe contains nightshades (tomatoes)" alert
- Phase-aware: during reintro, allow successfully reintroduced foods

### 7.2 — Pantry Setup Guide

**One-time onboarding flow: `/aip-diet/pantry`**

Checklist of AIP pantry essentials organized by category:
- Cooking oils (avocado oil, coconut oil, olive oil)
- Flours (cassava, tigernut, arrowroot, coconut)
- Sauces (coconut aminos, fish sauce, ACV)
- etc.

Each item has: what it replaces, where to buy, approximate cost. Checkable so users can track what they've stocked.

### 7.3 — Restaurant Quick Reference

**Page: `/aip-diet/eating-out`**

- Tips by restaurant type (steakhouse, Mexican, Asian, Italian, fast casual)
- Template phrases: "I have dietary restrictions — can I get [protein] cooked in olive oil with [vegetables], no butter, no seasonings with peppers?"
- "Safe bets" list: grilled salmon, plain steak, steamed vegetables, side salad with olive oil and lemon

---

## Implementation Order & Sizing

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Phase 1: Education + Phase Tracking + Dashboard | Large | Highest | 1st |
| Phase 2: Symptom Tracking | Medium | Highest | 2nd |
| Phase 5: Fix Broken Things | Small | High | 3rd (can parallel) |
| Phase 3: Reintroduction Protocol | Large | High | 4th |
| Phase 4: Quick Reference & Guidance | Medium | Medium-High | 5th |
| Phase 6: Enhanced Reporting | Medium | Medium | 6th |
| Phase 7: Quality of Life | Small each | Medium | 7th |

---

## Summary of Schema Changes

All database changes consolidated:

1. **`AIPQuestionnaire`** — Add: `currentPhase`, `phaseStartDate`, `eliminationStartDate`
2. **`AIPPhase` enum** — Add: `REINTRO_3`, `REINTRO_4`, `MAINTENANCE`
3. **New model: `AIPDailySymptoms`** — 8 symptom domains + overall + bowel + notes
4. **`AIPDailyLog`** — Add relation to `AIPDailySymptoms`
5. **New model: `AIPReintroduction`** — Food test tracking with protocol state machine
6. **New enums: `ReintroStatus`, `ReintroResult`**
7. **`Recipe`** — Fix `isAIPCompliant` default to `true`

## Summary of New Pages

1. `/aip-diet/learn` — Educational walkthrough for new users
2. `/aip-diet/symptoms` — Daily symptom logging
3. `/aip-diet/reintroduce` — Reintroduction protocol hub
4. `/aip-diet/pantry` — Pantry setup checklist
5. `/aip-diet/eating-out` — Restaurant quick reference

## Summary of Redesigned Pages

1. `/` — Dashboard: from link grid to contextual daily hub
2. `/aip-diet/foods` — From browser to "what can I eat?" with smart filtering
3. `/aip-diet/monthly` — From stub to functional calendar with real data
4. `/aip-diet/report` — Add symptom trends, food correlations, reintro progress
