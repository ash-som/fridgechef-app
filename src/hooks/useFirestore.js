import {
  doc, getDoc, setDoc, updateDoc, collection,
  getDocs, deleteDoc, increment, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Read user preferences
export async function getUserPreferences(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    const data = snap.data();
    return data.preferences || { cuisines: [], diet: 'both', defaultServings: 2 };
  }
  return { cuisines: [], diet: 'both', defaultServings: 2 };
}

// Save onboarding preferences
export async function saveUserPreferences(uid, preferences) {
  await updateDoc(doc(db, 'users', uid), {
    preferences,
    onboardingDone: true,
  });
}

// Check onboarding status
export async function checkOnboarding(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data().onboardingDone === true;
  }
  return false;
}

// Get lastIngredients
export async function getLastIngredients(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data().lastIngredients || [];
  }
  return [];
}

// Save lastIngredients
export async function saveLastIngredients(uid, ingredients) {
  await updateDoc(doc(db, 'users', uid), {
    lastIngredients: ingredients,
  });
}

// Save a recipe
export async function saveRecipe(uid, recipe, status) {
  const recipeId = recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const recipeRef = doc(db, 'users', uid, 'recipes', recipeId);
  const existing = await getDoc(recipeRef);

  if (existing.exists() && status === 'tried') {
    await updateDoc(recipeRef, {
      status: 'tried',
      cookCount: increment(1),
      lastCooked: serverTimestamp(),
    });
  } else {
    await setDoc(recipeRef, {
      name: recipe.name,
      cuisine: recipe.cuisine || '',
      diet: recipe.diet || '',
      status,
      cookCount: status === 'tried' ? 1 : 0,
      lastCooked: status === 'tried' ? serverTimestamp() : null,
      savedAt: serverTimestamp(),
      servings: recipe.base_servings || 2,
      matchPercentage: recipe.match_percentage || null,
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      description: recipe.description || '',
    }, { merge: true });
  }
}

// Get saved recipes
export async function getSavedRecipes(uid) {
  const recipesRef = collection(db, 'users', uid, 'recipes');
  const q = query(recipesRef, orderBy('savedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
