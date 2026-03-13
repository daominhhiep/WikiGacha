import React from 'react';
import TrophyGrid from './components/trophy-grid';
import { useTrophies } from './use-trophies';
import { useAuthStore } from '../auth/auth-store';
import { Award } from 'lucide-react';

const TrophyPage: React.FC = () => {
  const { player } = useAuthStore();
  const { data: trophies = [], isLoading } = useTrophies(player?.id || '');

  return (
    <div className="container mx-auto py-10 animate-in fade-in duration-700">
      <div className="mb-10 border-b border-border-grid pb-8 relative">
        <div className="absolute top-0 left-0 text-[10px] font-mono text-primary/40 uppercase mb-2">
          [ ARCHIVE_COLLECTION_DATA_v1.5 ]
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic flex items-center gap-3">
            <Award className="text-primary size-10" />
            Trophy Room
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Unlocked milestones: <span className="text-primary font-bold">{trophies.length}</span> /
            ??
          </p>
        </div>
      </div>

      <TrophyGrid trophies={trophies} isLoading={isLoading} />
    </div>
  );
};

export default TrophyPage;
