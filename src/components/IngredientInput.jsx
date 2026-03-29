import { useState } from 'react';

export default function IngredientInput({ ingredients, onChange }) {
  const [inputValue, setInputValue] = useState('');

  const addIngredient = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      onChange([...ingredients, trimmed]);
    }
    setInputValue('');
  };

  const removeIngredient = (ingredient) => {
    onChange(ingredients.filter((i) => i !== ingredient));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  return (
    <div id="ingredient-input">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an ingredient and press Enter..."
          className="flex-1 px-3 py-2.5 bg-white border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-surface-400"
          id="ingredient-text-input"
        />
        <button
          type="button"
          onClick={addIngredient}
          disabled={!inputValue.trim()}
          className="px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
          id="add-ingredient-btn"
        >
          +
        </button>
      </div>

      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {ingredients.map((ing) => (
            <span
              key={ing}
              className="chip-enter inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 text-sm font-medium rounded-full border border-brand-200"
            >
              {ing}
              <button
                type="button"
                onClick={() => removeIngredient(ing)}
                className="ml-0.5 text-brand-400 hover:text-brand-700 font-bold text-xs"
                aria-label={`Remove ${ing}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
