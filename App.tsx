import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InfoCollection } from './components/InfoCollection';
import { InspirationCapsule } from './components/InspirationCapsule';
import { CreativeWorkshop } from './components/CreativeWorkshop';
import { Published } from './components/Published';
import { Archived } from './components/Archived';
import { SettingsModal } from './components/SettingsModal';
import { ViewType, DraftItem } from './types';
import { Bell, Search, Menu, X, FilePlus, Check } from 'lucide-react';

const MOCK_ITEMS: DraftItem[] = [
    {
        id: 2,
        title: "Open Source Screen Recorder",
        content: "https://openscreen.vercel.app/",
        image: "https://picsum.photos/seed/recorder/200/200", 
        tags: ['Software', 'Open Source'],
        date: '2023-12-15',
        status: 'pending',
        read: false
    }
];

const INITIAL_NOTIFICATIONS = [
    { id: 1, title: "Welcome to FlowSpace", msg: "Start collecting your inspiration today.", time: "Now", read: false },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Data State - Initialize from localStorage if available
  const [draftItems, setDraftItems] = useState<DraftItem[]>(() => {
      try {
          const saved = localStorage.getItem('flowspace_drafts');
          return saved ? JSON.parse(saved) : MOCK_ITEMS;
      } catch (e) {
          console.error("Failed to load drafts", e);
          return MOCK_ITEMS;
      }
  });
  
  const [activeDraft, setActiveDraft] = useState<DraftItem | null>(null);
  const [username, setUsername] = useState('Flow Creator');

  // UI State for Header
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Persistence Effect
  useEffect(() => {
      localStorage.setItem('flowspace_drafts', JSON.stringify(draftItems));
  }, [draftItems]);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleUpdateDraft = (updatedItem: DraftItem) => {
      setDraftItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      // Also update the active draft reference so the workshop doesn't see stale data
      if (activeDraft && activeDraft.id === updatedItem.id) {
          setActiveDraft(updatedItem);
      }
  };

  const handleDeleteDraft = (id: number) => {
      setDraftItems(prev => prev.filter(item => item.id !== id));
      if (activeDraft && activeDraft.id === id) {
          setActiveDraft(null);
      }
  };

  const handlePublishDraft = (item: DraftItem) => {
      const publishedItem: DraftItem = { ...item, status: 'published' };
      handleUpdateDraft(publishedItem);
      // Optional: Navigate to published view or stay in workshop with 'published' status
      // setCurrentView(ViewType.PUBLISHED); 
  };

  const handleCreateFromConsultation = (draft: DraftItem) => {
      // Mark as read when entering workshop
      const readDraft = { ...draft, read: true };
      handleUpdateDraft(readDraft);
      
      setActiveDraft(readDraft);
      setCurrentView(ViewType.WORKSHOP);
  };

  const handleCreateNewProject = () => {
      if (!newProjectName.trim()) return;
      
      const newDraft: DraftItem = {
          id: Date.now(),
          title: newProjectName,
          content: '',
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
          tags: ['New Project'],
          canvasData: [], // Initialize empty
          read: true // Created by user, so read
      };

      // Add to dashboard items
      setDraftItems(prev => [newDraft, ...prev]);
      
      // Navigate to workshop with this item
      setActiveDraft(newDraft);
      setCurrentView(ViewType.WORKSHOP);
      
      // Reset UI
      setNewProjectName('');
      setShowNewProjectModal(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewType.DASHBOARD:
        return (
            <Dashboard 
                draftItems={draftItems} 
                onNavigateToDraft={(draft) => {
                    setActiveDraft(draft);
                    setCurrentView(ViewType.WORKSHOP);
                }}
                username={username}
                onCreateNew={() => setShowNewProjectModal(true)}
                onViewReport={() => setCurrentView(ViewType.ARCHIVED)}
            />
        );
      case ViewType.CONSULTATION:
        return (
            <InfoCollection 
                items={draftItems} 
                setItems={setDraftItems} 
                onCreate={handleCreateFromConsultation} 
            />
        );
      case ViewType.INSPIRATION:
        return <InspirationCapsule />;
      case ViewType.WORKSHOP:
        return (
            <CreativeWorkshop 
                initialData={activeDraft} 
                onSave={handleUpdateDraft}
                onPublish={handlePublishDraft}
            />
        );
      case ViewType.PUBLISHED:
        return (
            <Published 
                items={draftItems.filter(i => i.status === 'published')}
                onView={(item) => {
                    setActiveDraft(item);
                    setCurrentView(ViewType.WORKSHOP);
                }}
                onDelete={handleDeleteDraft}
                onUpdate={handleUpdateDraft}
            />
        );
      case ViewType.ARCHIVED:
        return (
            <Archived 
                items={draftItems} // Pass all items to show global tag view
                onView={(item) => {
                    setActiveDraft(item);
                    setCurrentView(ViewType.WORKSHOP);
                }}
            />
        );
      default:
        return <Dashboard username={username} />;
    }
  };

  const isWorkshop = currentView === ViewType.WORKSHOP;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-primary-500/30">
      
      {/* Settings Modal - High Z-Index */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* New Project Modal - High Z-Index */}
      {showNewProjectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                  <button 
                      onClick={() => setShowNewProjectModal(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                  >
                      <X size={20} />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-primary-500">
                          <FilePlus size={20} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white">Create New Project</h2>
                          <p className="text-sm text-slate-400">Start a new creative session.</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Name</label>
                          <input 
                              type="text"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="e.g., Q3 Marketing Page"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewProject()}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                          />
                      </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end gap-3">
                      <button 
                          onClick={() => setShowNewProjectModal(false)}
                          className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleCreateNewProject}
                          className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-primary-900/20"
                      >
                          Create
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden border-r border-slate-800 bg-slate-950 z-20`}>
        <Sidebar 
            currentView={currentView} 
            onNavigate={setCurrentView} 
            username={username}
            onUpdateUsername={setUsername}
            onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
        
        {!isWorkshop && (
            <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search projects, logs..." 
                        className="bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all w-64"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Dropdown */}
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in origin-top-right">
                            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="font-semibold text-white text-sm">Notifications</h3>
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                                >
                                    <Check size={12} /> Mark all read
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-xs">No notifications</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors flex gap-3 ${!notif.read ? 'bg-slate-800/20' : ''}`}>
                                            <div className="mt-1">
                                                <div className={`w-2 h-2 rounded-full ${notif.read ? 'bg-slate-600' : 'bg-primary-500'}`}></div>
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-medium ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>{notif.title}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">{notif.msg}</p>
                                                <span className="text-[10px] text-slate-600 mt-1 block">{notif.time}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setShowNewProjectModal(true)}
                    className="px-4 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors shadow-lg shadow-primary-900/20 active:translate-y-0.5"
                >
                    + New Project
                </button>
            </div>
            </header>
        )}

        {/* Scrollable View Area */}
        <main className={`flex-1 overflow-y-auto scroll-smooth ${isWorkshop ? 'p-0 overflow-hidden' : 'p-6'}`}>
           <div className={`h-full ${isWorkshop ? '' : 'max-w-7xl mx-auto w-full'}`}>
              {renderContent()}
           </div>
        </main>

      </div>
    </div>
  );
};

export default App;