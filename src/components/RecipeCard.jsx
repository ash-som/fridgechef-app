export default function RecipeCard({ recipe, onClick }) {
  const savedDate = recipe.savedAt?.toDate ? recipe.savedAt.toDate().toLocaleDateString() : '';
  const lastCooked = recipe.lastCooked?.toDate ? recipe.lastCooked.toDate().toLocaleDateString() : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-surface-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all"
      id={`recipe-card-${recipe.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-surface-900 truncate">{recipe.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs font-medium rounded">
              {recipe.cuisine}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              recipe.diet === 'veg' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {recipe.diet === 'veg' ? '🟢 Veg' : '🔴 Non-veg'}
            </span>
          </div>
        </div>

        {recipe.status === 'tried' && recipe.cookCount > 0 && (
          <span className="shrink-0 px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-full">
            Cooked {recipe.cookCount}×
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-2.5 text-xs text-surface-400">
        {savedDate && <span>Saved {savedDate}</span>}
        {lastCooked && <span>• Last cooked {lastCooked}</span>}
      </div>
    </button>
  );
}
