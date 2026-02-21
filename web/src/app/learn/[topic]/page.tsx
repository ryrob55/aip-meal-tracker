'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface Section {
  title: string
  content: string
  list?: string[]
  highlight?: 'green' | 'red' | 'blue' | 'orange' | 'purple'
}

interface TopicContent {
  title: string
  intro: string
  sections: Section[]
}

const TOPIC_CONTENT: Record<string, TopicContent> = {
  elimination: {
    title: 'The Elimination Phase',
    intro:
      'The elimination phase is the foundation of AIP. You temporarily remove foods that commonly trigger immune reactions, giving your body time to calm inflammation and begin healing.',
    sections: [
      {
        title: 'How long does it last?',
        content:
          'Most people do the elimination phase for 30-90 days. The goal is to stay on it until you notice meaningful symptom improvement. For some, this happens in 2-3 weeks. For others, it takes the full 90 days.',
      },
      {
        title: 'Foods to enjoy',
        content: 'During elimination, you can eat a wide variety of nutrient-dense whole foods:',
        list: [
          'All meats: beef, chicken, turkey, pork, lamb, bison',
          'Seafood: salmon, cod, shrimp, mahi-mahi, sardines',
          'Vegetables: broccoli, cauliflower, zucchini, carrots, spinach, kale, sweet potatoes',
          'Fruits: berries, apples, bananas, citrus, melons',
          'Healthy fats: olive oil, coconut oil, avocado oil',
          'Bone broth: chicken or beef, homemade or store-bought',
          'Fresh herbs: basil, oregano, thyme, rosemary, cilantro, parsley',
          'Other: collagen peptides, MCT oil, coconut aminos',
        ],
        highlight: 'green',
      },
      {
        title: 'Foods to avoid',
        content: 'These foods are temporarily removed because they can trigger immune responses:',
        list: [
          'Grains: wheat, rice, oats, corn, quinoa (all grains)',
          'Dairy: milk, cheese, butter, yogurt, whey protein',
          'Eggs: whole eggs, egg whites, mayonnaise',
          'Nuts and seeds: almonds, cashews, sunflower seeds, chia, flax',
          'Legumes: beans, lentils, peanuts, soy',
          'Nightshades: tomatoes, peppers, potatoes, eggplant, paprika',
          'Refined sugars: white sugar, corn syrup, artificial sweeteners',
          'Alcohol: all types',
          'Seed-based spices: cumin, coriander, mustard, black pepper',
          'Coffee (can be reintroduced later)',
        ],
        highlight: 'red',
      },
      {
        title: 'Tips for success',
        content: 'The first two weeks are the hardest. After that, it gets much easier.',
        list: [
          'Meal prep on weekends - batch cook proteins and vegetables',
          'Keep AIP snacks ready: fruit, leftover meat, olives, plantain chips',
          'Focus on what you CAN eat, not what you can\'t',
          'This tracker helps you plan meals and ensure you\'re getting enough nutrients',
          'Connect with the AIP community online for recipe ideas and support',
        ],
      },
    ],
  },

  reintroduction: {
    title: 'Reintroduction Guide',
    intro:
      'Once your symptoms improve during elimination, you can begin reintroducing foods one at a time. This is how you build your personalized, long-term diet.',
    sections: [
      {
        title: 'When to start',
        content:
          'Start reintroduction after at least 30 days of elimination AND when you\'ve noticed meaningful symptom improvement. If symptoms haven\'t improved after 90 days, consult your healthcare provider before proceeding.',
      },
      {
        title: 'The 7-day reintroduction process',
        content: 'Each food gets a full 7-day test:',
        list: [
          'Day 0 (Test Day): Eat small amounts of the food in graduated portions over a few hours. Then stop eating it.',
          'Days 1-3 (Observation): Do NOT eat the test food. Track your symptoms daily. Watch for delayed reactions.',
          'Days 4-7 (Confirmation): If no reactions, eat the food daily in normal portions. Continue tracking symptoms.',
          'Result: No reactions = PASS (food is safe for you). Reactions detected = try again in 1-3 months.',
        ],
        highlight: 'blue',
      },
      {
        title: 'Order of reintroduction',
        content: 'Reintroduce foods from least reactive to most reactive:',
        list: [
          'Stage 1 (Least reactive): Egg yolks, seed-based spices, ghee, fruit-based spices',
          'Stage 2: Seeds, cocoa, coffee, egg whites, legumes (with long soaking)',
          'Stage 3: Nuts, grass-fed dairy (ghee > butter > cream > cheese), rice, gluten-free grains',
          'Stage 4 (Most reactive): Nightshades, dairy, gluten, alcohol',
        ],
      },
      {
        title: 'Important rules',
        content: 'Follow these rules for accurate results:',
        list: [
          'Only test ONE food at a time',
          'Wait for a stable baseline before starting a new test',
          'Keep a symptom diary throughout the process',
          'If you get sick (cold, flu), pause testing until you recover',
          'Inconclusive result? Wait 1-2 months and try again',
        ],
      },
    ],
  },

  nutrients: {
    title: 'Preventing Nutrient Gaps',
    intro:
      'AIP removes some nutrient-rich foods. With planning, you can easily meet all your nutritional needs from elimination-phase foods.',
    sections: [
      {
        title: 'Calcium',
        content:
          'Without dairy, prioritize these AIP-friendly calcium sources:',
        list: [
          'Bone broth (especially homemade with vinegar to extract minerals)',
          'Sardines and canned salmon (with bones)',
          'Broccoli, kale, and collard greens',
          'Bok choy and turnip greens',
        ],
        highlight: 'purple',
      },
      {
        title: 'B Vitamins (especially B12)',
        content: 'B12 is abundant in animal foods. Focus on:',
        list: [
          'Liver and organ meats (richest source of B vitamins)',
          'Beef, lamb, and other red meats',
          'Seafood: clams, sardines, salmon, tuna',
          'Nutritional goal: organ meats 1-2 times per week',
        ],
      },
      {
        title: 'Iron & Zinc',
        content: 'Red meat is your best friend on AIP for these minerals:',
        list: [
          'Red meat (beef, lamb, bison) - heme iron is well-absorbed',
          'Liver (extremely rich in iron)',
          'Oysters and other shellfish (zinc powerhouse)',
          'Dark leafy greens (non-heme iron - pair with vitamin C for absorption)',
        ],
      },
      {
        title: 'Omega-3 Fatty Acids',
        content: 'Anti-inflammatory and essential for immune health:',
        list: [
          'Fatty fish: salmon, sardines, mackerel, herring (2-3 times/week)',
          'Grass-fed beef (higher omega-3 than conventional)',
          'Algal oil (supplement option)',
        ],
      },
      {
        title: 'Vitamin D',
        content: 'Important for immune regulation:',
        list: [
          'Sunlight exposure (15-20 minutes daily when possible)',
          'Fatty fish (salmon, sardines, mackerel)',
          'Liver',
          'Consider supplementation - test your levels with your doctor',
        ],
      },
    ],
  },

  histamine: {
    title: 'Histamine & Tyramine',
    intro:
      'Some people on AIP also react to histamine or tyramine in foods. These are biogenic amines that can cause headaches, migraines, flushing, and digestive issues.',
    sections: [
      {
        title: 'What is histamine intolerance?',
        content:
          'Your body produces an enzyme (DAO) that breaks down histamine from food. If you don\'t produce enough DAO, histamine builds up and causes symptoms like headaches, hives, digestive issues, nasal congestion, and anxiety.',
      },
      {
        title: 'High-histamine foods to watch',
        content: 'Even some AIP-safe foods can be high in histamine:',
        list: [
          'Aged or cured meats (salami, bacon, ham)',
          'Canned fish (especially tuna)',
          'Fermented foods (sauerkraut, kombucha, vinegar)',
          'Leftover protein (histamine increases over time)',
          'Bone broth cooked for very long periods',
          'Avocado, spinach, citrus fruits',
        ],
        highlight: 'orange',
      },
      {
        title: 'Tyramine and migraines',
        content:
          'Tyramine is another amine that builds up in aged, fermented, and leftover foods. It\'s a common migraine trigger.',
        list: [
          'Fresh-cooked protein is safest - eat within 24 hours',
          'Freeze leftovers immediately if not eating within 24h',
          'Avoid aged cheeses, cured meats, and fermented foods',
          'This tracker includes tyramine levels for all foods in the database',
        ],
      },
      {
        title: 'Practical tips',
        content: 'Managing histamine/tyramine alongside AIP:',
        list: [
          'Cook proteins fresh and eat within 24 hours (this tracker alerts you)',
          'Freeze portions you won\'t eat same-day',
          'Choose fresh fish over canned or smoked',
          'Start with low-histamine fruits: blueberries, apples, pears, melon',
          'Keep a symptom diary to identify your personal triggers',
        ],
      },
    ],
  },

  'meal-prep': {
    title: 'Meal Prep Tips',
    intro:
      'Batch cooking is the secret to sustainable AIP. Spend a few hours on the weekend and you\'ll have meals ready all week.',
    sections: [
      {
        title: 'Weekend batch cook strategy',
        content: 'A simple framework for weekly meal prep:',
        list: [
          'Cook 2-3 large protein batches (roast chicken, ground beef, baked salmon)',
          'Prep 3-4 vegetables (roasted sweet potatoes, steamed broccoli, sauteed greens)',
          'Make a large batch of bone broth',
          'Prep smoothie bags (frozen berries + greens in individual bags)',
          'Store everything in glass containers with clear labels and dates',
        ],
        highlight: 'green',
      },
      {
        title: 'Leftover safety (tyramine)',
        content: 'If you\'re sensitive to tyramine, follow these rules:',
        list: [
          'Eat refrigerated protein within 24 hours of cooking',
          'Freeze individual portions immediately for longer storage',
          'Thaw in the fridge and eat within 24 hours of thawing',
          'Never reheat more than once',
          'This tracker will warn you when leftovers are getting old',
        ],
        highlight: 'orange',
      },
      {
        title: 'Quick AIP meals (under 15 minutes)',
        content: 'For busy days when batch-cooked food runs out:',
        list: [
          'Smoothie: frozen berries + banana + collagen + coconut milk + spinach',
          'Canned salmon + avocado + lemon over greens',
          'Pre-cooked chicken + sweet potato + olive oil',
          'Bone broth soup with leftover vegetables',
          'Pan-seared fish with steamed vegetables (fresh fish cooks in 10 min)',
        ],
      },
    ],
  },

  'modified-aip': {
    title: 'Modified AIP (2024)',
    intro:
      'The Modified AIP protocol is based on recent research showing that certain previously-eliminated foods are well-tolerated by most people with autoimmune conditions.',
    sections: [
      {
        title: 'What\'s different?',
        content:
          'Modified AIP (2024) is more flexible than Standard AIP. It allows several food groups that the original protocol eliminates, based on evidence that they rarely cause immune reactions.',
      },
      {
        title: 'Additional foods allowed',
        content: 'Modified AIP adds these to the elimination-phase "allowed" list:',
        list: [
          'Rice (white and brown)',
          'Pseudo-grains: quinoa, buckwheat, amaranth',
          'Ghee (clarified butter)',
          'Most legumes (except soy): lentils, chickpeas, black beans',
          'Seeds: chia, flax, sunflower, pumpkin, sesame',
          'Coffee',
          'Cocoa / dark chocolate',
        ],
        highlight: 'blue',
      },
      {
        title: 'Who should use Modified AIP?',
        content: 'Modified AIP might be right for you if:',
        list: [
          'Standard AIP feels too restrictive to sustain',
          'You\'ve done Standard AIP before and want a less strict round',
          'Your healthcare provider recommends a less restrictive approach',
          'You don\'t have severe or active autoimmune flares',
        ],
      },
      {
        title: 'Who should stick with Standard AIP?',
        content: 'Standard AIP is recommended if:',
        list: [
          'You\'re new to AIP and want the most thorough elimination',
          'You have severe or active symptoms',
          'You want maximum data during reintroduction (fewer variables)',
          'Your doctor specifically recommended the standard protocol',
        ],
        highlight: 'orange',
      },
      {
        title: 'You can switch',
        content:
          'This tracker supports both protocols. You can start with one and switch to the other at any time in your settings. The food browser will adjust what\'s shown as "safe" based on your chosen variant.',
      },
    ],
  },
}

