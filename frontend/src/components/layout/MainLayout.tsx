import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function MainLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t py-6 md:px-8 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with Wikipedia articles.
          </p>
        </div>
      </footer>
    </div>
  );
}
