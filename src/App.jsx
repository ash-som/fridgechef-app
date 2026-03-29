import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import IngredientScreen from './screens/IngredientScreen';
import SuggestionsScreen from './screens/SuggestionsScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import SearchScreen from './screens/SearchScreen';
import SavedScreen from './screens/SavedScreen';
import { checkOnboarding } from './hooks/useFirestore';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (user) {
      checkOnboarding(user.uid)
        .then((done) => {
          setOnboardingDone(done);
          setCheckingOnboarding(false);
        })
        .catch(() => {
          setOnboardingDone(false);
          setCheckingOnboarding(false);
        });
    } else {
      setCheckingOnboarding(false);
    }
  }, [user]);

  if (loading || (user && checkingOnboarding)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-surface-500 mt-3">Loading FridgeChef...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {user && onboardingDone === false ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <IngredientScreen />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/suggestions"
          element={
            <ProtectedRoute>
              <SuggestionsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipe"
          element={
            <ProtectedRoute>
              <RecipeDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Show bottom nav only for authenticated users and not on login/onboarding */}
      {user && onboardingDone !== false && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
