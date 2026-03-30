import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CuisineChips, { ALL_CUISINES } from '../components/CuisineChips';
import DietToggle from '../components/DietToggle';
import { saveUserPreferences } from '../hooks/useFirestore';

export default function OnboardingScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cuisines, setCuisines] = useState([]);
  const [diet, setDiet] = useState('both');
  const [saving, setSaving] = useState(false);

  const handleGetStarted = async () => {
    console.log('Get Started clicked');
    setSaving(true);
    try {
      await saveUserPreferences(user.uid, {
        cuisines: cuisines.length > 0 ? cuisines : [...ALL_CUISINES],
        diet,
        defaultServings: 2,
      });
      console.log('Preferences saved');
      console.log('Navigating to home');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    console.log('Skip clicked, navigating to home');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col" id="onboarding-screen">
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍳</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome to FridgeChef</h1>
          <p className="text-surface-500 mt-1.5 text-sm">
            Cook what you have. Discover what you're missing.
          </p>
        </div>

        {/* Cuisine Selection */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-surface-700 mb-3">
            What cuisines do you enjoy?
          </label>
          <CuisineChips selected={cuisines} onChange={setCuisines} />
          <p className="text-xs text-surface-400 mt-2">
            Select your favourites or skip to see all cuisines
          </p>
        </div>

        {/* Diet Selection */}
        <div className="mb-10">
          <label className="block text-sm font-semibold text-surface-700 mb-3">
            Diet preference
          </label>
          <DietToggle selected={diet} onChange={setDiet} />
        </div>

        {/* Actions */}
        <button
          onClick={handleGetStarted}
          disabled={saving}
          className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
          id="get-started-btn"
        >
          {saving ? 'Setting up...' : 'Get Started'}
        </button>

        <button
          onClick={handleSkip}
          className="w-full mt-3 py-2.5 text-sm text-surface-500 hover:text-surface-700 font-medium transition-colors"
          id="skip-btn"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
