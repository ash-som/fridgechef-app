import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DishCard from '../components/DishCard';
import DietToggle from '../components/DietToggle';

export default function SuggestionsScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [dietFilter, setDietFilter] = useState('both');

  const rawDishes = state?.dishes || {};
  const ingredients = state?.ingredients || [];

  // Flatten, filter by match >= 65, and apply diet filter
  const groupedSorted = useMemo(() => {
    const groups = {};

    Object.entries(rawDishes).forEach(([cuisineName, dishes]) => {
      if (!Array.isArray(dishes)) return;

      const filtered = dishes
        .filter((d) => d.match_percentage >= 65)
        .filter((d) => {
          if (dietFilter === 'both') return true;
          return d.diet === dietFilter;
        })
        .sort((a, b) => b.match_percentage - a.match_percentage);

      if (filtered.length > 0) {
        groups[cuisineName] = filtered;
      }
    });

    // Sort cuisine sections by their top dish's match_percentage
    const sorted = Object.entries(groups).sort(
      ([, a], [, b]) => b[0].match_percentage - a[0].match_percentage
    );

    return sorted;
  }, [rawDishes, dietFilter]);

  const totalDishes = groupedSorted.reduce((sum, [, dishes]) => sum + dishes.length, 0);

  const handleDishClick = (dish) => {
    navigate('/recipe', { state: { dish, ingredients } });
  };

  if (!state?.dishes) {
    return (
      <div className="main-content flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center">
          <p className="text-surface-500 text-sm">No search results yet.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-3 text-brand-600 text-sm font-semibold hover:text-brand-700"
          >
            ← Go to ingredient input
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" id="suggestions-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/')}
              className="text-surface-500 hover:text-surface-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-surface-900">Dish Suggestions</h1>
              <p className="text-sm text-surface-500">
                {totalDishes} dish{totalDishes !== 1 ? 'es' : ''} found
              </p>
            </div>
          </div>

          {/* Diet filter */}
          <DietToggle selected={dietFilter} onChange={setDietFilter} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {totalDishes === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🫗</p>
            <p className="text-surface-500 text-sm">
              Try adding a few more ingredients to see suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedSorted.map(([cuisineName, dishes]) => (
              <section key={cuisineName}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wide">
                    {cuisineName}
                  </h2>
                  <span className="text-xs text-surface-400 font-medium">
                    {dishes.length} dish{dishes.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {dishes.map((dish) => (
                    <DishCard
                      key={dish.name}
                      dish={dish}
                      onClick={() => handleDishClick(dish)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
