import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { dishName, uid, idToken } = req.body;

  // 1. Verify Firebase ID token
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }

  // 2. Check per-user daily limit (15)
  const today = new Date().toISOString().split('T')[0];
  const usageRef = db.collection('users').doc(uid).collection('usage').doc(today);

  try {
    const usageSnap = await usageRef.get();
    const usageData = usageSnap.exists ? usageSnap.data() : {};
    if ((usageData.searchDish || 0) >= 15) {
      return res.status(429).json({
        message: 'You have reached your daily limit of 15 dish searches. Try again tomorrow.',
      });
    }
  } catch (error) {
    console.error('Error checking usage:', error);
  }

  // 3. Validate input
  if (!dishName || typeof dishName !== 'string' || dishName.trim().length === 0) {
    return res.status(400).json({ message: 'Please provide a dish name.' });
  }
  if (dishName.length > 100) {
    return res.status(400).json({ message: 'Dish name must be 100 characters or fewer.' });
  }

  // 4. Call Gemini API
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemInstruction = 'You are a chef assistant. Return the complete recipe for the dish requested. Return ONLY valid JSON — no markdown, no code blocks, no extra text.';

    const userPrompt = `Give me the full recipe for: ${dishName.trim()}.
Return a JSON object with exactly these fields:
name (string),
cuisine (string),
diet (string: veg or non-veg),
description (string, one sentence),
base_servings (number, always 2),
ingredients (array of objects with name, quantity, unit),
steps (array of strings)`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    });

    const responseText = result.response.text();

    // 5. Parse JSON response
    let parsed;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return res.status(500).json({
        message: 'Something went wrong generating suggestions. Please try again.',
      });
    }

    // 6. Atomically increment user usage
    await usageRef.set(
      { searchDish: admin.firestore.FieldValue.increment(1) },
      { merge: true }
    );

    // 7. Atomically increment global usage
    const appStatsRef = db.collection('appStats').doc('dailyUsage');
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
