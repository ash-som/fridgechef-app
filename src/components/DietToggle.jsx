const DIET_OPTIONS = ['Veg', 'Non-veg', 'Both'];

export default function DietToggle({ selected, onChange }) {
  return (
    <div className="flex gap-1 bg-surface-100 rounded-lg p-1" id="diet-toggle">
      {DIET_OPTIONS.map((option) => {
        const value = option.toLowerCase();
        const isActive = selected === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(value)}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
