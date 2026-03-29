export default function ServingStepper({ servings, onChange }) {
  return (
    <div className="flex items-center gap-3" id="serving-stepper">
      <span className="text-sm font-medium text-surface-600">Servings:</span>
      <div className="flex items-center gap-0 border border-surface-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, servings - 1))}
          disabled={servings <= 1}
          className="px-3 py-1.5 text-surface-600 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
          id="serving-minus"
        >
          −
        </button>
        <span className="px-4 py-1.5 text-sm font-semibold text-surface-900 bg-surface-50 border-x border-surface-300 min-w-[3rem] text-center">
          {servings}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(10, servings + 1))}
          disabled={servings >= 10}
          className="px-3 py-1.5 text-surface-600 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
          id="serving-plus"
        >
          +
        </button>
      </div>
    </div>
  );
}
