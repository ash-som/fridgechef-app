import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import IngredientInput from '../components/IngredientInput';
import CuisineChips from '../components/CuisineChips';
import DietToggle from '../components/DietToggle';
import ErrorBanner from '../components/ErrorBanner';
import { getUserPreferences, saveLastIngredients } from '../hooks/useFirestore';

export default function IngredientScreen() {
  const { user, getIdToken } = useAuth();
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [diet, setDiet] = useState('both');
  const [location, setLocation] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    if (user && !prefsLoaded) {
      getUserPreferences(user.uid).then((prefs) => {
        setCuisines(prefs.cuisines || []);
        setDiet(prefs.diet || 'both');
        setPrefsLoaded(true);
      });
    }
  }, [user, prefsLoaded]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || 'Unknown';
          setLocation(city);
        } catch {
          setLocation('Unknown');
        }
        setDetectingLocation(false);
      },
      () => {
        setError('Unable to detect location. Please allow location access.');
        setDetectingLocation(false);
      }
    );
  };

  const handleFindDishes = async () => {
    if (ingredients.length < 3) return;
    setLoading(true);
    setError('');

    try {
      const idToken = await getIdToken();
      await saveLastIngredients(user.uid, ingredients);

      const res = await fetch('/api/findDishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          cuisines,
          diet,
          location: location || 'Not specified',
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

      // Navigate to suggestions with the data
      navigate('/suggestions', { state: { dishes: data, ingredients } });
    } catch (err) {
      setError('Something went wrong generating suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = ingredients.length >= 3;

  return (
    <div className="main-content" id="ingredient-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-surface-900">Find Dishes</h1>
          <p className="text-sm text-surface-500 mt-0.5">Add what's in your fridge</p>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        {/* Ingredient Input */}
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">
            Your Ingredients
          </label>
          <IngredientInput ingredients={ingredients} onChange={setIngredients} />
          {ingredients.length > 0 && ingredients.length < 3 && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              Add at least {3 - ingredients.length} more ingredient{3 - ingredients.length > 1 ? 's' : ''} to search
            </p>
          )}
        </div>

        {/* Cuisines */}
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">
            Cuisines
          </label>
          <CuisineChips selected={cuisines} onChange={setCuisines} />
        </div>

        {/* Diet */}
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">
            Diet Preference
          </label>
          <DietToggle selected={diet} onChange={setDiet} />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">
            Location
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={detectLocation}
              disabled={detectingLocation}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-surface-300 rounded-lg text-sm text-surface-600 hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-50"
              id="detect-location-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {detectingLocation ? 'Detecting...' : 'Auto-detect'}
            </button>
            {location && (
              <span className="text-sm text-brand-600 font-medium">📍 {location}</span>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleFindDishes}
          disabled={!canSubmit || loading}
          className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          id="find-dishes-btn"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Finding dishes...
            </span>
          ) : (
            'Find Dishes'
          )}
        </button>
      </div>
    </div>
  );
}
