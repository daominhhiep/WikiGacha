import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, type Player } from './auth-store';

/**
 * AuthCallback handles the redirect from Google OAuth2.
 * It extracts the token from URL query parameters, saves it to the store,
 * and redirects the user to the home page.
 */
export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // We don't have the player object yet, but MainLayout will fetch it via usePlayerProfile
      // We set a temporary partial player object with the token to trigger the session
      setAuth({ id: 'pending', username: 'GoogleUser' } as Player, token);
      // Navigate to home
      navigate('/');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 font-mono">
      <div className="size-12 border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm uppercase tracking-widest text-primary animate-pulse">
        [ SYNCHRONIZING_CORE_IDENTITY... ]
      </p>
    </div>
  );
};
