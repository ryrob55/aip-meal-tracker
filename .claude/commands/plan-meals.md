---
description: Plan AIP meals for the week — dinners, leftover lunches, standard meals, and meal plan
---

# AIP Weekly Meal Planner

You are helping the user plan their AIP (Autoimmune Protocol) meals for an upcoming week. Follow this interactive workflow step by step.

**Base URL for all API calls:** `http://localhost:3002`

---

## Step 1: Determine Target Week

- Weeks run **Sunday through Saturday** (matching the app's `weekStartsOn: 0`).
- Default to **next Sunday's week** (the upcoming Sunday through the following Saturday).
- Calculate the full date range: Sunday (start) through Saturday (end).
- Store the 7 dates as `YYYY-MM-DD` strings for use in API calls.

**Important date note:** The AIP meals API uses `weekOf` with `weekStartsOn: 0` (Sunday-based weeks). The meal plan API also uses Sunday-based weeks. Use the Sunday date as the `weekOf` parameter.

---

## Step 2: Load User Profile & History

Fetch the user's questionnaire settings (macro targets, restrictions, preferences) and recent meal history:

```bash
# User's AIP questionnaire (macro targets, restrictions, preferences)
curl -s "http://localhost:3002/api/aip-diet/questionnaire" | jq .

# Last week's meals
curl -s "http://localhost:3002/api/aip-diet/meals?weekOf=<last-week-sunday>" | jq .

# Two weeks ago
curl -s "http://localhost:3002/api/aip-diet/meals?weekOf=<two-weeks-ago-sunday>" | jq .

# All AIP recipes
curl -s "http://localhost:3002/api/recipes?tag=aip" | jq .
```

Summarize for the user:
- Their daily macro targets (from questionnaire)
- What dinners were made in the last 2 weeks (list by date)
- Total number of available AIP recipes
- Which recipes haven't been used recently (variety opportunities)
- Any proteins that were heavy/light recently

---

## Step 3: Ask User Preferences

Ask the user these questions conversationally (not as a rigid form):

1. **Protein distribution** — How many meals for each protein this week? Suggest a default like: 2 chicken, 2 pork, 2 beef, 1 turkey. Adjust based on recent history.
2. **Specific recipes** — Any recipes they definitely want to include or avoid?
3. **Standing rules** — Do they have any standing weekly rules? Examples:
   - Taco Tuesday (rotate between beef/chicken/pork taco recipes)
   - Pizza Friday (using cauliflower pizza recipes)
   - Other themed days
4. **Family servings for dinners** — How many total servings per dinner? (e.g., 4 for a family). Used for grocery list scaling.
5. **Auto-fill standard meals?** — Default is yes. These are the repetitive daily meals (coffee, smoothie, snacks). Ask if they want to include them or skip.
6. **New recipes** — Would they like 2-3 new recipes created this week to grow the recipe database?

### Default Weekly Rules (customize to your preferences)

- **No repeats from the previous week**: Do not repeat any dinner from the immediately prior week. Fill remaining slots with recipes from 2+ weeks ago.
- **Sunday lunch = Saturday's leftover**: The previous week's Saturday dinner always provides Sunday lunch. Fetch this automatically.
- **Each dinner becomes the next day's lunch** (leftover pattern)

---

## Step 4: Generate Dinner Plan

Based on preferences, select 7 dinners from the AIP recipe database:

- **Prioritize variety** from the last 2 weeks — avoid repeating recent dinners
- **Match protein preferences** from Step 3
- **Balance cooking effort** — mix quick meals with longer preps across the week
- If a desired meal doesn't exist as a recipe, offer to create it via `POST /api/recipes`

### Recipe Formatting Rules

When creating new recipes, instructions MUST use a clean numbered format — a simple numbered list where each step is one paragraph with inline details. Do NOT use section headers, sub-bullets, or nested formatting. Follow this style:

```
1. Preheat oven to 400F.

2. Make the meatballs: In a bowl, combine ground turkey, arrowroot starch, ...

3. Prep the vegetables: Toss cubed sweet potato and chopped carrots with ...

4. Roast vegetables for 10 minutes, then add meatballs to the pan. ...
```

Each step starts with a number and period, is followed by a brief action, and includes all relevant sub-details inline. Steps are separated by blank lines.

Additional recipe rules:
- **No microwave**: NEVER include microwave instructions in any recipe. Always use stovetop, oven, or other non-microwave methods.
- **No "AIP" in recipe names**: Use "AIP" only as a tag, never in the recipe title.
- Cauliflower pizza recipes use **pre-bought riced cauliflower** (bags from Costco/Whole Foods), NOT whole cauliflower heads.

**Map leftovers:**
- Each dinner becomes the next day's lunch (leftover)
- Sunday dinner -> Monday lunch
- Monday dinner -> Tuesday lunch
- ...
- Friday dinner -> Saturday lunch
- **Saturday dinner -> Sunday lunch of the FOLLOWING week**
- **Sunday lunch** comes from the previous week's Saturday dinner — fetch this automatically.

---

## Step 5: Present Plan for Review

Show a formatted table with the full week's plan. Include per-meal macros and daily totals.

**Standard meals** — Look up these recipes by name in the database (they should already exist):
- Morning Coffee
- Berry + White Sweet Potato Smoothie (or user's smoothie recipe)
- Collagen Bone Broth (afternoon snack)
- Apple Slices with Collagen Drink (evening snack)

If any standard meal recipe doesn't exist yet, offer to create it or let the user specify what they use.

For each day, show:
- All meals with individual macros (from linked recipes)
- Daily totals (standard meals + lunch + dinner)
- Weekly protein/calorie averages vs targets (from questionnaire)

Format example:
```
| Day       | Dinner                    | Cal  | P    | F    | NC   | Daily Total (cal/P) |
|-----------|---------------------------|------|------|------|------|---------------------|
| Mon 2/10  | Garlic Herb Chicken       | 650  | 45g  | 20g  | 12g  | 2455 / 164g         |
| Tue 2/11  | Pork Stir Fry             | 600  | 40g  | 18g  | 15g  | 2405 / 159g         |
| ...       | ...                       | ...  | ...  | ...  | ...  | ...                 |
```

(Lunch macros = previous dinner macros for leftover days)

---

## Step 6: Allow Adjustments

Ask the user if the plan looks good. They can:
- **Swap days** — Move a dinner to a different day
- **Change a recipe** — Replace one dinner with another
- **Adjust servings** — Change serving count
- **Modify standard meals** — Use different snack options

Loop until the user confirms the plan.

---

## Step 7: Create Entries

Only proceed after explicit user confirmation. Create all entries using curl.

### 7a: AIP Dashboard Meals

For each day (Sunday through Saturday), create meals via `POST /api/aip-diet/meals`:

**Dinners** (7 entries):
```bash
curl -s -X POST "http://localhost:3002/api/aip-diet/meals" \
  -H "Content-Type: application/json" \
  -d '{"date": "<YYYY-MM-DD>", "mealType": "DINNER", "mealName": "<exact recipe name>"}'
```

**Lunches as leftovers** (7 entries):
```bash
curl -s -X POST "http://localhost:3002/api/aip-diet/meals" \
  -H "Content-Type: application/json" \
  -d '{"date": "<YYYY-MM-DD>", "mealType": "LUNCH", "mealName": "<dinner recipe name>", "isLeftover": true}'
```

**Standard meals** (if opted in — 4 entries per day, 7 days = 28 entries):
```bash
# Morning Coffee
curl -s -X POST "http://localhost:3002/api/aip-diet/meals" \
  -H "Content-Type: application/json" \
  -d '{"date": "<YYYY-MM-DD>", "mealType": "MORNING_COFFEE", "mealName": "<coffee recipe name>"}'

# Smoothie
curl -s -X POST "http://localhost:3002/api/aip-diet/meals" \
  -H "Content-Type: application/json" \
  -d '{"date": "<YYYY-MM-DD>", "mealType": "SMOOTHIE", "mealName": "<smoothie recipe name>"}'

# Afternoon Snack
curl -s -X POST "http://localhost:3002/api/aip-diet/meals" \
  -H "Content-Type: application/json" \
  -d '{"date": "<YYYY-MM-DD>", "mealType": "AFTERNOON_SNACK", "mealName": "<snack recipe name>"}'

# Evening Snack
curl -s -X POST "http://localhost:3002/api/aip-diet/meals" \
  -H "Content-Type: application/json" \
  -d '{"date": "<YYYY-MM-DD>", "mealType": "EVENING_SNACK", "mealName": "<snack recipe name>"}'
```

The API auto-links recipes by name matching, so macros come from the recipe database.

### 7b: Family Meal Plan

First, fetch the recipe list to get recipe IDs:
```bash
curl -s "http://localhost:3002/api/recipes?tag=aip" | jq '.recipes[] | {id, name}'
```

Then for each dinner, create a meal plan entry via `POST /api/meals`:
```bash
curl -s -X POST "http://localhost:3002/api/meals" \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "<recipe-id>", "date": "<YYYY-MM-DD>", "servings": <family-servings>}'
```

The API auto-creates the weekly MealPlan if it doesn't exist. It also upserts.

### Execution Tips

- Run all curl commands and check for 201 status codes
- If any fail, report the error and retry
- Process dinners first, then lunches, then standard meals, then family meals
- Use `jq` to parse responses and extract any needed IDs

---

## Step 8: Summary

After all entries are created, provide a summary:

- Total meals created (dinners + lunches + standard meals)
- Family meal plan entries created
- Any notes (e.g., "Sunday dinner leftover carries to next Monday")
- Link to check the results:
  - AIP Dashboard: `http://localhost:3002/aip-diet`
  - Family Meals: `http://localhost:3002/meals`

**Offer to generate a grocery list:**
```bash
# First get the meal plan ID
MEAL_PLAN_ID=$(curl -s "http://localhost:3002/api/meals?weekOf=<target-sunday>" | jq -r '.id')

# Generate grocery list
curl -s -X POST "http://localhost:3002/api/grocery" \
  -H "Content-Type: application/json" \
  -d "{\"mealPlanId\": \"$MEAL_PLAN_ID\"}"
```

If the user wants a grocery list, generate it and summarize the items by category.
