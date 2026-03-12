import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import GachaPage from '@/features/gacha/gacha-page';
import { AuthCallback } from './features/auth/auth-callback';

const HomePage = () => (
  <div className="flex flex-col items-center justify-center space-y-8 text-center py-12">
    <div className="space-y-2">
      <h1 className="text-6xl font-black tracking-tighter uppercase italic lg:text-7xl bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
        WikiGacha
      </h1>
      <div className="h-1 w-32 bg-primary mx-auto" />
    </div>
    <p className="max-w-[600px] text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">
      [ Accessing_Multiverse_Data_Pool... ]
      <br />
      Collect articles, extract stats, breach the consensus.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <Link to="/gacha">
        <Button
          size="lg"
          className="h-12 px-10 text-lg font-black rounded-none border-2 border-primary bg-primary text-black hover:bg-black hover:text-primary transition-all duration-300"
        >
          INITIATE_BREACH
        </Button>
      </Link>
      <Link to="/collection">
        <Button
          variant="outline"
          size="lg"
          className="h-12 px-10 text-lg font-black rounded-none border-2 border-border-grid hover:border-primary hover:bg-primary/5 transition-all duration-300"
        >
          VIEW_DATA_LOGS
        </Button>
      </Link>
    </div>
  </div>
);

const CollectionPage = () => (
  <div className="py-8">
    <h1 className="mb-4 text-3xl font-black uppercase font-mono tracking-widest border-l-4 border-primary pl-4">
      DATA_ARCHIVE
    </h1>
    <p className="text-muted-foreground font-mono text-xs uppercase">
      Decrypted Wikipedia entries will be stored here.
    </p>
  </div>
);

const BattlePage = () => (
  <div className="py-8">
    <h1 className="mb-4 text-3xl font-black uppercase font-mono tracking-widest border-l-4 border-primary pl-4">
      COMBAT_SIMULATION
    </h1>
    <p className="text-muted-foreground font-mono text-xs uppercase">
      Simulate data-clashes with other entities.
    </p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="gacha" element={<GachaPage />} />
          <Route path="collection" element={<CollectionPage />} />
          <Route path="battle" element={<BattlePage />} />
          <Route path="auth-callback" element={<AuthCallback />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