export default function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = use(params)
  const { darkMode } = useTheme()

  const content = TOPIC_CONTENT[topic]

  if (!content) {
    return (
      <div className={cn('min-h-screen p-6', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
        <div className="max-w-lg mx-auto text-center py-12">
          <p className={cn('text-lg', darkMode ? 'text-slate-400' : 'text-slate-600')}>
            Topic not found.
          </p>
          <Link
            href="/learn"
            className="mt-4 inline-block text-green-500 hover:text-green-400 text-sm"
          >
            Back to Learn
          </Link>
        </div>
      </div>
    )
  }

  const highlightClasses: Record<string, string> = {
    green: darkMode ? 'border-l-green-500 bg-green-900/20' : 'border-l-green-500 bg-green-50',
    red: darkMode ? 'border-l-red-500 bg-red-900/20' : 'border-l-red-500 bg-red-50',
    blue: darkMode ? 'border-l-blue-500 bg-blue-900/20' : 'border-l-blue-500 bg-blue-50',
    orange: darkMode
      ? 'border-l-orange-500 bg-orange-900/20'
      : 'border-l-orange-500 bg-orange-50',
    purple: darkMode
      ? 'border-l-purple-500 bg-purple-900/20'
      : 'border-l-purple-500 bg-purple-50',
  }

  return (
    <div className={cn('min-h-screen', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/learn"
            className={cn(
              'p-2 rounded-lg',
              darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            )}
          >
            <ArrowLeft
              className={cn('w-5 h-5', darkMode ? 'text-slate-400' : 'text-slate-600')}
            />
          </Link>
          <h1 className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-slate-900')}>
            {content.title}
          </h1>
        </div>

        {/* Intro */}
        <p
          className={cn(
            'text-sm leading-relaxed mb-6',
            darkMode ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          {content.intro}
        </p>

        {/* Sections */}
        <div className="space-y-6">
          {content.sections.map((section, i) => (
            <div
              key={i}
              className={cn(
                'p-4 rounded-lg',
                section.highlight
                  ? `border-l-4 ${highlightClasses[section.highlight]}`
                  : darkMode
                  ? 'bg-slate-800'
                  : 'bg-slate-100'
              )}
            >
              <h3
                className={cn(
                  'text-sm font-semibold mb-2',
                  darkMode ? 'text-white' : 'text-slate-900'
                )}
              >
                {section.title}
              </h3>
              <p
                className={cn(
                  'text-sm leading-relaxed',
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                {section.content}
              </p>
              {section.list && (
                <ul className="mt-2 space-y-1.5">
                  {section.list.map((item, j) => (
                    <li
                      key={j}
                      className={cn(
                        'text-xs flex items-start gap-2',
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      )}
                    >
                      <span className="mt-0.5 flex-shrink-0">&#8226;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Back to learn */}
        <div className="mt-8 text-center">
          <Link
            href="/learn"
            className="text-green-500 hover:text-green-400 text-sm font-medium"
          >
            Back to all topics
          </Link>
        </div>
      </div>
    </div>
  )
}
