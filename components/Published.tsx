import React, { useState } from 'react';
import { Globe, PenTool, ExternalLink, Trash2, Tag, X, Check } from 'lucide-react';
import { DraftItem } from '../types';

interface PublishedProps {
    items?: DraftItem[];
    onView?: (item: DraftItem) => void;
    onDelete?: (id: number) => void;
    onUpdate?: (item: DraftItem) => void;
}

const TagEditor = ({ item, onSave, onClose }: { item: DraftItem, onSave: (tags: string[]) => void, onClose: () => void }) => {
    const [tags, setTags] = useState<string[]>(item.tags || []);
    const [input, setInput] = useState('');

    const addTag = () => {
        if (input.trim() && !tags.includes(input.trim())) {
            setTags([...tags, input.trim()]);
            setInput('');
        }
    };

    const removeTag = (t: string) => {
        setTags(tags.filter(tag => tag !== t));
    };

    return (
        <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm flex flex-col p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2"><Tag size={14}/> Edit Tags</h4>
                <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4">
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-primary-300 text-xs rounded border border-slate-700">
                            #{tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-red-400"><X size={12}/></button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                 <input 
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-500"
                    placeholder="New tag..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                 />
                 <button onClick={addTag} className="p-1.5 bg-slate-800 rounded-lg hover:text-white text-slate-400"><Check size={14}/></button>
            </div>

            <button 
                onClick={() => onSave(tags)}
                className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
                Save Changes
            </button>
        </div>
    );
};

export const Published: React.FC<PublishedProps> = ({ items = [], onView, onDelete, onUpdate }) => {
    const [editingTagsId, setEditingTagsId] = useState<number | null>(null);

    const handleSaveTags = (item: DraftItem, newTags: string[]) => {
        if (onUpdate) {
            onUpdate({ ...item, tags: newTags });
        }
        setEditingTagsId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
             <div>
                <h2 className="text-2xl font-bold text-white">已发布 Published</h2>
                <p className="text-slate-400 text-sm mt-1">Live versions and production history.</p>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
                        <Globe size={24} />
                    </div>
                    <h3 className="text-slate-300 font-medium mb-1">No Published Content</h3>
                    <p className="text-slate-500 text-sm">Your published projects will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => onView && onView(item)}
                            className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all cursor-pointer relative"
                        >
                            {editingTagsId === item.id && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <TagEditor 
                                        item={item} 
                                        onClose={() => setEditingTagsId(null)} 
                                        onSave={(tags) => handleSaveTags(item, tags)} 
                                    />
                                </div>
                            )}

                            <div className="h-40 bg-slate-800 relative overflow-hidden">
                                {item.canvasData && item.canvasData.find(e => e.image)?.image ? (
                                    <img 
                                        src={item.canvasData.find(e => e.image)?.image} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800">
                                        <PenTool size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium flex items-center gap-1">
                                        <ExternalLink size={12} /> Edit
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-slate-200 font-semibold mb-1 group-hover:text-primary-400 transition-colors truncate pr-8">{item.title}</h3>
                                
                                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[20px]">
                                    {item.tags?.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">#{tag}</span>
                                    ))}
                                    {item.tags && item.tags.length > 3 && (
                                        <span className="text-[10px] text-slate-500">+{item.tags.length - 3}</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-4 border-t border-slate-800 pt-3">
                                    <span className="text-xs text-slate-500">{item.date}</span>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingTagsId(item.id); }}
                                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                            title="Edit Tags"
                                        >
                                            <Tag size={14} />
                                        </button>
                                        <span className="text-xs px-2 py-0.5 rounded bg-green-900/20 text-green-400 border border-green-900/30">
                                            Published
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Delete Button */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(onDelete && window.confirm("Are you sure you want to delete this published item?")) {
                                        onDelete(item.id);
                                    }
                                }}
                                className="absolute top-2 right-2 p-2 bg-slate-950/50 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};