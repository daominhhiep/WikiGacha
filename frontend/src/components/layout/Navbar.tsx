import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth-store';
import { useGuestLogin, useGoogleLogin } from '@/features/auth/use-auth';
import { Database, User, LogOut, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect } from 'react';

// GSI Type Definitions
interface GoogleAuthResponse {
  credential: string;
}

interface GoogleOneTapNotification {
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleAuthResponse) => void;
            auto_select?: boolean;
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'small' | 'medium' | 'large';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              logo_alignment?: 'left' | 'center';
              width?: number;
            },
          ) => void;
          prompt: (callback?: (notification: GoogleOneTapNotification) => void) => void;
        };
      };
    };
  }
}

const navItems = [
  { label: 'Gacha', path: '/gacha' },
  { label: 'Collection', path: '/collection', requiresAuth: true },
  { label: 'Battle', path: '/battle', requiresAuth: true },
  { label: 'Missions', path: '/missions', requiresAuth: true },
  { label: 'Trophies', path: '/trophies', requiresAuth: true },
];

export function Navbar() {
  const location = useLocation();
  const { player, persistedGuestUsername, logout } = useAuthStore();
  const { mutate: guestLogin, isPending: isGuestLoggingIn } = useGuestLogin();
  const { mutate: verifyGoogle } = useGoogleLogin();
  const credits = player ? player.credits : 0;

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const initGoogle = () => {
      if (window.google && !player && googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: GoogleAuthResponse) => {
            console.log('[Google Auth] Credential received');
            verifyGoogle(response.credential);
          },
          auto_select: false,
          itp_support: true,
          use_fedcm_for_prompt: true, // Enable FedCM as per latest Google guidelines
        });

        const btnContainer = document.getElementById('google-login-btn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'medium',
            shape: 'square',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 150,
          });
        }

        // Show One Tap prompt
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.warn('[Google OneTap] Not displayed:', notification.getNotDisplayedReason());
          }
        });
      }
    };

    // Retry initialization if script isn't loaded yet
    const timer = setInterval(() => {
      if (window.google) {
        initGoogle();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [player, verifyGoogle]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-grid bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-8 flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="size-8 bg-primary flex items-center justify-center font-black italic text-black skew-x-[-12deg] group-hover:scale-110 transition-transform">
              W
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">WikiGacha</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center space-x-8 text-[11px] font-mono font-black uppercase tracking-widest">
          {navItems.map((item) => {
            const isLocked = item.requiresAuth && !player;

            if (isLocked) {
              return (
                <div
                  key={item.path}
                  className="text-muted-foreground/20 cursor-not-allowed relative py-1 flex items-center gap-1.5"
                  title="AUTHENTICATION_REQUIRED"
                >
                  <span className="size-1 bg-muted-foreground/20 rounded-full" />
                  {item.label}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'transition-all hover:text-primary relative py-1',
                  location.pathname === item.path ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label}
                {location.pathname === item.path && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center space-x-6 font-mono">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/20 rounded-sm">
            <Database className="size-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary">{credits}_CR</span>
          </div>

          {player ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    className="size-5 rounded-full border border-primary/20"
                    alt=""
                  />
                ) : (
                  <User className="size-4" />
                )}
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {player.username}
                  {!player.googleId && (
                    <span className="ml-1 text-[8px] text-primary/40 font-mono">[GUEST]</span>
                  )}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-[10px] font-black text-red-500/60 hover:text-red-500 uppercase flex items-center gap-1 transition-colors"
              >
                <LogOut className="size-3" /> [ DISCONNECT ]
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => guestLogin(persistedGuestUsername || undefined)}
                disabled={isGuestLoggingIn}
                className="h-8 px-3 text-[10px] font-black rounded-none border border-border-grid text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2 uppercase italic"
              >
                <UserPlus className="size-3" />{' '}
                {isGuestLoggingIn ? 'CONNECTING...' : 'GUEST_BREACH'}
              </Button>
              {/* Google Button Container */}
              <div id="google-login-btn" className="h-8 overflow-hidden border border-primary/40" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
