import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RecipeCard from '../components/RecipeCard';
import { getSavedRecipes } from '../hooks/useFirestore';

const STATUS_TABS = ['All', 'Saved', 'Tried'];

export default function SavedScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [cuisineFilter, setCuisineFilter] = useState('All');

  useEffect(() => {
    if (user) {
      getSavedRecipes(user.uid)
        .then(setRecipes)
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Get unique cuisines for filter
  const cuisines = useMemo(() => {
    const set = new Set(recipes.map((r) => r.cuisine).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [recipes]);

  // Filter recipes
  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (activeTab !== 'All' && r.status !== activeTab.toLowerCase()) return false;
      if (cuisineFilter !== 'All' && r.cuisine !== cuisineFilter) return false;
      return true;
    });
  }, [recipes, activeTab, cuisineFilter]);

  const handleCardClick = (recipe) => {
    // Adapt the recipe data to work with RecipeDetailScreen
    const dish = {
      name: recipe.name,
      cuisine: recipe.cuisine,
      diet: recipe.diet,
      description: recipe.description || '',
      base_servings: recipe.servings || 2,
      match_percentage: recipe.matchPercentage,
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      matched_ingredients: [],
      missing_ingredients: [],
    };
    navigate('/recipe', { state: { dish, ingredients: [] } });
  };

  return (
    <div className="main-content" id="saved-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-surface-900">Saved Recipes</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Status tabs */}
        <div className="flex gap-1 bg-surface-100 rounded-lg p-1 mb-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cuisine filter chips */}
        {cuisines.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {cuisines.map((c) => (
              <button
                key={c}
                onClick={() => setCuisineFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  cuisineFilter === c
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-surface-600 border-surface-300 hover:border-brand-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-surface-200 p-4 space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-surface-500 text-sm">
              {recipes.length === 0
                ? 'No recipes saved yet. Start exploring dishes!'
                : 'No recipes match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => handleCardClick(recipe)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
