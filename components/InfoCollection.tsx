import React, { useState } from 'react';
import { 
  Link as LinkIcon, 
  PenLine, 
  Trash2, 
  Rocket,
  Sparkles,
  Globe,
  Loader2
} from 'lucide-react';
import { DraftItem } from '../types';
import { generateDraftOutline, analyzeUrlContent } from '../services/geminiService';

const TAGS = ['OpenAI', 'Gemini', 'Claude', 'AI Tools', 'Efficiency', 'RedBook', 'Creation', 'Life'];

interface InfoCollectionProps {
    items: DraftItem[];
    setItems: React.Dispatch<React.SetStateAction<DraftItem[]>>;
    onCreate?: (item: DraftItem) => void;
}

export const InfoCollection: React.FC<InfoCollectionProps> = ({ items, setItems, onCreate }) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Filter State
    const [filter, setFilter] = useState<'all' | 'unread' | 'drafts'>('all');
    
    // Track which item is being analyzed specifically
    const [analyzingItemId, setAnalyzingItemId] = useState<number | null>(null);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const isValidUrl = (string: string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleAdd = async () => {
        if (!inputValue.trim()) return;
        
        const tempId = Date.now();
        const isLink = isValidUrl(inputValue);

        // If it's a normal text input (not a link), we still generate an outline automatically
        if (!isLink) {
            setIsGenerating(true);
            try {
                const analysis = await generateDraftOutline(inputValue);
                const newItem: DraftItem = {
                    id: tempId,
                    title: analysis.title || inputValue.substring(0, 20),
                    content: inputValue,
                    outline: analysis.outline,
                    tags: [...selectedTags, ...(analysis.tags || [])],
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    read: false // New items are unread
                };
                setItems(prev => [newItem, ...prev]);
            } catch (e) {
                // Fallback
                const newItem: DraftItem = {
                    id: tempId,
                    title: inputValue.length > 20 ? inputValue.substring(0, 20) + '...' : inputValue,
                    content: inputValue,
                    tags: selectedTags,
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    read: false
                };
                setItems(prev => [newItem, ...prev]);
            } finally {
                setIsGenerating(false);
                setInputValue('');
                setSelectedTags([]);
            }
        } else {
            // If it IS a link, we add it immediately WITHOUT analysis (user requests manual trigger)
            const newItem: DraftItem = {
                id: tempId,
                title: "New Link Resource", // Placeholder until analyzed
                content: inputValue,
                outline: '', // Empty indicates no analysis yet
                tags: [...selectedTags, "Link"],
                date: new Date().toISOString().split('T')[0],
                status: 'pending',
                image: `https://picsum.photos/seed/${tempId}/200/200`,
                read: false
            };
            setItems(prev => [newItem, ...prev]);
            setInputValue('');
            setSelectedTags([]);
        }
    };

    const handleAnalyzeUrl = async (item: DraftItem) => {
        if (!item.content) return;
        setAnalyzingItemId(item.id);

        try {
            const analysis = await analyzeUrlContent(item.content);
            setItems(prev => prev.map(i => i.id === item.id ? {
                ...i,
                title: analysis.title,
                outline: `**AI Summary:**\n${analysis.summary}`,
                tags: [...new Set([...(i.tags || []), ...(analysis.tags || [])])]
            } : i));
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Could not analyze URL. Please check API settings.");
        } finally {
            setAnalyzingItemId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
        }
    };

    // Filter Logic
    const filteredItems = items.filter(item => {
        if (filter === 'unread') return item.read === false;
        if (filter === 'drafts') return item.status === 'pending'; // 'pending' items are drafts
        return true;
    });

    const getFilterButtonClass = (f: 'all' | 'unread' | 'drafts') => {
        const baseClass = "px-3 py-1 text-xs font-medium rounded-md transition-all border ";
        if (filter === f) {
            return baseClass + "bg-slate-800 text-white border-slate-600 shadow-sm";
        }
        return baseClass + "text-slate-400 hover:text-white hover:bg-slate-900 border-transparent";
    };

    const unreadCount = items.filter(i => i.read === false).length;

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">咨询收集 Consultation</h2>
                    <p className="text-slate-400 text-sm mt-1">Capture good content when browsing information.</p>
                </div>
                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setFilter('all')} 
                        className={getFilterButtonClass('all')}
                    >
                        All <span className="text-[10px] opacity-50 ml-1">{items.length}</span>
                    </button>
                    <button 
                        onClick={() => setFilter('unread')} 
                        className={getFilterButtonClass('unread')}
                    >
                        Unread <span className="text-[10px] opacity-50 ml-1">{unreadCount}</span>
                    </button>
                    <button 
                        onClick={() => setFilter('drafts')} 
                        className={getFilterButtonClass('drafts')}
                    >
                        Drafts
                    </button>
                </div>
            </div>

            {/* Input Area */}
            <div className={`border-2 border-dashed rounded-2xl p-4 bg-slate-900/50 transition-all group focus-within:bg-slate-900 relative ${isGenerating ? 'border-primary-500/50' : 'border-slate-700 hover:border-slate-600 focus-within:border-primary-500/50'}`}>
                {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                        <div className="flex items-center gap-2 text-primary-400 text-sm font-medium animate-pulse">
                            <Sparkles size={16} />
                            Generating Structure...
                        </div>
                    </div>
                )}
                <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Input text idea or paste a URL (e.g., https://github.com...). Press Enter to add."
                    className="w-full bg-transparent outline-none text-slate-200 resize-none h-24 placeholder:text-slate-500 text-sm leading-relaxed"
                />
                
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-wrap gap-2">
                        {TAGS.map(tag => (
                            <button 
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                                    selectedTags.includes(tag) 
                                    ? 'bg-primary-500/20 border-primary-500/30 text-primary-300' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t border-slate-800/50">
                         <button 
                            onClick={handleAdd}
                            disabled={isGenerating}
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
                        >
                            {isGenerating ? 'Processing...' : 'Add Note'}
                         </button>
                    </div>
                </div>
            </div>

            {/* List Area */}
            <div className="space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                        No items found in {filter} view.
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className={`bg-slate-900 border ${item.read === false ? 'border-primary-500/30' : 'border-slate-800'} rounded-xl p-4 hover:border-slate-700 transition-all group relative`}>
                            {item.read === false && (
                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" title="Unread"></div>
                            )}
                            
                             <div className="flex justify-between items-start mb-3 pr-4">
                                 <h3 className="font-semibold text-slate-200 text-lg">{item.title}</h3>
                                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-slate-900/90 pl-2">
                                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"><PenLine size={16}/></button>
                                    <button 
                                        onClick={() => onCreate && onCreate(item)}
                                        className="flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-primary-600 hover:text-white text-slate-300 text-xs rounded-md transition-colors border border-slate-700 hover:border-primary-500"
                                    >
                                        <Rocket size={14} /> Create
                                    </button>
                                    <button 
                                        onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                 </div>
                             </div>

                             {item.content && item.content.startsWith('http') ? (
                                 <div className="flex flex-col gap-3">
                                    {/* Link Card Container */}
                                    <div className="flex gap-4 bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 relative group/link">
                                         {item.image && (
                                             <img src={item.image} alt={item.title} className="w-16 h-16 rounded-md object-cover" />
                                         )}
                                         <div className="flex flex-col justify-center overflow-hidden flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Globe size={10}/> Web Resource</span>
                                                 <h4 className="text-sm font-medium text-slate-300 truncate w-full">{item.title}</h4>
                                             </div>
                                             <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-400 hover:text-primary-300 truncate max-w-md flex items-center gap-1">
                                                 <LinkIcon size={12} /> {item.content}
                                             </a>
                                         </div>

                                         {/* AI Analysis Trigger */}
                                         {(!item.outline || item.outline.trim() === '') && (
                                             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover/link:opacity-100 transition-all flex items-center justify-center rounded-lg z-10">
                                                 {analyzingItemId === item.id ? (
                                                      <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
                                                          <Loader2 size={16} className="animate-spin" /> Analyzing...
                                                      </div>
                                                 ) : (
                                                      <button 
                                                        onClick={() => handleAnalyzeUrl(item)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-full shadow-lg transform scale-90 hover:scale-100 transition-all"
                                                      >
                                                          <Sparkles size={14} /> Analyze Content with AI?
                                                      </button>
                                                 )}
                                             </div>
                                         )}
                                    </div>
                                    
                                    {/* Show AI Summary for Links */}
                                    {item.outline && (
                                        <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-800/50 animate-fade-in">
                                            <div className="flex items-center gap-2 mb-1 text-xs text-primary-400 font-medium">
                                                <Sparkles size={12} /> Web Analysis
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{item.outline}</p>
                                        </div>
                                    )}
                                 </div>
                             ) : (
                                 <div className="text-sm text-slate-400 leading-relaxed mb-3">
                                     {item.content}
                                     {item.outline && (
                                         <div className="mt-3 p-3 bg-slate-950/30 rounded-lg border border-slate-800/50">
                                             <div className="flex items-center gap-2 mb-2 text-xs text-primary-400 font-medium">
                                                 <Sparkles size={12} /> AI Outline
                                             </div>
                                             <pre className="text-xs text-slate-500 font-sans whitespace-pre-wrap">{item.outline}</pre>
                                         </div>
                                     )}
                                 </div>
                             )}

                             <div className="flex items-center gap-3 mt-4">
                                {item.tags?.map(t => (
                                    <span key={t} className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-800">#{t}</span>
                                ))}
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};