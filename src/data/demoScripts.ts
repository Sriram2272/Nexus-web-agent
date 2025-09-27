import { type DemoField } from '@/components/FieldSelectionModal';
import { personas } from './personas';

export interface DemoConversation {
  user: string;
  ai: string;
}

export interface DemoScript {
  title: string;
  persona: any;
  conversations: DemoConversation[];
}

export function getDemoScriptsForField(field: DemoField): DemoScript[] {
  switch (field.id) {
    case 'healthcare':
      return [
        {
          title: 'Health Symptoms Consultation',
          persona: personas.find(p => p.id === 'therapy-assistant') || personas[0],
          conversations: [
            {
              user: "I've been having headaches and feeling tired lately. Should I be concerned?",
              ai: "I understand you're experiencing headaches and fatigue, which can be concerning. While I can provide general information, it's important to consult with a healthcare professional for proper evaluation. These symptoms can have various causes - from dehydration and stress to sleep issues. Have you noticed any patterns with when these symptoms occur?"
            },
            {
              user: "They seem worse in the afternoons, and I've been working long hours.",
              ai: "That timing suggests it could be related to stress, dehydration, or eye strain from prolonged work. Try taking regular breaks every hour, ensure you're drinking enough water, and consider if your workspace ergonomics might be contributing. However, if symptoms persist or worsen, please see a doctor for proper assessment."
            },
            {
              user: "I'll try those suggestions. When should I definitely see a doctor?",
              ai: "You should see a doctor if headaches become severe, sudden, or different from usual patterns, if you experience vision changes, fever, neck stiffness, or if the fatigue significantly impacts your daily activities. Don't hesitate to seek medical attention if you're worried - it's always better to be safe."
            },
            {
              user: "Thank you, that's very helpful guidance.",
              ai: "You're welcome! Remember, taking care of your health is important. Keep track of your symptoms, try the lifestyle adjustments we discussed, and don't hesitate to reach out to a healthcare provider if needed. Your health and peace of mind are worth it."
            }
          ]
        },
        {
          title: 'Preventive Health Discussion',
          persona: personas.find(p => p.id === 'health-coach') || personas[0],
          conversations: [
            {
              user: "What are the most important things I can do to stay healthy?",
              ai: "Great question! The foundations of good health include: regular physical activity (aim for 150 minutes of moderate exercise weekly), a balanced diet rich in fruits and vegetables, adequate sleep (7-9 hours nightly), stress management, and regular check-ups with your healthcare provider. Which of these areas would you like to focus on first?"
            },
            {
              user: "I struggle with getting enough sleep. Any tips?",
              ai: "Sleep is crucial for overall health! Try establishing a consistent sleep schedule, create a relaxing bedtime routine, avoid screens 1 hour before bed, keep your bedroom cool and dark, and limit caffeine after 2 PM. Also, try to get natural sunlight exposure during the day to regulate your circadian rhythm."
            },
            {
              user: "How important are regular health check-ups?",
              ai: "Regular check-ups are essential for preventive care! They help catch potential issues early when they're most treatable, allow for screening tests appropriate for your age, and help track important numbers like blood pressure and cholesterol. Most adults should see their primary care doctor annually, but your doctor can advise on the best schedule for you."
            },
            {
              user: "What about mental health? How do I know if I need help?",
              ai: "Mental health is just as important as physical health! Consider seeking help if you experience persistent sadness, anxiety, changes in sleep or appetite, difficulty concentrating, or if daily activities become challenging. Don't wait for a crisis - early support can make a huge difference. Many people benefit from therapy even when they're functioning well."
            }
          ]
        },
        {
          title: 'Nutrition and Wellness',
          persona: personas.find(p => p.id === 'dietitian') || personas[0],
          conversations: [
            {
              user: "I want to improve my immune system. What foods should I focus on?",
              ai: "Excellent goal! Focus on colorful fruits and vegetables rich in vitamins C and E, zinc-rich foods like nuts and seeds, probiotic foods like yogurt for gut health, and omega-3 fatty acids from fish or flax seeds. Don't forget adequate protein, hydration, and limiting processed foods. A diverse, whole-food diet is your best foundation for immune health."
            },
            {
              user: "Are supplements necessary or should I focus on whole foods?",
              ai: "Whole foods are generally preferred because they provide nutrients in forms your body recognizes best, plus beneficial compounds we might not find in supplements. However, some people may benefit from specific supplements like vitamin D, B12 (especially vegetarians), or omega-3s. It's best to discuss your individual needs with a healthcare provider or registered dietitian."
            },
            {
              user: "How much water should I really be drinking daily?",
              ai: "The '8 glasses a day' rule is a good starting point, but individual needs vary based on activity level, climate, and overall health. A general guideline is about half your body weight in ounces, plus more if you're active or in hot weather. Pay attention to your urine color - pale yellow usually indicates good hydration."
            },
            {
              user: "What's your take on intermittent fasting?",
              ai: "Intermittent fasting can have benefits for some people, including improved insulin sensitivity and potential weight management. However, it's not suitable for everyone - pregnant women, people with eating disorder history, or certain medical conditions should avoid it. The key is finding an eating pattern that's sustainable and supports your overall health goals. Always consult with a healthcare provider first."
            }
          ]
        }
      ];

    case 'fitness':
      return [
        {
          title: 'Beginner Workout Planning',
          persona: personas.find(p => p.id === 'health-coach') || personas[0],
          conversations: [
            {
              user: "I'm completely new to working out. Where should I start?",
              ai: "Welcome to your fitness journey! Starting is the hardest part, so congratulations on taking this step. Begin with 2-3 days per week of basic bodyweight exercises like squats, push-ups (modified if needed), and planks. Add some walking or light cardio. The key is consistency over intensity - start small and build gradually."
            },
            {
              user: "How long should my workouts be as a beginner?",
              ai: "Start with 20-30 minute sessions. This includes a 5-minute warm-up, 15-20 minutes of exercise, and 5 minutes of cool-down stretching. As you build endurance and strength over 4-6 weeks, you can gradually increase to 45-60 minutes. Remember, something is always better than nothing!"
            },
            {
              user: "I'm worried about getting injured. How can I stay safe?",
              ai: "Smart concern! Focus on proper form over speed or weight. Start with bodyweight exercises to learn movement patterns, warm up before every workout, and listen to your body - some muscle fatigue is normal, but sharp pain means stop. Consider working with a trainer initially, and don't push through pain. Recovery days are just as important as workout days."
            },
            {
              user: "How soon will I see results?",
              ai: "You'll likely feel stronger and more energetic within 2-3 weeks! Visible muscle changes typically appear around 4-6 weeks, while significant strength gains happen over 8-12 weeks. Remember, progress isn't always visible - improved sleep, mood, and energy are equally important victories. Track your progress beyond just appearance!"
            }
          ]
        },
        {
          title: 'Home Workout Solutions',
          persona: personas.find(p => p.id === 'health-coach') || personas[0],
          conversations: [
            {
              user: "I can't afford a gym membership. Can I get fit at home?",
              ai: "Absolutely! You can achieve excellent fitness results at home with minimal equipment. Bodyweight exercises, resistance bands, and household items can provide a complete workout. YouTube fitness channels, fitness apps, and online programs offer guided workouts for every level and goal."
            },
            {
              user: "What basic equipment should I invest in for home workouts?",
              ai: "Start minimal! A yoga mat for floor exercises, resistance bands for strength training, and perhaps light dumbbells or kettlebells as you advance. You can also use water bottles, backpacks filled with books, or stairs for cardio. Don't let lack of equipment be a barrier - your body weight is an excellent tool!"
            },
            {
              user: "How do I stay motivated working out alone at home?",
              ai: "Great question! Set specific workout times and treat them like appointments. Create an energizing playlist, find workout buddies virtually, track your progress, and celebrate small wins. Having a dedicated workout space helps mentally separate exercise time. Consider virtual fitness classes for community feel and accountability."
            },
            {
              user: "Can I build muscle effectively without heavy weights?",
              ai: "Yes! Progressive overload is key - gradually increase reps, sets, or difficulty. Bodyweight exercises like push-up variations, single-leg squats, and pike push-ups can be very challenging. Resistance bands provide variable resistance, and techniques like slow tempos and pause reps increase difficulty without adding weight."
            }
          ]
        },
        {
          title: 'Cardio and Endurance Training',
          persona: personas.find(p => p.id === 'health-coach') || personas[0],
          conversations: [
            {
              user: "I want to improve my cardio but hate running. What are my options?",
              ai: "There are so many cardio options beyond running! Try dancing, swimming, cycling, hiking, jump rope, rowing, or even vigorous household cleaning. High-intensity interval training (HIIT) with bodyweight exercises is also excellent. The best cardio is the one you'll actually do consistently - find activities you enjoy!"
            },
            {
              user: "How often should I do cardio for heart health?",
              ai: "The American Heart Association recommends at least 150 minutes of moderate-intensity or 75 minutes of vigorous cardio per week. That's about 30 minutes, 5 days a week of brisk walking, or 25 minutes, 3 days a week of more intense activity. You can also mix and match different intensities throughout the week."
            },
            {
              user: "What's the difference between steady-state and interval training?",
              ai: "Steady-state cardio maintains a consistent, moderate effort (like a comfortable jog) for extended periods. Interval training alternates between high-intensity bursts and recovery periods. Both have benefits - steady-state builds aerobic base and is great for beginners, while intervals improve both aerobic and anaerobic fitness in less time."
            },
            {
              user: "How do I know if I'm working at the right intensity?",
              ai: "Use the 'talk test' - during moderate intensity, you should be able to have a conversation but feel somewhat breathless. For vigorous intensity, you should only be able to say a few words. You can also monitor your heart rate - moderate is roughly 50-70% of max heart rate, vigorous is 70-85%. Listen to your body and build gradually!"
            }
          ]
        }
      ];

    case 'diet':
      return [
        {
          title: 'Meal Planning Basics',
          persona: personas.find(p => p.id === 'dietitian') || personas[0],
          conversations: [
            {
              user: "I want to start meal planning but don't know where to begin. Help!",
              ai: "Meal planning is a game-changer! Start simple: pick one day to plan your week, choose 3-4 go-to breakfast options, 4-5 lunch options, and 5-6 dinner recipes you can rotate. Make a grocery list based on your plan. Begin with planning just dinners for a week, then expand to other meals as you get comfortable."
            },
            {
              user: "How do I make sure my meals are balanced and nutritious?",
              ai: "Use the plate method: fill half your plate with vegetables, one quarter with lean protein, and one quarter with whole grains or starchy vegetables. Add a small portion of healthy fats like avocado or nuts. This ensures you get a variety of nutrients while keeping portions in check. Don't forget to include fruits as snacks or with meals!"
            },
            {
              user: "I'm always running out of time to cook. Any quick meal ideas?",
              ai: "Absolutely! Try sheet pan meals with protein and vegetables, slow cooker or instant pot meals, overnight oats for breakfast, and batch cooking on weekends. Keep staples like canned beans, frozen vegetables, and pre-cooked grains on hand. Even a simple scrambled egg with spinach and toast can be nutritious and ready in 5 minutes."
            },
            {
              user: "How can I meal prep without getting bored of eating the same thing?",
              ai: "Variety is key! Prep components separately - cook a batch of protein, grains, and roasted vegetables, then mix and match throughout the week. Use different seasonings and sauces to change flavors. Prep ingredients rather than complete meals sometimes, so you have flexibility. Also, plan different cuisines throughout the week to keep things interesting!"
            }
          ]
        },
        {
          title: 'Healthy Eating on a Budget',
          persona: personas.find(p => p.id === 'dietitian') || personas[0],
          conversations: [
            {
              user: "Eating healthy seems expensive. How can I eat well on a tight budget?",
              ai: "Healthy eating doesn't have to break the bank! Focus on affordable staples: beans, lentils, eggs, oats, brown rice, seasonal vegetables, and bananas. Buy in bulk when possible, shop sales, use frozen vegetables, and limit processed foods. Cooking at home is almost always cheaper than eating out or buying prepared foods."
            },
            {
              user: "Are frozen vegetables as nutritious as fresh ones?",
              ai: "Yes! Frozen vegetables are often more nutritious than fresh ones that have traveled long distances or sat on shelves. They're picked and frozen at peak ripeness, locking in nutrients. They're also convenient, last longer, and are often less expensive. Just avoid varieties with added sauces or seasonings that can add sodium and calories."
            },
            {
              user: "What are some cheap protein sources?",
              ai: "Excellent question! Eggs are probably the cheapest complete protein. Dried beans and lentils are incredibly affordable and versatile. Canned tuna, chicken thighs (cheaper than breasts), peanut butter, and Greek yogurt are also budget-friendly. Tofu and quinoa provide plant-based options. Buying larger quantities and freezing portions can save even more."
            },
            {
              user: "How can I reduce food waste and save money?",
              ai: "Plan meals around what you already have, use older produce first, and repurpose leftovers creatively. Store foods properly to extend freshness, freeze extras before they spoil, and consider 'imperfect' produce that's often discounted. Use vegetable scraps for broth, and learn to love versatile ingredients that work in multiple dishes."
            }
          ]
        },
        {
          title: 'Weight Management Through Nutrition',
          persona: personas.find(p => p.id === 'dietitian') || personas[0],
          conversations: [
            {
              user: "I want to lose weight in a healthy way. Where should I start?",
              ai: "Focus on sustainable changes rather than quick fixes! Start by eating more vegetables, choosing whole grains over refined ones, staying hydrated, and eating regular meals to avoid excessive hunger. Portion control is key - use smaller plates and pay attention to hunger cues. Aim for 1-2 pounds per week weight loss for sustainable results."
            },
            {
              user: "Should I cut out entire food groups to lose weight faster?",
              ai: "I don't recommend eliminating entire food groups unless medically necessary. Restrictive diets often lead to cravings, binge eating, and eventual weight regain. Instead, focus on eating appropriate portions of all foods, with emphasis on nutrient-dense choices. You can still enjoy treats occasionally as part of a balanced approach."
            },
            {
              user: "How important is tracking calories for weight loss?",
              ai: "Calorie tracking can be helpful for awareness, especially initially, but it's not essential for everyone. Focus on portion sizes, eating when hungry and stopping when satisfied, and choosing nutrient-dense foods. Some people do well with tracking, while others find it stressful. The key is finding what works sustainably for your lifestyle."
            },
            {
              user: "I've hit a weight loss plateau. What should I do?",
              ai: "Plateaus are normal! Your body adapts to changes. Try varying your routine - different exercises, meal timing, or food choices. Ensure you're still in a modest calorie deficit, getting adequate sleep, and managing stress. Sometimes taking a short break from active weight loss (maintenance phase) can help reset your metabolism before continuing."
            }
          ]
        }
      ];

    case 'education':
      return [
        {
          title: 'Effective Study Strategies',
          persona: personas.find(p => p.id === 'education-tutor') || personas[0],
          conversations: [
            {
              user: "I struggle to retain information when studying. What techniques work best?",
              ai: "Active learning techniques are key! Instead of just re-reading notes, try the Feynman technique - explain concepts in simple terms as if teaching someone else. Use spaced repetition, create mind maps, practice with flashcards, and test yourself frequently. The more actively you engage with material, the better you'll remember it."
            },
            {
              user: "How should I structure my study sessions for maximum effectiveness?",
              ai: "Try the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break. After 4 sessions, take a longer 15-30 minute break. Start with the most challenging material when your mind is fresh. Mix up subjects to avoid mental fatigue, and always review previous material before starting new topics."
            },
            {
              user: "I get distracted easily while studying. Any tips to stay focused?",
              ai: "Create a dedicated study space, put your phone in another room or use app blockers, and let others know you're studying to avoid interruptions. Use background noise that helps you focus (or silence if preferred), keep water and healthy snacks nearby, and break large tasks into smaller, manageable chunks. Reward yourself for completing focused sessions!"
            },
            {
              user: "How far in advance should I start preparing for exams?",
              ai: "Start as early as possible! For major exams, begin reviewing 2-3 weeks in advance. Create a study schedule that covers all topics with time for multiple reviews. The earlier you start, the less stressful it becomes. Daily review of class material, even for 15 minutes, prevents the need for cramming and improves long-term retention."
            }
          ]
        },
        {
          title: 'Math Problem-Solving Skills',
          persona: personas.find(p => p.id === 'education-tutor') || personas[0],
          conversations: [
            {
              user: "I'm terrible at math and always get anxious during math problems. Help!",
              ai: "Math anxiety is very common and manageable! Start by taking deep breaths and reminding yourself that making mistakes is part of learning. Break problems into smaller steps, write down what you know, and identify what you're trying to find. Practice regularly with easier problems to build confidence before tackling harder ones."
            },
            {
              user: "What's the best approach to solving word problems?",
              ai: "Use the CUBES method: Circle important numbers, Underline the question, Box key words, Eliminate unnecessary information, and Solve step by step. Read the problem twice, identify what operation(s) you need, set up the equation, solve, and always check if your answer makes sense in the context of the problem."
            },
            {
              user: "How can I check if my math answers are correct?",
              ai: "Great habit to develop! For equations, substitute your answer back into the original problem. For word problems, ask if your answer is reasonable given the context. Use estimation to check if you're in the right ballpark. Work backwards from your answer, or try solving the same problem using a different method to verify your result."
            },
            {
              user: "I understand math in class but struggle with homework. Why?",
              ai: "This is normal! In class, you have guidance and examples fresh in your mind. For homework, start while the lesson is recent, review your class notes first, and work through similar examples before attempting new problems. If stuck, try to identify exactly where you're confused so you can ask specific questions. Practice makes these patterns more automatic."
            }
          ]
        },
        {
          title: 'Writing and Communication Skills',
          persona: personas.find(p => p.id === 'education-tutor') || personas[0],
          conversations: [
            {
              user: "I have great ideas but struggle to organize them in writing. Any advice?",
              ai: "Organization is key to clear writing! Start with an outline - even a simple one with main points and supporting details. Use the classic structure: introduction with thesis, body paragraphs with one main idea each, and conclusion. Don't worry about perfect sentences initially; focus on getting your ideas down, then organize and refine in revision."
            },
            {
              user: "How can I make my writing more engaging and less boring?",
              ai: "Great question! Use varied sentence structures - mix short and long sentences. Start with hooks like questions, surprising facts, or vivid descriptions. Use active voice when possible, choose specific verbs over generic ones, and include concrete examples. Read your work aloud - if it sounds monotonous to you, it will to readers too."
            },
            {
              user: "I always run out of time during essay exams. How can I write faster?",
              ai: "Practice timed writing regularly! Spend 5-10 minutes planning before writing - this actually saves time. Create a simple outline with your main points. Don't aim for perfection in a timed setting; focus on clear, complete thoughts. Practice writing by hand if that's your exam format, as it's different from typing. Leave time for a quick review at the end."
            },
            {
              user: "How important is grammar, and how can I improve it?",
              ai: "Grammar matters because it helps readers understand your ideas clearly! Read extensively - you'll absorb correct patterns naturally. Use grammar checkers, but don't rely on them completely. Learn one grammar rule at a time rather than trying to master everything at once. When you make errors, understand why they're wrong so you can avoid them in the future."
            }
          ]
        }
      ];

    case 'news':
      return [
        {
          title: 'Today\'s News Summary',
          persona: personas.find(p => p.id === 'general-local') || personas[4],
          conversations: [
            {
              user: "Can you give me a quick summary of today's top news?",
              ai: "Here are today's key headlines: In technology, AI development continues to accelerate with new regulations being discussed globally. Climate action initiatives are making progress with several countries announcing new renewable energy commitments. The economy shows mixed signals with some sectors growing while others face challenges. Would you like me to elaborate on any particular topic?"
            },
            {
              user: "What's happening with the economy right now?",
              ai: "Current economic indicators show a complex picture. Inflation has been moderating in many regions, but central banks remain cautious about interest rate changes. Employment numbers are generally stable, though some tech and retail sectors have seen adjustments. Consumer spending patterns are shifting toward essentials and experiences. Global supply chains continue to stabilize after recent disruptions."
            },
            {
              user: "Any significant world events I should know about?",
              ai: "Several important developments globally: International climate negotiations are ongoing with focus on renewable energy transitions. Various humanitarian aid efforts are addressing challenges in multiple regions. Trade relationships continue evolving between major economic powers. Cultural exchanges and diplomatic initiatives are fostering international cooperation in science and education."
            },
            {
              user: "What about local news? Anything important happening nearby?",
              ai: "For local updates, I'd recommend checking your city's official news sources for the most current information. Typically, local news covers municipal decisions, community events, infrastructure projects, and local business developments. School board meetings, city council updates, and community initiatives often have direct impacts on residents' daily lives."
            }
          ]
        },
        {
          title: 'Weather and Daily Planning',
          persona: personas.find(p => p.id === 'general-local') || personas[4],
          conversations: [
            {
              user: "What's the weather forecast for today and should I plan anything specific?",
              ai: "I'd recommend checking your local weather app for the most accurate forecast, as conditions vary by location. Generally, it's good to check temperature ranges, precipitation chances, and wind conditions when planning your day. Consider indoor backup plans if weather looks uncertain, and dress in layers if temperatures will change significantly throughout the day."
            },
            {
              user: "How should I prepare for potential weather changes this week?",
              ai: "Great planning approach! Check extended forecasts and watch for significant temperature swings or precipitation patterns. Keep appropriate clothing options ready - layers for temperature changes, rain gear for wet weather, and sun protection for clear days. For outdoor activities, have backup indoor plans. Monitor weather alerts for any severe conditions in your area."
            },
            {
              user: "Does weather really affect productivity and mood?",
              ai: "Weather can indeed influence mood and energy levels! Sunlight helps regulate circadian rhythms and vitamin D production. Seasonal changes can affect some people's mood (seasonal affective patterns). However, you can adapt: use bright lights during darker periods, maintain regular routines regardless of weather, and plan activities that match the conditions rather than fighting them."
            },
            {
              user: "What are some good activities for different types of weather?",
              ai: "Weather adaptation makes life more enjoyable! Sunny days are perfect for outdoor activities, gardening, or hiking. Rainy days are great for indoor projects, reading, cooking, or visiting museums. Snowy weather offers opportunities for winter sports or cozy indoor activities. Mild overcast days are often ideal for running errands or moderate outdoor activities without sun exposure concerns."
            }
          ]
        },
        {
          title: 'Daily Life Organization',
          persona: personas.find(p => p.id === 'general-local') || personas[4],
          conversations: [
            {
              user: "I always feel behind on daily tasks. How can I better organize my day?",
              ai: "Time management is a skill that improves with practice! Try time-blocking your calendar, prioritize 3 key tasks per day, and use the 'two-minute rule' - if something takes less than two minutes, do it immediately. Create routines for repetitive tasks, batch similar activities together, and build in buffer time for unexpected issues."
            },
            {
              user: "What's the best way to handle information overload from news and social media?",
              ai: "Set specific times for news consumption rather than constant checking. Choose 2-3 reliable news sources instead of scrolling multiple feeds. Use the 'need to know vs. nice to know' filter - focus on information that actually affects your life or decisions. Consider a daily news summary instead of real-time updates to reduce anxiety and improve focus."
            },
            {
              user: "How do I balance staying informed with maintaining mental well-being?",
              ai: "Balance is crucial for mental health! Limit news consumption to 15-30 minutes per day, avoid news before bedtime or first thing in the morning. Focus on solution-oriented content rather than just problems. Take breaks from news entirely when feeling overwhelmed. Remember that being constantly informed doesn't make you more prepared - taking care of your mental health does."
            },
            {
              user: "What daily habits help maintain a good balance in life?",
              ai: "Consistent daily habits create stability! Try: morning routines that set a positive tone, regular meal times, scheduled breaks throughout your day, brief exercise or movement, connecting with others, and evening wind-down routines. The key is starting small and being consistent rather than trying to implement major changes all at once. What resonates most with your current lifestyle?"
            }
          ]
        }
      ];

    default:
      // Return a generic set for any unmatched fields
      return [
        {
          title: `${field.name} Consultation`,
          persona: personas[0],
          conversations: [
            {
              user: `I'm interested in learning more about ${field.name.toLowerCase()}. Can you help?`,
              ai: `I'd be happy to help you explore ${field.name.toLowerCase()}! This is such an important topic, and I'm here to provide guidance based on your specific needs and goals. What particular aspect would you like to start with, or do you have any specific questions in mind?`
            },
            {
              user: "Where should someone begin if they're completely new to this area?",
              ai: `For beginners in ${field.name.toLowerCase()}, I always recommend starting with the fundamentals. Understanding the basics provides a solid foundation for everything else. It's also important to set realistic expectations and goals from the beginning. What's your current experience level, and what are you hoping to achieve?`
            },
            {
              user: "What are some common mistakes people make in this field?",
              ai: `Great question! One of the most common mistakes is trying to do too much too quickly. Another is not seeking proper guidance or reliable sources of information. Many people also give up too early when they don't see immediate results. The key is patience, consistency, and finding approaches that work for your individual situation.`
            },
            {
              user: "How can I stay motivated and make consistent progress?",
              ai: `Motivation comes from setting clear, achievable goals and celebrating small wins along the way. Track your progress, connect with others who share similar interests, and remember why you started this journey. Most importantly, focus on building sustainable habits rather than seeking quick results. What specific goals do you have in mind for ${field.name.toLowerCase()}?`
            }
          ]
        }
      ];
  }
}