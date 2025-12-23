import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  Lightbulb, 
  Wrench, 
  Send, 
  Archive,
  Layers,
  Settings
} from 'lucide-react';
import { NavItem, ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  username: string;
  onUpdateUsername: (name: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, username, onUpdateUsername, onOpenSettings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(username);

  const navItems: NavItem[] = [
    { id: ViewType.DASHBOARD, label: '仪表盘 (Dashboard)', icon: LayoutDashboard, category: 'Workspace' },
    { id: ViewType.CONSULTATION, label: '咨询收集 (Consultation)', icon: MessageSquareText, category: 'Workspace' },
    { id: ViewType.INSPIRATION, label: '灵感胶囊 (Inspiration)', icon: Lightbulb, category: 'Workspace' },
    { id: ViewType.WORKSHOP, label: '创作工坊 (Workshop)', icon: Wrench, category: 'Creation' },
    { id: ViewType.PUBLISHED, label: '已发布 (Published)', icon: Send, category: 'Creation' },
    { id: ViewType.ARCHIVED, label: '归档复盘 (Archived)', icon: Archive, category: 'Creation' },
  ];

  const workspaceItems = navItems.filter(item => item.category === 'Workspace');
  const creationItems = navItems.filter(item => item.category === 'Creation');

  const handleNameSave = () => {
    if (tempName.trim()) {
        onUpdateUsername(tempName);
    } else {
        setTempName(username);
    }
    setIsEditing(false);
  };

  const NavGroup = ({ title, items }: { title: string, items: NavItem[] }) => (
    <div className="mb-8">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-4">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-r-full transition-all duration-200 border-l-4 ${
                isActive 
                  ? 'bg-slate-800 text-white border-primary-500' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border-transparent'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-primary-500' : 'text-slate-500'} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-64 h-screen bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
          <Layers size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">FlowSpace</h1>
      </div>

      <nav className="flex-1 py-4 pr-4">
        <NavGroup title="Workspace" items={workspaceItems} />
        <NavGroup title="Creation" items={creationItems} />
      </nav>

      <div className="p-4 border-t border-slate-900">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors mb-4"
        >
            <Settings size={18} />
            Settings
        </button>

        <div className="flex items-center gap-3 px-2">
          <img src="https://picsum.photos/100/100" alt="User" className="w-8 h-8 rounded-full border border-slate-700" />
          <div className="flex flex-col">
            {isEditing ? (
                <input 
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="bg-slate-900 text-sm text-white border border-primary-500 rounded px-1 py-0.5 outline-none w-28"
                    autoFocus
                />
            ) : (
                <span 
                    onClick={() => { setTempName(username); setIsEditing(true); }}
                    className="text-sm font-medium text-slate-200 hover:text-primary-400 cursor-pointer transition-colors"
                    title="Click to edit username"
                >
                    {username}
                </span>
            )}
            {/* Pro Plan line removed */}
          </div>
        </div>
      </div>
    </div>
  );
};