import React, { useMemo } from 'react';
import { Archive, FolderOpen, Hash, FileText } from 'lucide-react';
import { DraftItem } from '../types';

interface ArchivedProps {
    items?: DraftItem[];
    onView?: (item: DraftItem) => void;
}

export const Archived: React.FC<ArchivedProps> = ({ items = [], onView }) => {
    
    // Group items by tags
    const groupedItems = useMemo(() => {
        const groups: Record<string, DraftItem[]> = {};
        const untagged: DraftItem[] = [];

        items.forEach(item => {
            if (!item.tags || item.tags.length === 0) {
                untagged.push(item);
            } else {
                item.tags.forEach(tag => {
                    if (!groups[tag]) groups[tag] = [];
                    // Avoid duplicates if needed, but for now we list item under every tag it has
                    if (!groups[tag].find(i => i.id === item.id)) {
                        groups[tag].push(item);
                    }
                });
            }
        });

        // Sort keys alphabetically
        const sortedKeys = Object.keys(groups).sort();
        return { groups, sortedKeys, untagged };
    }, [items]);

    const totalDocs = items.length;

    return (
         <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
             <div className="flex items-end justify-between border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Archive className="text-primary-500" size={24}/> 归档复盘 Archived
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Browse your creation library organized by tags.</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-white">{totalDocs}</span>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Documents</p>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
                    <FolderOpen size={48} className="text-slate-700 mb-4" />
                    <h3 className="text-slate-400 font-medium">Repository Empty</h3>
                    <p className="text-slate-600 text-sm mt-1">Start creating and tagging content to populate your archive.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Render Tag Groups */}
                    {groupedItems.sortedKeys.map(tag => (
                        <div key={tag} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-primary-900/30 text-primary-400 rounded-lg">
                                    <Hash size={16} />
                                </span>
                                <h3 className="text-lg font-bold text-slate-200">{tag}</h3>
                                <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                                    {groupedItems.groups[tag].length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {groupedItems.groups[tag].map(item => (
                                    <div 
                                        key={`${tag}-${item.id}`}
                                        onClick={() => onView && onView(item)}
                                        className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-primary-500/30 hover:bg-slate-800 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`p-2 rounded-lg ${item.status === 'published' ? 'bg-green-900/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-[10px] text-slate-500">{item.date}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-300 group-hover:text-white line-clamp-2 leading-relaxed mb-2 h-10">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                                            <span className={`text-[10px] uppercase font-bold ${item.status === 'published' ? 'text-green-500' : 'text-slate-600'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Untagged Section */}
                    {groupedItems.untagged.length > 0 && (
                        <div className="space-y-4 pt-8 border-t border-slate-800/50">
                            <div className="flex items-center gap-2 opacity-60">
                                <span className="p-1.5 bg-slate-800 text-slate-400 rounded-lg">
                                    <FolderOpen size={16} />
                                </span>
                                <h3 className="text-lg font-bold text-slate-400">Uncategorized</h3>
                                <span className="text-xs text-slate-600 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                                    {groupedItems.untagged.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-75">
                                {groupedItems.untagged.map(item => (
                                    <div 
                                        key={`untagged-${item.id}`}
                                        onClick={() => onView && onView(item)}
                                        className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-600 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="p-2 rounded-lg bg-slate-800 text-slate-500">
                                                <FileText size={16} />
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-300 line-clamp-1">
                                            {item.title}
                                        </h4>
                                        <span className="text-[10px] text-slate-600">{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}