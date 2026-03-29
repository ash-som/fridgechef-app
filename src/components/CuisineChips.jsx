const ALL_CUISINES = [
  'Indian', 'Italian', 'Chinese', 'Mexican',
  'Mediterranean', 'Continental', 'Thai', 'Japanese',
];

export default function CuisineChips({ selected = [], onChange }) {
  const toggle = (cuisine) => {
    if (selected.includes(cuisine)) {
      onChange(selected.filter((c) => c !== cuisine));
    } else {
      onChange([...selected, cuisine]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2" id="cuisine-chips">
      {ALL_CUISINES.map((cuisine) => {
        const isActive = selected.includes(cuisine);
        return (
          <button
            key={cuisine}
            type="button"
            onClick={() => toggle(cuisine)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              isActive
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-surface-600 border-surface-300 hover:border-brand-400 hover:text-brand-600'
            }`}
          >
            {cuisine}
          </button>
        );
      })}
    </div>
  );
}

export { ALL_CUISINES };
