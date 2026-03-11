import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Gacha', path: '/gacha' },
  { label: 'Collection', path: '/collection' },
  { label: 'Battle', path: '/battle' },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-8 flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">WikiGacha</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'transition-colors hover:text-foreground/80',
                location.pathname === item.path ? 'text-foreground' : 'text-foreground/60',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          {/* We'll add user status/credits here later */}
          <div className="text-sm text-muted-foreground">Credits: 0</div>
        </div>
      </div>
    </nav>
  );
}
