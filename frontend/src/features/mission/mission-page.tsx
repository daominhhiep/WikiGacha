import React from 'react';
import { MissionList } from './components/mission-list';
import { Trophy } from 'lucide-react';

const MissionPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10 max-w-4xl animate-in fade-in duration-700">
      <div className="mb-8 border-b border-border-grid pb-6">
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-primary/40 uppercase mb-2">
            [ MISSION_CONTROL_TERMINAL_v2.1 ]
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic flex items-center gap-3">
            <Trophy className="text-primary size-10" />
            Missions
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Complete objectives to earn <span className="text-primary font-bold">Credits</span> and
            breach deeper into the multiverse.
          </p>
        </div>
      </div>

      <div className="bg-bg-surface/20 border border-border-grid p-6 backdrop-blur-sm">
        <MissionList />
      </div>
    </div>
  );
};

export default MissionPage;
