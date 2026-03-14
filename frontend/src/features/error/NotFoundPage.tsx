import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse" />
        <AlertTriangle size={120} className="text-primary relative z-10" />
      </div>

      <div className="space-y-4 relative z-10">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
          404_ERROR
        </h1>
        <div className="h-1 w-32 bg-primary mx-auto" />
        <p className="max-w-[500px] text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground leading-relaxed">
          [ DATA_NODE_NOT_FOUND ]
          <br />
          The sector you are trying to reach has been purged or never existed in this timeline.
        </p>
      </div>

      <Link to="/" className="relative z-10 pt-4">
        <Button
          size="lg"
          className="h-12 px-10 text-lg font-black rounded-none border-2 border-primary bg-primary text-black hover:bg-black hover:text-primary transition-all duration-300 group"
        >
          <span className="group-hover:animate-pulse">RETURN_TO_BASE</span>
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
