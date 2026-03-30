import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin (singleton)
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ingredients, cuisines, diet, location, uid, idToken } = req.body;

  // 1. Verify Firebase ID token
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }

  // 2. Check per-user daily limit (20)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const usageRef = db.collection('users').doc(uid).collection('usage').doc(today);

  try {
    const usageSnap = await usageRef.get();
    const usageData = usageSnap.exists ? usageSnap.data() : {};
    if ((usageData.findDishes || 0) >= 20) {
      return res.status(429).json({
        message: 'You have reached your daily limit of 20 dish searches. Try again tomorrow.',
      });
    }
  } catch (error) {
    console.error('Error checking usage:', error);
  }

  // 3. Check global daily limit (500)
  const appStatsRef = db.collection('appStats').doc('dailyUsage');
  try {
    const statsSnap = await appStatsRef.get();
    const statsData = statsSnap.exists ? statsSnap.data() : {};
    if (statsData.date === today && (statsData.totalCalls || 0) >= 500) {
      return res.status(503).json({
        message: 'FridgeChef is taking a short break. Try again tomorrow.',
      });
    }
  } catch (error) {
    console.error('Error checking app stats:', error);
  }

  // 4. Validate input
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one ingredient.' });
  }
  if (ingredients.length > 30) {
    return res.status(400).json({ message: 'Maximum 30 ingredients allowed.' });
  }

  // 5. Call Gemini API
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemInstruction = 'You are a chef assistant. Suggest dishes the user can make based on their available ingredients, cuisine preferences, diet type, and location. Only include dishes where match_percentage is 65 or above. Return ONLY valid JSON — no markdown, no code blocks, no extra text, no explanation.';

    const userPrompt = `Available ingredients: ${ingredients.join(', ')}. Cuisines: ${(cuisines || []).join(', ') || 'Any'}. Diet: ${diet || 'both'}. Location: ${location || 'Not specified'}.
Return a JSON object grouped by cuisine name. Each cuisine maps to an array of dish objects.
Each dish object must have exactly these fields:
name (string),
cuisine (string),
diet (string: veg or non-veg),
description (string, one sentence),
match_percentage (number, 0-100),
matched_ingredients (array of strings),
missing_ingredients (array of strings),
alternative_suggestions (object mapping each missing ingredient to one alternative),
base_servings (number, always 2),
ingredients (array of objects with name, quantity, unit),
steps (array of strings)`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    });

    const responseText = result.response.text();

    // 6. Parse JSON response
    let parsed;
    try {
      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return res.status(500).json({
        message: 'Something went wrong generating suggestions. Please try again.',
      });
    }

    // 7. Atomically increment user usage
    await usageRef.set(
      { findDishes: admin.firestore.FieldValue.increment(1) },
      { merge: true }
    );

    // 8. Atomically increment global usage
    const statsSnap = await appStatsRef.get();
    const statsData = statsSnap.exists ? statsSnap.data() : {};
    if (statsData.date === today) {
      await appStatsRef.update({
        totalCalls: admin.firestore.FieldValue.increment(1),
      });
    } else {
      await appStatsRef.set({
        date: today,
        totalCalls: 1,
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({
      message: 'Something went wrong generating suggestions. Please try again.',
    });
  }
}
