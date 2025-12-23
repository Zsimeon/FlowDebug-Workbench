import React, { useState, useEffect } from 'react';
import { 
  PenTool,
  TrendingUp,
  Lightbulb,
  Sparkles,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';
import { DraftItem } from '../types';

interface DashboardProps {
    draftItems?: DraftItem[];
    onNavigateToDraft?: (item: DraftItem) => void;
    username?: string;
    onCreateNew?: () => void;
    onViewReport?: () => void;
}

const StatCard = ({ title, value, subtext, icon: Icon }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors group">
    <div className="flex justify-between items-start mb-2">
      <div className="flex flex-col">
          <span className="text-slate-500 text-xs font-medium mb-1">{title}</span>
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      </div>
      <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-colors">
        <Icon size={18} />
      </div>
    </div>
    <span className="text-xs text-slate-500">{subtext}</span>
  </div>
);

const Heatmap = ({ items }: { items: DraftItem[] }) => {
    // Generate real heatmap based on last 12 weeks of activity
    const weeks = 12;
    const days = 7;
    const grid: number[][] = [];
    
    // 1. Create a frequency map of dates from the items
    const activityMap: Record<string, number> = {};
    items.forEach(item => {
        if (item.date) {
            // Ensure strict YYYY-MM-DD format matching
            activityMap[item.date] = (activityMap[item.date] || 0) + 1;
        }
    });

    const today = new Date();

    // 2. Build the grid (Weeks as columns)
    for (let w = 0; w < weeks; w++) {
        const week: number[] = [];
        for (let d = 0; d < days; d++) {
            // Calculate specific date for this cell
            // Logic: grid[11][6] is Today (Last col, last row)
            // Days to subtract = (Total Weeks - 1 - Current Week) * 7 + (Total Days - 1 - Current Day)
            const daysAgo = (weeks - 1 - w) * 7 + (days - 1 - d);
            
            const cellDate = new Date(today);
            cellDate.setDate(cellDate.getDate() - daysAgo);
            const dateStr = cellDate.toISOString().split('T')[0];
            
            const count = activityMap[dateStr] || 0;
            // Normalize intensity to 0-4 range
            let intensity = 0;
            if (count > 0) intensity = 1;
            if (count > 2) intensity = 2;
            if (count > 4) intensity = 3;
            if (count > 6) intensity = 4;
            
            week.push(intensity);
        }
        grid.push(week);
    }

    const getColor = (intensity: number) => {
        switch(intensity) {
            case 1: return 'bg-primary-900/60';
            case 2: return 'bg-primary-700/80';
            case 3: return 'bg-primary-500';
            case 4: return 'bg-primary-400';
            default: return 'bg-slate-800/30'; // Slightly more transparent for empty
        }
    };

    return (
        <div className="flex gap-1.5 justify-end">
            {grid.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((val, dIdx) => (
                        <div 
                            key={`${wIdx}-${dIdx}`} 
                            className={`w-3 h-3 rounded-sm ${getColor(val)} transition-colors hover:ring-1 hover:ring-white/50`}
                            title={val > 0 ? `${val} items` : ''}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

export const Dashboard: React.FC<DashboardProps> = ({ draftItems = [], onNavigateToDraft, username, onCreateNew, onViewReport }) => {
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting('Good Morning');
      else if (hour >= 12 && hour < 18) setGreeting('Good Afternoon');
      else if (hour >= 18 && hour < 22) setGreeting('Good Evening');
      else setGreeting('Late Night');
  }, []);

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      {/* Greeting Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{greeting}, {username || 'Creator'}</h1>
          <p className="text-slate-400 text-sm mt-2">Today is another good day to collect inspiration. {draftItems.filter(i => i.status === 'published').length} posts published so far.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={onViewReport}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
            >
                View Weekly Report
            </button>
            <button 
                onClick={onCreateNew}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-primary-900/20"
            >
                + New Content
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Published" value={draftItems.filter(i => i.status === 'published').length} subtext="Total posts live" icon={PenTool} />
        <StatCard title="Total Likes" value="0" subtext="Accumulated interactions" icon={TrendingUp} />
        <StatCard title="Pending" value={draftItems.filter(i => i.status === 'pending').length} subtext="Ideas waiting" icon={Lightbulb} />
        <StatCard title="Inspiration Lib" value={draftItems.length} subtext="Total collected" icon={Sparkles} />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pending Information List (Left 2/3) */}
          <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-300">Pending Information</span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{draftItems.filter(i => i.status === 'pending').length}</span>
                  </div>
                  <button className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                      View All <ArrowRight size={12}/>
                  </button>
              </div>

              {draftItems.filter(i => i.status === 'pending').length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 border-dashed">
                      <Lightbulb size={32} className="mb-2 opacity-50" />
                      <p>No pending drafts. Go collect some ideas!</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {draftItems.filter(i => i.status === 'pending').slice(0, 5).map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => onNavigateToDraft && onNavigateToDraft(item)}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-600 transition-all cursor-pointer group"
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`w-2 h-2 rounded-full ${item.status === 'pending' ? 'bg-primary-500' : 'bg-green-500'}`}></div>
                                  <div>
                                      <h3 className="text-slate-200 font-medium text-sm group-hover:text-primary-400 transition-colors">{item.title}</h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        {item.tags?.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">#{tag}</span>
                                        ))}
                                        <span className="text-xs text-slate-600">{item.date}</span>
                                      </div>
                                  </div>
                              </div>
                              <button className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* Creation Heatmap (Right 1/3) */}
          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-slate-300">Creation Heatmap</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                  </div>
                  {/* Pass actual items to Heatmap */}
                  <Heatmap items={draftItems} />
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
                      <span className="text-xs text-slate-500">Last 12 weeks</span>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                          <span>Less</span>
                          <div className="flex gap-0.5">
                              <div className="w-2 h-2 bg-slate-800/50 rounded-sm"></div>
                              <div className="w-2 h-2 bg-primary-900/60 rounded-sm"></div>
                              <div className="w-2 h-2 bg-primary-500 rounded-sm"></div>
                          </div>
                          <span>More</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};