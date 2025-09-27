export interface Persona {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  color: string;
  responses: PersonaResponse[];
  keywords: string[];
}

export interface PersonaResponse {
  keywords: string[];
  response: string;
  followUp?: string;
}

export const personas: Persona[] = [
  {
    id: 'health-coach',
    name: 'FitBot',
    title: 'Health Coach',
    description: 'Quick habit-focused advice, motivation, and goal-setting',
    avatar: '🏃‍♀️',
    color: 'hsl(142, 76%, 36%)',
    keywords: ['fitness', 'exercise', 'workout', 'habit', 'motivation', 'goal', 'health'],
    responses: [
      {
        keywords: ['lose weight', 'weight loss', 'diet'],
        response: 'Great question! Weight loss is about creating sustainable habits. Start with tracking your food intake and aim for a calorie deficit. Focus on whole foods, stay hydrated, and combine cardio with strength training. What\'s your current fitness routine like?'
      },
      {
        keywords: ['motivation', 'lazy', 'unmotivated'],
        response: 'I hear you! Motivation comes and goes, but systems create results. Start with just 10 minutes a day. Pick one small habit you can do consistently. Progress beats perfection every time. What\'s one tiny step you could take today?'
      },
      {
        keywords: ['workout', 'exercise', 'gym'],
        response: 'Awesome! For beginners, I recommend 3-4 workouts per week focusing on compound movements like squats, deadlifts, and push-ups. Start light, focus on form, and gradually increase intensity. Consistency is key!'
      },
      {
        keywords: ['hello', 'hi', 'start'],
        response: 'Hello there! I\'m your Health Coach, ready to help you build better habits and reach your fitness goals. What would you like to work on today?'
      }
    ]
  },
  {
    id: 'dietitian',
    name: 'NutriBot',
    title: 'Dietitian',
    description: 'Nutrition plans, calorie guidance, meal ideas',
    avatar: '🥗',
    color: 'hsl(120, 60%, 50%)',
    keywords: ['nutrition', 'food', 'calories', 'meal', 'diet', 'eating', 'vitamins'],
    responses: [
      {
        keywords: ['meal plan', 'what to eat', 'nutrition'],
        response: 'For a balanced meal plan, aim for lean proteins, complex carbs, healthy fats, and plenty of vegetables. Try to fill half your plate with veggies, a quarter with protein, and a quarter with whole grains. How many meals per day works best for your schedule?'
      },
      {
        keywords: ['calories', 'calorie deficit', 'weight loss'],
        response: 'A safe calorie deficit is typically 300-500 calories below your maintenance level. For most people, that\'s around 1,500-2,000 calories per day. Focus on nutrient-dense foods to feel satisfied. Would you like help calculating your specific needs?'
      },
      {
        keywords: ['snacks', 'snacking', 'hungry'],
        response: 'Smart snacking can actually help with weight management! Try protein-rich options like Greek yogurt, nuts, or apple slices with almond butter. These keep you full longer and stabilize blood sugar. What are your current go-to snacks?'
      },
      {
        keywords: ['hello', 'hi', 'start'],
        response: 'Hi! I\'m your Nutrition Expert, here to help you make informed food choices and develop healthy eating habits. What nutrition questions can I help you with today?'
      }
    ]
  },
  {
    id: 'skincare-expert',
    name: 'GlowBot',
    title: 'Skincare Expert',
    description: 'Skin routines, ingredient advice, product suggestions',
    avatar: '✨',
    color: 'hsl(300, 76%, 72%)',
    keywords: ['skincare', 'acne', 'routine', 'products', 'ingredients', 'skin'],
    responses: [
      {
        keywords: ['routine', 'skincare routine', 'beginner'],
        response: 'A simple routine is perfect for beginners! Start with: morning cleanser, vitamin C serum, moisturizer, and SPF 30+. Evening: gentle cleanser, retinol (start 2x/week), and moisturizer. Always patch test new products first!'
      },
      {
        keywords: ['acne', 'breakouts', 'pimples'],
        response: 'For acne-prone skin, look for salicylic acid (BHA) to unclog pores and niacinamide to reduce inflammation. Avoid over-cleansing - it can make acne worse! Keep your routine gentle and consistent. What\'s your current skin type?'
      },
      {
        keywords: ['dry skin', 'moisturizer', 'hydration'],
        response: 'Dry skin needs gentle, hydrating ingredients like hyaluronic acid, ceramides, and glycerin. Use a cream-based cleanser and layer a hydrating serum under your moisturizer. Don\'t forget SPF during the day!'
      },
      {
        keywords: ['hello', 'hi', 'start'],
        response: 'Hello beautiful! I\'m your Skincare Expert, ready to help you achieve healthy, glowing skin. What skincare concerns would you like to discuss today?'
      }
    ]
  },
  {
    id: 'education-tutor',
    name: 'EduBot',
    title: 'Education Tutor',
    description: 'Explains concepts, gives practice problems and solutions',
    avatar: '📚',
    color: 'hsl(210, 79%, 46%)',
    keywords: ['learn', 'study', 'homework', 'math', 'science', 'explain', 'concept'],
    responses: [
      {
        keywords: ['math', 'algebra', 'equations'],
        response: 'Let\'s break down algebra step by step! Remember, what you do to one side of an equation, you must do to the other. Start by isolating the variable by moving constants to the other side. Would you like to work through a specific problem together?'
      },
      {
        keywords: ['study', 'studying', 'tips'],
        response: 'Great study habits include: active recall (testing yourself), spaced repetition, and breaking material into chunks. Try the Pomodoro technique - 25 minutes focused study, 5 minute break. What subject are you working on?'
      },
      {
        keywords: ['science', 'biology', 'chemistry'],
        response: 'Science is all about understanding patterns and processes! Start by identifying key concepts, then connect them to real-world examples. Drawing diagrams and concept maps really helps. What specific topic are you exploring?'
      },
      {
        keywords: ['hello', 'hi', 'start'],
        response: 'Hi there, student! I\'m your Education Tutor, here to help you learn and understand any subject better. What would you like to explore or study today?'
      }
    ]
  },
  {
    id: 'therapy-assistant',
    name: 'CalmBot',
    title: 'Therapy Assistant',
    description: 'Supportive reflective responses and coping suggestions',
    avatar: '🧘‍♀️',
    color: 'hsl(200, 50%, 60%)',
    keywords: ['stress', 'anxiety', 'feelings', 'emotion', 'cope', 'mental health'],
    responses: [
      {
        keywords: ['stressed', 'stress', 'overwhelmed'],
        response: 'I hear that you\'re feeling overwhelmed right now. That\'s completely valid. Let\'s try a quick grounding exercise: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. How are you feeling right now?'
      },
      {
        keywords: ['anxious', 'anxiety', 'worried'],
        response: 'Anxiety can feel really intense, but remember that feelings are temporary. Try some deep breathing - in for 4 counts, hold for 4, out for 6. Focus on what you can control right now. What\'s one small thing that might help you feel more grounded?'
      },
      {
        keywords: ['sad', 'depression', 'down'],
        response: 'I\'m sorry you\'re going through a tough time. Your feelings are valid and it\'s okay to not be okay sometimes. Small steps count - maybe just getting some fresh air or reaching out to someone you trust. What usually helps you feel a little better?'
      },
      {
        keywords: ['hello', 'hi', 'start'],
        response: 'Hello, and welcome to this safe space. I\'m here to listen and support you. Remember, this is just a supportive conversation - for serious mental health concerns, please reach out to a qualified professional. How are you feeling today?'
      }
    ]
  },
  {
    id: 'hustle-coach',
    name: 'BizBot',
    title: 'Hustle Coach',
    description: 'Startup advice, brief business strategy tips',
    avatar: '💼',
    color: 'hsl(45, 100%, 51%)',
    keywords: ['business', 'startup', 'entrepreneur', 'revenue', 'marketing', 'growth'],
    responses: [
      {
        keywords: ['startup', 'business idea', 'entrepreneur'],
        response: 'Love the entrepreneurial spirit! First, validate your idea - talk to potential customers before building anything. Focus on solving a real problem people will pay for. Start small, get feedback, iterate quickly. What\'s your business idea?'
      },
      {
        keywords: ['marketing', 'customers', 'sales'],
        response: 'Marketing is about understanding your ideal customer deeply. Where do they hang out? What problems keep them up at night? Start with one channel, master it, then expand. Content marketing and word-of-mouth are powerful for early-stage startups!'
      },
      {
        keywords: ['revenue', 'money', 'profit'],
        response: 'Revenue comes from solving problems people care about. Focus on your minimum viable product, get paying customers as soon as possible, and reinvest profits into growth. What\'s your current revenue model?'
      },
      {
        keywords: ['hello', 'hi', 'start'],
        response: 'Hey entrepreneur! Ready to turn ideas into action? I\'m here to help you navigate the startup journey with practical advice and strategies. What business challenge are you tackling today?'
      }
    ]
  }
];

export function generatePersonaResponse(persona: Persona, userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  // Find the best matching response based on keywords
  for (const response of persona.responses) {
    if (response.keywords.some(keyword => message.includes(keyword.toLowerCase()))) {
      return response.response;
    }
  }
  
  // Fallback responses
  const fallbacks = [
    `That's an interesting point. As a ${persona.title}, I'd suggest taking a step back and considering the fundamentals. What specific aspect would you like to explore further?`,
    `I appreciate you sharing that. From my experience as a ${persona.title}, every situation is unique. Could you tell me more about your specific goals?`,
    `That's a great question! Let me think about this from a ${persona.title} perspective. What outcome are you hoping to achieve?`
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}