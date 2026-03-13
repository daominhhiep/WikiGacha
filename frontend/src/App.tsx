import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import GachaPage from '@/features/gacha/gacha-page';
import CollectionPage from '@/features/collection/collection-page';
import BattlePage from '@/features/battle/battle-page';
import MissionPage from '@/features/mission/mission-page';
import TrophyPage from '@/features/trophy/trophy-page';
import { AuthCallback } from './features/auth/auth-callback';
import { useMissions } from './features/mission/use-missions';
import { useTrophies } from './features/trophy/use-trophies';
import { useAuthStore } from './features/auth/auth-store';
import { Trophy, CheckCircle2, Award } from 'lucide-react';

const HomePage = () => {
  const { player } = useAuthStore();
  const { data: missions } = useMissions();
  const { data: trophies } = useTrophies(player?.id || '');

  const completedMissions = missions?.filter((m) => m.isCompleted).length || 0;
  const totalMissions = missions?.length || 0;
  const trophyCount = trophies?.length || 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-12 text-center py-12 animate-in fade-in duration-1000">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter uppercase italic lg:text-7xl bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
            WikiGacha
          </h1>
          <div className="h-1 w-32 bg-primary mx-auto" />
        </div>
        <p className="max-w-[600px] text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground mx-auto leading-relaxed">
          [ Accessing_Multiverse_Data_Pool... ]
          <br />
          Collect articles, extract stats, breach the consensus.
        </p>
      </div>

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

      {player && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
          <Link
            to="/missions"
            className="group p-6 border border-border-grid bg-bg-surface/20 backdrop-blur-sm hover:border-primary/50 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 border border-primary/20">
                <CheckCircle2 className="size-5 text-primary" />
              </div>
              <h3 className="font-black uppercase tracking-widest text-sm text-primary">
                Mission_Status
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end font-mono text-xs">
                <span className="opacity-60">COMPLETED_OBJECTIVES</span>
                <span className="font-bold text-white">
                  {completedMissions} / {totalMissions}
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000"
                  style={{
                    width: `${totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </Link>

          <Link
            to="/trophies"
            className="group p-6 border border-border-grid bg-bg-surface/20 backdrop-blur-sm hover:border-primary/50 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20">
                <Award className="size-5 text-amber-500" />
              </div>
              <h3 className="font-black uppercase tracking-widest text-sm text-amber-500">
                Trophy_Room
              </h3>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black italic tracking-tighter text-white">
                {trophyCount.toString().padStart(2, '0')}
              </div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.2em]">
                UNLOCKED_ACHIEVEMENTS
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="gacha" element={<GachaPage />} />
          <Route path="collection" element={<CollectionPage />} />
          <Route path="battle" element={<BattlePage />} />
          <Route path="missions" element={<MissionPage />} />
          <Route path="trophies" element={<TrophyPage />} />
          <Route path="auth-callback" element={<AuthCallback />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
