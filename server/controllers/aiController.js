import { GoogleGenerativeAI } from '@google/generative-ai';
import EnergyRecord from '../models/EnergyRecord.js';
import { getMockRecords } from '../utils/mockDb.js';

// Highly responsive heuristic recommendations engine
const getHeuristicInsight = (sleep, screenTime, waterIntake, stressLevel, energyScore) => {
  let sleepAdvice = '';
  let waterAdvice = '';
  let screenAdvice = '';
  let stressAdvice = '';

  // 1. Sleep Advice
  if (sleep < 5) {
    sleepAdvice = `Critically low sleep (${sleep}h) is severely depleting your glycogen reserves. Prioritize a 90-minute nap or early bedtime to clear adenosine buildup.`;
  } else if (sleep < 7) {
    sleepAdvice = `Sub-optimal sleep (${sleep}h) leaves your central nervous system partially recovered. Try to extend sleep by 30-60 minutes tonight to boost mental stamina.`;
  } else if (sleep <= 9) {
    sleepAdvice = `Fantastic sleep duration (${sleep}h)! Your brain completed 5-6 full REM cycles, optimizing memory consolidation and cellular repair.`;
  } else {
    sleepAdvice = `Excessive sleep duration (${sleep}h) might cause sleep inertia or signal low sleep quality. Focus on maintaining a consistent wake-up time.`;
  }

  // 2. Water Advice (Highly detailed and responsive to all inputs!)
  if (waterIntake < 3) {
    waterAdvice = `With severe dehydration (${waterIntake} glasses), your blood volume drops, forcing your heart to work harder. Drink 2 full glasses of water immediately to restore focus and blood pressure.`;
  } else if (waterIntake < 6) {
    waterAdvice = `Mild dehydration (${waterIntake} glasses) is causing sub-clinical cell shrinkage, leading to brain fog and fatigue. Try to reach at least 8 glasses today.`;
  } else if (waterIntake < 9) {
    waterAdvice = `Good hydration of ${waterIntake} glasses supports core metabolic reactions and cellular energy output. Continue sipping steadily throughout the afternoon.`;
  } else if (waterIntake <= 15) {
    waterAdvice = `Outstanding hydration of ${waterIntake} glasses! This level of fluid intake maximizes muscle performance, keeps joints lubricated, and optimizes digestive health.`;
  } else {
    waterAdvice = `You logged a very high water intake of ${waterIntake} glasses. Be mindful of electrolyte balance, and avoid drinking massive volumes in a short span to protect kidney efficiency.`;
  }

  // 3. Screen Advice
  if (screenTime > 8) {
    screenAdvice = `High screen time (${screenTime}h) is over-stimulating your visual cortex and exhausting neurotransmitter levels. Take a 15-minute screen-free break now.`;
  } else if (screenTime > 5) {
    screenAdvice = `Moderate screen time (${screenTime}h) is manageable, but limit screen exposure in the 2 hours before bed to protect your sleep quality.`;
  } else {
    screenAdvice = `Excellent digital discipline today (${screenTime}h of screen time)! This low visual stimulation prevents digital eye strain and keeps dopamine receptors balanced.`;
  }

  // 4. Stress Advice
  if (stressLevel > 7) {
    stressAdvice = `High stress (${stressLevel}/10) is flooding your bloodstream with cortisol, which burns glucose rapidly. Do 5 minutes of box breathing to activate your parasympathetic system.`;
  } else if (stressLevel > 4) {
    stressAdvice = `Moderate stress (${stressLevel}/10) is draining your energy. Try a brief 10-minute walk outside to release physical tension and reset your focus.`;
  } else {
    stressAdvice = `Low stress (${stressLevel}/10) indicates a calm, parasympathetic state. This state is perfect for sustainable focus and cellular regeneration.`;
  }

  // Assemble structured composite advice
  const healthStatus = energyScore > 80 ? "Supporting peak energy." : 
                       energyScore > 60 ? "Moderate, but has clear optimization areas." : 
                       "Currently draining your energy levels.";

  return `Daily Overview: Your habits are ${healthStatus}\n\n• Rest: ${sleepAdvice}\n\n• Hydration: ${waterAdvice}\n\n• Screen Habits: ${screenAdvice}\n\n• Stress Load: ${stressAdvice}`;
};

// @desc    Get AI-based recommendations based on latest record
// @route   GET /api/records/ai-insight
// @access  Private
export const getAIInsight = async (req, res) => {
  try {
    let latestRecord = null;

    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockRecords = getMockRecords();
      const userRecs = mockRecords.filter(r => r.user === req.user._id);

      if (userRecs.length === 0) {
        return res.json({
          insight: "Welcome to Energy Analyzer! Enter your first health analysis on the 'Analysis' page to generate personalized AI recommendations.",
          hasData: false
        });
      }

      // Sort by date desc and take first
      latestRecord = [...userRecs].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    } else {
      // Find the latest record in real MongoDB
      latestRecord = await EnergyRecord.findOne({ user: req.user._id }).sort({ date: -1 });
    }
    // =================================================

    if (!latestRecord) {
      return res.json({
        insight: "Welcome to Energy Analyzer! Enter your first health analysis on the 'Analysis' page to generate personalized AI recommendations.",
        hasData: false
      });
    }

    const { sleep, screenTime, waterIntake, stressLevel, energyScore } = latestRecord;

    // Check if GEMINI_API_KEY is available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'placeholder_key') {
      try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an expert empathetic health coach. Based on the user's wellness metrics today: 
- Sleep: ${sleep} hours
- Screen Time: ${screenTime} hours
- Water Intake: ${waterIntake} glasses
- Stress Level: ${stressLevel}/10
- Calculated Energy Score: ${energyScore}/100

Generate a highly personalized daily recommendation (maximum 75 words) that explains what is draining their energy and suggests 2 immediate, actionable, and scientific changes they can make. Keep the tone inspiring, direct, and empathetic. Do not use markdown headers or lists.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return res.json({
          insight: responseText.trim(),
          hasData: true,
          provider: global.isMockDB ? 'Gemini AI (Local Session)' : 'Gemini AI'
        });
      } catch (aiError) {
        console.error('Gemini API call failed, falling back to heuristics:', aiError);
        // Fall through to heuristics
      }
    }

    // Heuristics Fallback
    const insight = getHeuristicInsight(sleep, screenTime, waterIntake, stressLevel, energyScore);
    res.json({
      insight,
      hasData: true,
      provider: global.isMockDB ? 'Local Analysis Engine (Mock DB)' : 'Local Analysis Engine'
    });

  } catch (error) {
    console.error('AI Insight controller error:', error);
    res.status(500).json({ message: 'Server error generating AI insight' });
  }
};
