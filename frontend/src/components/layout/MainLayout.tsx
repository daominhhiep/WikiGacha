import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { usePlayerProfile } from '@/features/auth/use-auth';

export function MainLayout() {
  usePlayerProfile();

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-black">
      {/* HUD Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <Navbar />
      <main className="flex-1 relative">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border-grid py-6 md:px-8 md:py-0 bg-bg-surface/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 md:text-left">
            [ SYSTEM_STATUS: OPERATIONAL ] | [ ENCRYPTED_CONNECTION: YES ] | [ DATA_SOURCE:
            WIKIPEDIA ]
          </p>
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/40 uppercase">
            <span>Build_v0.1.0</span>
            <span>© 2026 wikigacha_consortium</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
