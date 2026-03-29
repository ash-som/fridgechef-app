export default function DishCard({ dish, onClick }) {
  const matchColor = dish.match_percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
  const barColor = dish.match_percentage >= 80 ? 'bg-green-500' : 'bg-amber-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-surface-200 p-4 hover:border-brand-300 hover:shadow-sm transition-all"
      id={`dish-card-${dish.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-surface-900 truncate">{dish.name}</h3>
          <p className="text-sm text-surface-500 mt-0.5 line-clamp-2">{dish.description}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${matchColor}`}>
          {dish.match_percentage}%
        </span>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs font-medium rounded">
          {dish.cuisine}
        </span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
          dish.diet === 'veg' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {dish.diet === 'veg' ? '🟢 Veg' : '🔴 Non-veg'}
        </span>
      </div>

      {/* Match progress bar */}
      <div className="mt-3 h-1.5 bg-surface-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${dish.match_percentage}%` }}
        />
      </div>
    </button>
  );
}
