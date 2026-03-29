import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ServingStepper from '../components/ServingStepper';
import ErrorBanner from '../components/ErrorBanner';
import { saveRecipe } from '../hooks/useFirestore';

export default function RecipeDetailScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const dish = state?.dish;
  const passedIngredients = state?.ingredients || [];

  const [servings, setServings] = useState(dish?.base_servings || 2);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(null);
  const [error, setError] = useState('');

  if (!dish) {
    return (
      <div className="main-content flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center">
          <p className="text-surface-500 text-sm">No recipe data found.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-3 text-brand-600 text-sm font-semibold hover:text-brand-700"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const baseServings = dish.base_servings || 2;
  const scaleFactor = servings / baseServings;

  const scaleQuantity = (qty) => {
    const num = parseFloat(qty);
    if (isNaN(num)) return qty;
    const scaled = num * scaleFactor;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  };

  const handleSave = async (status) => {
    setSaving(true);
    setError('');
    try {
      await saveRecipe(user.uid, dish, status);
      setSavedStatus(status);
    } catch (err) {
      setError('Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Determine matched and missing ingredients
  const matchedIngredients = dish.ingredients?.filter((ing) =>
    dish.matched_ingredients?.some(
      (m) => m.toLowerCase() === ing.name.toLowerCase()
    )
  ) || [];

  const missingIngredients = dish.ingredients?.filter((ing) =>
    dish.missing_ingredients?.some(
      (m) => m.toLowerCase() === ing.name.toLowerCase()
    )
  ) || [];

  return (
    <div className="main-content" id="recipe-detail-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="text-surface-500 hover:text-surface-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-surface-900 truncate">{dish.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs font-medium rounded">
                  {dish.cuisine}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  dish.diet === 'veg' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {dish.diet === 'veg' ? '🟢 Veg' : '🔴 Non-veg'}
                </span>
              </div>
            </div>
          </div>

          {dish.description && (
            <p className="text-sm text-surface-500 mt-2">{dish.description}</p>
          )}
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        {/* Serving stepper */}
        <ServingStepper servings={servings} onChange={setServings} />

        {/* What you have */}
        {matchedIngredients.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-1.5">
              <span className="text-green-500">✅</span> What you have
            </h2>
            <div className="bg-green-50 rounded-xl border border-green-100 divide-y divide-green-100">
              {matchedIngredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-surface-700 font-medium">{ing.name}</span>
                  <span className="text-sm text-surface-500">
                    {scaleQuantity(ing.quantity)} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What you're missing */}
        {missingIngredients.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-1.5">
              <span className="text-red-400">❌</span> What you're missing
            </h2>
            <div className="bg-red-50 rounded-xl border border-red-100 divide-y divide-red-100">
              {missingIngredients.map((ing, i) => (
                <div key={i} className="px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-700 font-medium">{ing.name}</span>
                    <span className="text-sm text-surface-500">
                      {scaleQuantity(ing.quantity)} {ing.unit}
                    </span>
                  </div>
                  {dish.alternative_suggestions?.[ing.name] && (
                    <p className="text-xs text-surface-400 mt-1 italic">
                      💡 Alternative: {dish.alternative_suggestions[ing.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recipe Steps */}
        {dish.steps && dish.steps.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-surface-900 mb-3">Recipe Steps</h2>
            <ol className="space-y-3">
              {dish.steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 w-6 h-6 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-surface-700 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Show all ingredients if matched/missing not available (e.g., from search) */}
        {matchedIngredients.length === 0 && missingIngredients.length === 0 && dish.ingredients?.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-surface-900 mb-3">Ingredients</h2>
            <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100">
              {dish.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-surface-700 font-medium">{ing.name}</span>
                  <span className="text-sm text-surface-500">
                    {scaleQuantity(ing.quantity)} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSave('saved')}
            disabled={saving || savedStatus === 'saved'}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
              savedStatus === 'saved'
                ? 'bg-brand-50 text-brand-600 border border-brand-200'
                : 'bg-white border border-surface-300 text-surface-700 hover:border-brand-400 hover:text-brand-600'
            } disabled:opacity-50`}
            id="save-recipe-btn"
          >
            {savedStatus === 'saved' ? '✓ Saved' : 'Save Recipe'}
          </button>
          <button
            onClick={() => handleSave('tried')}
            disabled={saving}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
              savedStatus === 'tried'
                ? 'bg-brand-500 text-white'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            } disabled:opacity-50`}
            id="mark-tried-btn"
          >
            {savedStatus === 'tried' ? '✓ Marked as Tried' : 'Mark as Tried'}
          </button>
        </div>
      </div>
    </div>
  );
}
