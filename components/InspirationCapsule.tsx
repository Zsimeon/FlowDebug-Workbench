import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Flame, 
    Music, 
    Film, 
    MonitorPlay, 
    Smartphone, 
    Hash, 
    Globe, 
    ArrowRight,
    Loader2,
    RefreshCw,
    Search as SearchIcon,
    Plus,
    X,
    Settings2,
    AlertTriangle,
    Zap,
    GripVertical,
    Github, 
    Sparkles,
    CheckSquare,
    Square
} from 'lucide-react';
import { getTrendingInspiration, fetchGithubTrendingDirectly } from '../services/geminiService';

// Map of default IDs to specific styling/icons
const PRESET_CONFIG: Record<string, { icon: any, color: string, bg: string }> = {
    'tech': { icon: MonitorPlay, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    'github': { icon: Github, color: 'text-slate-200', bg: 'bg-slate-700/50' }, 
    'design': { icon: Hash, color: 'text-purple-400', bg: 'bg-purple-900/20' },
    'music': { icon: Music, color: 'text-green-400', bg: 'bg-green-900/20' },
    'film': { icon: Film, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    'douyin': { icon: Smartphone, color: 'text-pink-400', bg: 'bg-pink-900/20' },
    'weibo': { icon: Flame, color: 'text-red-400', bg: 'bg-red-900/20' },
    'redbook': { icon: Hash, color: 'text-rose-400', bg: 'bg-rose-900/20' },
};

// Fallback/Preset keywords for categories when AI is OFF (Simulating trends)
const CATEGORY_PRESETS: Record<string, string[]> = {
    'tech': ['Artificial Intelligence', 'Web3 & Blockchain', 'SpaceX Launch', 'New Apple Event', 'Quantum Computing', 'EV Cars'],
    'design': ['Minimalist UI', 'Brutalism Trend', 'Figma Plugins', '3D Web Design', 'Typography 2024', 'Glassmorphism'],
    'music': ['Billboard Top 100', 'New Album Releases', 'Viral TikTok Songs', 'LoFi Hip Hop', 'Music Festivals', 'Indie Rock'],
    'film': ['Box Office Top 10', 'Netflix New Series', 'Oscar Winners', 'Sci-Fi Movies', 'Anime Season', 'Documentaries'],
    'douyin': ['抖音热搜榜', '热门挑战', '搞笑段子', '美食探店', '直播带货', '萌宠日常'],
    'weibo': ['微博热搜', '社会新闻', '娱乐八卦', '科技数码', '体育赛事', '时尚美妆'],
    'redbook': ['小红书热点', 'OOTD', '护肤心得', '旅行攻略', '家居装修', '职场干货'],
};

const DEFAULT_CHANNELS = [
    { id: 'tech', label: '科技前沿' },
    { id: 'github', label: 'GitHub 热榜' },
    { id: 'design', label: '设计美学' },
    { id: 'douyin', label: '抖音热榜' },
    { id: 'weibo', label: '微博热搜' },
    { id: 'redbook', label: '小红书热点' },
];

interface Channel {
    id: string;
    label: string;
}

type SearchEngine = 'baidu' | 'bing' | 'google';

export const InspirationCapsule: React.FC = () => {
    // --- State: Channels ---
    const [channels, setChannels] = useState<Channel[]>(() => {
        const saved = localStorage.getItem('flowspace_channels');
        if (saved) {
            const parsed = JSON.parse(saved);
            const hasGithub = parsed.some((c: Channel) => c.id === 'github');
            if (!hasGithub && parsed.length < 8) {
                 return [...parsed.slice(0, 1), { id: 'github', label: 'GitHub 热榜' }, ...parsed.slice(1)];
            }
            return parsed;
        }
        return DEFAULT_CHANNELS;
    });
    const [isEditingChannels, setIsEditingChannels] = useState(false);
    const [showAddInput, setShowAddInput] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    // --- State: Main Logic ---
    const [activeCategory, setActiveCategory] = useState<string>('tech');
    const [searchQuery, setSearchQuery] = useState('');
    const [engine, setEngine] = useState<SearchEngine>('baidu');
    const [useAiAnalysis, setUseAiAnalysis] = useState(false); // Default OFF
    
    // --- State: Notifications/Data ---
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Save channels when they change
    useEffect(() => {
        localStorage.setItem('flowspace_channels', JSON.stringify(channels));
    }, [channels]);

    // Initial load & Effect when category/AI toggle changes
    useEffect(() => {
        // If there is a search query, we handle it separately (don't auto-refresh category)
        if (!searchQuery) {
            const currentLabel = channels.find(c => c.id === activeCategory)?.label || activeCategory;
            fetchTrends(currentLabel);
        }
    }, [activeCategory, useAiAnalysis]);

    const fetchTrends = async (categoryLabel: string, query?: string) => {
        setLoading(true);
        setError(null);
        setItems([]); // Clear previous items

        try {
            // 1. GITHUB CHANNEL (Always uses Direct API if query is empty)
            if (activeCategory === 'github' && !query) {
                const result = await fetchGithubTrendingDirectly();
                mapAndSetItems(result.items);
                setLoading(false);
                return;
            }

            // 2. AI ANALYSIS MODE (Gemini)
            if (useAiAnalysis) {
                const data = await getTrendingInspiration(categoryLabel, query);
                if (data && data.items) {
                    mapAndSetItems(data.items);
                } else {
                    setItems([]);
                    setError("No AI inspiration found. Check API Key or Network.");
                }
            } 
            // 3. DIRECT MODE (Manual / Presets)
            else {
                if (query) {
                    // Search Result Card
                    const searchItem = {
                        title: query,
                        description: `Search for "${query}" directly.`,
                        tags: ['Search', 'Direct'],
                        searchTerm: query,
                        img: `https://picsum.photos/seed/${encodeURIComponent(query)}/400/300`
                    };
                    mapAndSetItems([searchItem]);
                } else {
                    // Category Preset Cards (Mocking "Trends")
                    const presets = CATEGORY_PRESETS[activeCategory] || [`${categoryLabel} News`, `${categoryLabel} Trends`, `${categoryLabel} Ideas`];
                    const mockItems = presets.map((term, i) => ({
                        title: term,
                        description: `Explore ${term}. Click to view directly.`,
                        tags: ['Quick Access', activeCategory],
                        searchTerm: term,
                        // Fixed seeds for stability
                        img: `https://picsum.photos/seed/${activeCategory}${i}/400/300` 
                    }));
                    mapAndSetItems(mockItems);
                }
            }
        } catch (err) {
            console.error(err);
            // Fallback for UI
            if (!useAiAnalysis && !query) {
                 const fallbackItem = {
                    title: `Search ${categoryLabel}`,
                    description: "Direct search link.",
                    tags: ['Search'],
                    searchTerm: categoryLabel,
                    img: `https://picsum.photos/seed/${Date.now()}/400/300`
                 };
                 mapAndSetItems([fallbackItem]);
            } else {
                setError("Failed to fetch data.");
            }
        } finally {
            setLoading(false);
        }
    };

    const mapAndSetItems = (rawItems: any[]) => {
        const mapped = rawItems.map((item: any, index: number) => ({
            id: Date.now() + index,
            title: item.title,
            description: item.description,
            tags: item.tags,
            searchTerm: item.searchTerm,
            // Use provided img or random fallback
            img: item.img || `https://picsum.photos/seed/${encodeURIComponent(item.title)}${Date.now()}/400/300`
        }));
        setItems(mapped);
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        
        // Trigger fetch (which will handle "Search Card" generation based on AI flag)
        fetchTrends('Custom', searchQuery);
        // We keep activeCategory so we know where to search (Douyin vs Google etc)
    };

    // --- Drag & Drop Logic (Unchanged) ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedItemIndex === null || draggedItemIndex === index) return;
        const newChannels = [...channels];
        const draggedItem = newChannels[draggedItemIndex];
        newChannels.splice(draggedItemIndex, 1);
        newChannels.splice(index, 0, draggedItem);
        setChannels(newChannels);
        setDraggedItemIndex(index);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggedItemIndex(null);
    };

    // --- Channel Management ---
    const handleAddChannel = () => {
        if (!newChannelName.trim()) return;
        const newId = `custom-${Date.now()}`;
        const newChannel = { id: newId, label: newChannelName.trim() };
        setChannels([...channels, newChannel]);
        setNewChannelName('');
        setShowAddInput(false);
        setActiveCategory(newId);
    };

    const handleDeleteChannel = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = channels.filter(c => c.id !== id);
        setChannels(updated);
        if (activeCategory === id && updated.length > 0) setActiveCategory(updated[0].id);
    };

    const handleSetEngine = (eng: SearchEngine) => {
        setEngine(eng);
        if (eng === 'google') {
            setToastMsg("提示：请确保您的网络环境支持科学上网 (VPN)");
            setTimeout(() => setToastMsg(null), 4000);
        }
    };

    // Helper to open links in system browser (Electron) or new tab (Web)
    const openExternalUrl = (url: string) => {
        // Type assertion for window to access Electron APIs if available
        const w = window as any;
        if (w.require) {
            try {
                // If running in Electron with nodeIntegration, use shell.openExternal
                const { shell } = w.require('electron');
                shell.openExternal(url);
                return;
            } catch (e) {
                console.warn("Electron shell open failed, falling back to window.open", e);
            }
        }
        // Fallback for standard web environment
        window.open(url, '_blank');
    };

    const openSearch = (term: string) => {
        let targetUrl = '';
        
        // 1. Check for specific platform categories first
        if (activeCategory === 'github') {
            if (term.includes('/') || !term.includes(' ')) {
                 targetUrl = `https://github.com/${term}`;
            } else {
                 targetUrl = `https://github.com/search?q=${encodeURIComponent(term)}&type=repositories`;
            }
        } 
        else if (activeCategory === 'douyin') {
            if (term.includes('热搜') || term.includes('榜')) {
                 targetUrl = `https://www.douyin.com/hot`;
            } else {
                 targetUrl = `https://www.douyin.com/search/${encodeURIComponent(term)}`;
            }
        }
        else if (activeCategory === 'weibo') {
            if (term.includes('热搜') || term.includes('榜')) {
                 targetUrl = `https://s.weibo.com/top/summary`;
            } else {
                 targetUrl = `https://s.weibo.com/weibo?q=${encodeURIComponent(term)}`;
            }
        }
        else if (activeCategory === 'redbook') {
            targetUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(term)}`;
        }
        // 2. Default to general search engine
        else {
            if (engine === 'baidu') {
                targetUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(term)}`;
            } else if (engine === 'bing') {
                targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(term)}`;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
            }
        }
        
        openExternalUrl(targetUrl);
    };

    // Helper for direct channel search bypass
    const getCurrentLabel = () => {
        return channels.find(c => c.id === activeCategory)?.label || searchQuery || activeCategory;
    };

    // Helper to determine display label for the search action
    const getSearchActionLabel = () => {
        if (activeCategory === 'github') return 'View on GitHub';
        if (activeCategory === 'douyin') return 'View on Douyin';
        if (activeCategory === 'weibo') return 'View on Weibo';
        if (activeCategory === 'redbook') return 'View on RedBook';
        
        // Fallback to engine
        return `Search on ${engine === 'baidu' ? 'Baidu' : engine === 'bing' ? 'Bing' : 'Google'}`;
    };

    return (
        <div className="h-full flex flex-col animate-fade-in relative">
            
            {/* Toast Notification */}
            {toastMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-yellow-500/30 animate-fade-in">
                    <AlertTriangle size={16} className="text-yellow-500" />
                    <span className="text-xs font-medium">{toastMsg}</span>
                </div>
            )}

            {/* Header: Title */}
            <div className="shrink-0 mb-4 flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Globe className="text-primary-500" /> 灵感胶囊 Inspiration
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Discover what is trending now.</p>
                </div>
                
                {/* Search Engine Toggle */}
                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => handleSetEngine('baidu')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${engine === 'baidu' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Baidu
                    </button>
                    <button 
                        onClick={() => handleSetEngine('bing')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${engine === 'bing' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Bing
                    </button>
                    <button 
                        onClick={() => handleSetEngine('google')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${engine === 'google' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Google
                    </button>
                </div>
            </div>

            {/* Central Search Bar */}
            <div className="flex flex-col items-center justify-center py-6 gap-2 shrink-0 transition-all">
                <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
                    <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    <div className="relative flex items-center">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search inside ${activeCategory ? getCurrentLabel() : 'global trends'}...`}
                            className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700 text-base text-slate-100 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-2xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                        {searchQuery && (
                            <button 
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Channels & AI Toggle */}
            <div className="shrink-0 mb-6 border-b border-slate-800 pb-4">
                 <div className="flex flex-wrap items-center justify-center gap-2">
                     <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-2">Channels:</span>
                    {channels.map((cat, index) => {
                        const isActive = activeCategory === cat.id && !searchQuery;
                        const style = PRESET_CONFIG[cat.id] || { icon: Zap, color: 'text-slate-400', bg: 'bg-slate-800' };
                        const Icon = style.icon;

                        return (
                            <div
                                key={cat.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={handleDrop}
                                onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                                className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border select-none cursor-pointer ${
                                    isActive 
                                        ? `bg-slate-800 text-white border-slate-600 shadow-md ring-1 ring-slate-700` 
                                        : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
                                } ${isEditingChannels ? 'ring-1 ring-slate-700 border-dashed cursor-move' : ''}`}
                            >
                                {isEditingChannels && <GripVertical size={10} className="text-slate-600 mr-1" />}
                                <Icon size={14} className={isActive ? style.color : ''} />
                                {cat.label}
                                
                                {isEditingChannels && (
                                    <div 
                                        onClick={(e) => handleDeleteChannel(e, cat.id)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm cursor-pointer z-10"
                                    >
                                        <X size={8} />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add/Edit Channel Tools */}
                    <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-800">
                        {showAddInput ? (
                            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 animate-fade-in">
                                <input 
                                    autoFocus
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddChannel();
                                        if (e.key === 'Escape') { setShowAddInput(false); setNewChannelName(''); }
                                    }}
                                    onBlur={() => {
                                        if (!newChannelName) setShowAddInput(false);
                                    }}
                                    placeholder="Add..."
                                    className="w-16 bg-transparent text-xs text-white outline-none"
                                />
                                <button onClick={handleAddChannel} className="text-primary-400 hover:text-white ml-1"><Plus size={14}/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowAddInput(true)}
                                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Add Channel"
                            >
                                <Plus size={14} />
                            </button>
                        )}

                        <button 
                            onClick={() => setIsEditingChannels(!isEditingChannels)}
                            className={`p-1.5 rounded-lg transition-colors ${isEditingChannels ? 'bg-primary-900/30 text-primary-400' : 'text-slate-500 hover:text-white'}`}
                            title={isEditingChannels ? "Finish Editing" : "Rearrange Channels"}
                        >
                            <Settings2 size={14} />
                        </button>
                    </div>

                    {/* AI Analysis Toggle */}
                    <div className="ml-4 flex items-center gap-2 pl-4 border-l border-slate-800">
                        <button 
                            onClick={() => setUseAiAnalysis(!useAiAnalysis)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                useAiAnalysis 
                                ? 'bg-primary-900/40 text-primary-300 border-primary-500/50 shadow-sm' 
                                : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:text-slate-300'
                            }`}
                        >
                            <Sparkles size={12} className={useAiAnalysis ? "fill-primary-400/20" : ""} />
                            {useAiAnalysis ? "AI Enabled" : "AI Disabled"}
                            {useAiAnalysis ? <CheckSquare size={12} className="ml-1" /> : <Square size={12} className="ml-1" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-primary-500" />
                        <span className="text-sm">
                            {useAiAnalysis ? `AI is analyzing ${getCurrentLabel()} trends...` : `Fetching ${getCurrentLabel()}...`}
                        </span>
                    </div>
                ) : error ? (
                     <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <RefreshCw size={32} className="text-red-400" />
                        <span className="text-sm max-w-md text-center">{error}</span>
                        <div className="flex gap-3 mt-2">
                            <button onClick={() => {
                                fetchTrends(getCurrentLabel(), searchQuery);
                            }} className="text-primary-400 text-xs hover:underline bg-slate-800 px-3 py-1.5 rounded-lg">Try Again</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 px-2">
                        {items.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => openSearch(item.searchTerm)}
                                className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-900/10 transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img 
                                        src={item.img} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />
                                    
                                    {/* HOT Badge for specific platforms (Visual only) */}
                                    {(activeCategory === 'weibo' || activeCategory === 'douyin' || activeCategory === 'redbook') && useAiAnalysis && (
                                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg">
                                            <Flame size={10} className="fill-white" /> HOT
                                        </div>
                                    )}
                                     {/* GitHub Badge */}
                                    {(activeCategory === 'github') && (
                                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-slate-800/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg border border-slate-600">
                                            <Github size={10} className="fill-white" /> Trending
                                        </div>
                                    )}

                                    {/* Direct Search Badge if AI OFF */}
                                    {!useAiAnalysis && activeCategory !== 'github' && (
                                         <div className="absolute top-3 left-3 flex items-center gap-1 bg-blue-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg">
                                            <SearchIcon size={10} className="fill-white" /> Direct Access
                                        </div>
                                    )}

                                    <div className="absolute bottom-3 left-3 right-3">
                                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary-300 transition-colors">
                                            {item.title}
                                        </h3>
                                    </div>
                                    <div className="absolute top-3 right-3 bg-slate-950/60 backdrop-blur-sm p-2 rounded-full text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <SearchIcon size={16} />
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-1 flex flex-col">
                                    <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-3">
                                        {item.description}
                                    </p>
                                    
                                    <div className="mt-auto flex flex-wrap gap-2">
                                        {item.tags?.map((tag: string, idx: number) => (
                                            <span key={idx} className="text-[10px] px-2 py-1 bg-slate-800 text-slate-500 rounded border border-slate-700/50">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                                        <span className="text-slate-600">
                                            {useAiAnalysis ? 'Source: AI Trend Analysis' : 'Source: Preset / Search'}
                                        </span>
                                        <span className={`flex items-center gap-1 font-medium transition-colors ${
                                            activeCategory === 'github' ? 'text-white' :
                                            (activeCategory === 'douyin' || activeCategory === 'weibo' || activeCategory === 'redbook') 
                                                ? 'text-slate-400 group-hover:text-white'
                                                : engine === 'baidu' ? 'text-blue-500' 
                                                : engine === 'bing' ? 'text-teal-500' 
                                                : 'text-sky-400'
                                        }`}>
                                            {getSearchActionLabel()} <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};