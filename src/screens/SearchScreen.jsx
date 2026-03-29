import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ServingStepper from '../components/ServingStepper';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorBanner from '../components/ErrorBanner';
import { getLastIngredients, saveRecipe } from '../hooks/useFirestore';

export default function SearchScreen() {
  const { user, getIdToken } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [lastIngredients, setLastIngredients] = useState([]);
  const [servings, setServings] = useState(2);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(null);

  // Load last ingredients on mount
  useEffect(() => {
    if (user) {
      getLastIngredients(user.uid).then(setLastIngredients);
    }
  }, [user]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSavedStatus(null);
    setServings(2);

    try {
      const idToken = await getIdToken();
      const res = await fetch('/api/searchDish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishName: trimmed,
          uid: user.uid,
          idToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setResult(data);
    } catch {
      setError('Something went wrong generating suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSave = async (status) => {
    if (!result) return;
    setSaving(true);
    try {
      await saveRecipe(user.uid, result, status);
      setSavedStatus(status);
    } catch {
      setError('Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Compare dish ingredients against lastIngredients
  const compareIngredients = () => {
    if (!result?.ingredients) return { have: [], need: [] };

    const normalizedLast = lastIngredients.map((i) => i.toLowerCase().trim());

    const have = result.ingredients.filter((ing) =>
      normalizedLast.some(
        (li) => ing.name.toLowerCase().includes(li) || li.includes(ing.name.toLowerCase())
      )
    );
    const need = result.ingredients.filter((ing) =>
      !normalizedLast.some(
        (li) => ing.name.toLowerCase().includes(li) || li.includes(ing.name.toLowerCase())
      )
    );

    return { have, need };
  };

  const baseServings = result?.base_servings || 2;
  const scaleFactor = servings / baseServings;

  const scaleQuantity = (qty) => {
    const num = parseFloat(qty);
    if (isNaN(num)) return qty;
    const scaled = num * scaleFactor;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  };

  const { have, need } = result ? compareIngredients() : { have: [], need: [] };

  return (
    <div className="main-content" id="search-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-surface-900">Search a Dish</h1>
          <p className="text-sm text-surface-500 mt-0.5">Look up any dish for its recipe</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Search bar */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Try "Biryani" or "Pasta Carbonara"...'
            className="flex-1 px-3 py-2.5 bg-white border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-surface-400"
            id="search-input"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            id="search-btn"
          >
            Search
          </button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {loading && <LoadingSkeleton count={2} />}

        {result && !loading && (
          <div className="space-y-6">
            {/* Dish header */}
            <div>
              <h2 className="text-lg font-bold text-surface-900">{result.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                {result.cuisine && (
                  <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs font-medium rounded">
                    {result.cuisine}
                  </span>
                )}
                {result.diet && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    result.diet === 'veg' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {result.diet === 'veg' ? '🟢 Veg' : '🔴 Non-veg'}
                  </span>
                )}
              </div>
              {result.description && (
                <p className="text-sm text-surface-500 mt-2">{result.description}</p>
              )}
            </div>

            {/* Servings */}
            <ServingStepper servings={servings} onChange={setServings} />

            {/* Ingredients you already have */}
            {have.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-1.5">
                  <span className="text-green-500">✅</span> Ingredients you already have
                </h3>
                <div className="bg-green-50 rounded-xl border border-green-100 divide-y divide-green-100">
                  {have.map((ing, i) => (
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

            {/* Ingredients you need to buy */}
            {need.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-1.5">
                  <span className="text-red-400">🛒</span> Ingredients you need to buy
                </h3>
                <div className="bg-red-50 rounded-xl border border-red-100 divide-y divide-red-100">
                  {need.map((ing, i) => (
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

            {/* If no lastIngredients to compare, show all ingredients */}
            {have.length === 0 && need.length === 0 && result.ingredients?.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-surface-900 mb-3">All Ingredients</h3>
                <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100">
                  {result.ingredients.map((ing, i) => (
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

            {/* Recipe steps */}
            {result.steps?.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-surface-900 mb-3">Recipe Steps</h3>
                <ol className="space-y-3">
                  {result.steps.map((step, i) => (
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
                id="search-save-btn"
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
                id="search-tried-btn"
              >
                {savedStatus === 'tried' ? '✓ Marked as Tried' : 'Mark as Tried'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state when no search done */}
        {!result && !loading && !error && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-surface-400 text-sm">
              Search for any dish to get its full recipe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
