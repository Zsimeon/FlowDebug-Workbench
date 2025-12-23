import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronDown, 
  Image as ImageIcon, 
  Type, 
  Plus, 
  Trash2, 
  Download, 
  PlayCircle, 
  Copy,
  GripVertical,
  X,
  Check,
  Tag,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Code,
  Quote,
  Eye,
  Edit3,
  Columns,
  Scaling,
  Move
} from 'lucide-react';
import { DraftItem, CanvasElement } from '../types';

interface CreativeWorkshopProps {
    initialData?: DraftItem | null;
    onSave?: (item: DraftItem) => void;
    onPublish?: (item: DraftItem) => void;
}

const PUBLISH_PLATFORMS = [
    { id: 'local', name: '仅本地归档 (Local Archive)', color: 'bg-emerald-600' },
    { id: 'bilibili', name: 'Bilibili', color: 'bg-pink-400' },
    { id: 'xiaohongshu', name: '小红书 (RedBook)', color: 'bg-red-500' },
    { id: 'weibo', name: '微博 (Weibo)', color: 'bg-yellow-500' },
    { id: 'douyin', name: '抖音 (Douyin)', color: 'bg-slate-800' }
];

const DEFAULT_WIDTH = 288; // w-72 equivalent
const DEFAULT_HEIGHT = 384; // h-96 equivalent
const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

export const CreativeWorkshop: React.FC<CreativeWorkshopProps> = ({ initialData, onSave, onPublish }) => {
    const [elements, setElements] = useState<CanvasElement[]>([
        { id: 1, type: 'guide', title: 'Calculated\nPrecision', subtitle: 'Flowspace Guide', content: '', image: '', width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
        { id: 2, type: 'input', title: 'Click to enter content...', subtitle: 'STEP 01', content: '', image: '', width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
        { id: 3, type: 'add', title: 'Add New', subtitle: 'Optional', content: '', image: '', width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    ]);
    const [tags, setTags] = useState<string[]>([]);
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');
    
    const [selectedId, setSelectedId] = useState<number | null>(null);
    
    // --- Unified Editor State ---
    const [isExpanded, setIsExpanded] = useState(false);
    const [fullDocumentText, setFullDocumentText] = useState('');
    const [showPreview, setShowPreview] = useState(false); 
    
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    
    // --- Drag & Resize State ---
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ id: number, startX: number, startY: number, startW: number, startH: number } | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load initial data logic
    useEffect(() => {
        if (initialData) {
            setTags(initialData.tags || []);
            if (initialData.canvasData && initialData.canvasData.length > 0) {
                // If we have saved canvas data, load it directly
                setElements(initialData.canvasData);
            } else {
                // Otherwise, initialize defaults based on consultation data
                setElements(() => {
                    const defaults: CanvasElement[] = [];
                    
                    // Card 1: Title/Guide
                    defaults.push({ 
                        id: 1, 
                        type: 'guide', 
                        title: initialData.title || 'New Project', 
                        subtitle: 'Flowspace Guide', 
                        content: '', 
                        image: '',
                        width: DEFAULT_WIDTH,
                        height: DEFAULT_HEIGHT
                    });

                    // Card 2: AI Analyzed Content (Translation/Summary)
                    if (initialData.outline) {
                        defaults.push({ 
                            id: 2, 
                            type: 'input', 
                            title: "AI 智能分析", 
                            subtitle: 'AI INSIGHT', 
                            content: initialData.outline, 
                            image: initialData.image,
                            width: DEFAULT_WIDTH,
                            height: DEFAULT_HEIGHT
                        });
                    }

                    // Card 3: Original Content (Link or Raw Text)
                    if (initialData.content) {
                        defaults.push({
                            id: 3,
                            type: 'input',
                            title: initialData.outline ? "原始资料 (Source)" : "创作内容",
                            subtitle: 'SOURCE',
                            content: initialData.content,
                            image: !initialData.outline ? initialData.image : undefined,
                            width: DEFAULT_WIDTH,
                            height: DEFAULT_HEIGHT
                        });
                    }

                    // Card 4: Add Button
                    defaults.push({ 
                        id: 4, 
                        type: 'add', 
                        title: 'Add New', 
                        subtitle: 'Optional', 
                        content: '', 
                        image: '',
                        width: DEFAULT_WIDTH,
                        height: DEFAULT_HEIGHT
                    });

                    return defaults;
                });
            }
            // Select the main content card by default
            setSelectedId(2);
        }
    }, [initialData?.id]); 

    // Auto-save Logic
    useEffect(() => {
        if (!initialData || !onSave) return;

        const timer = setTimeout(() => {
            const guideCard = elements.find(e => e.type === 'guide');
            const updatedTitle = guideCard ? guideCard.title.replace('\n', ' ') : initialData.title;

            onSave({
                ...initialData,
                title: updatedTitle,
                tags: tags, // Save tags
                canvasData: elements
            });
        }, 1000); 

        return () => clearTimeout(timer);
    }, [elements, tags, initialData?.id]);

    // --- Drag & Drop (Reordering) Handlers ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (isResizing) {
            e.preventDefault();
            return;
        }
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Make drag image transparent or custom if desired, but default is usually fine
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

        // Prevent dragging 'Add' button if it's the last one (optional rule, but good for UX)
        // Let's allow free movement for now, except maybe keeping 'Add' at the end manually
        
        const newElements = [...elements];
        const draggedItem = newElements[draggedItemIndex];
        
        // Remove from old position
        newElements.splice(draggedItemIndex, 1);
        // Insert at new position
        newElements.splice(dropIndex, 0, draggedItem);
        
        setElements(newElements);
        setDraggedItemIndex(null);
    };

    // --- Resizing Handlers ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizeRef.current) return;
            
            const { id, startX, startY, startW, startH } = resizeRef.current;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = Math.max(MIN_WIDTH, startW + deltaX);
            const newHeight = Math.max(MIN_HEIGHT, startH + deltaY);

            setElements(prev => prev.map(el => 
                el.id === id ? { ...el, width: newWidth, height: newHeight } : el
            ));
        };

        const handleMouseUp = () => {
            if (resizeRef.current) {
                resizeRef.current = null;
                setIsResizing(false);
                // Re-enable text selection if we disabled it
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const handleResizeStart = (e: React.MouseEvent, id: number, currentW?: number, currentH?: number) => {
        e.stopPropagation(); // Prevent card selection/drag
        e.preventDefault();  // Prevent text selection start
        
        setIsResizing(true);
        resizeRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            startW: currentW || DEFAULT_WIDTH,
            startH: currentH || DEFAULT_HEIGHT
        };
        
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'nwse-resize';
    };


    // --- Unified Document Logic (Existing) ---

    const openUnifiedEditor = () => {
        let md = "";
        elements.forEach((el, index) => {
            if (el.type === 'add') return;
            
            // First element is usually the Guide (Title)
            if (el.type === 'guide') {
                md += `# ${el.title.replace(/\n/g, ' ')}\n\n`;
                // If the guide card has content (unlikely but possible), add it
                if (el.content) md += `${el.content}\n\n`;
            } else {
                // Other cards become H2 sections
                // Use the card title or a default
                const header = el.title || `Section ${index}`;
                md += `## ${header}\n`;
                if (el.content) md += `${el.content}\n`;
                md += `\n`;
            }
        });
        setFullDocumentText(md);
        setIsExpanded(true);
    };

    const saveUnifiedEditor = () => {
        // Parse markdown back to cards
        const newElements: CanvasElement[] = [];
        
        // 1. Extract Guide (H1)
        const h1Match = fullDocumentText.match(/^#\s+(.*?)(\n|$)/);
        const guideTitle = h1Match ? h1Match[1].trim() : "New Project";
        
        // Preserve original Guide image/subtitle if it exists
        const oldGuide = elements.find(e => e.type === 'guide');
        newElements.push({
            id: oldGuide?.id || 1,
            type: 'guide',
            title: guideTitle,
            subtitle: oldGuide?.subtitle || 'Flowspace Guide',
            content: '', // Guide usually has no body content in this model
            image: oldGuide?.image || '',
            width: oldGuide?.width || DEFAULT_WIDTH,
            height: oldGuide?.height || DEFAULT_HEIGHT
        });

        // 2. Remove H1 line to process the rest
        const bodyText = fullDocumentText.replace(/^#\s+.*(\n|$)/, '').trim();

        // 3. Split by H2 (## )
        // We use a regex lookahead to split but keep the delimiter to identify sections, 
        // or easier: split by `\n## ` 
        const sections = bodyText.split(/\n##\s+/);
        
        // Handle case where text starts with `## ` immediately
        if (bodyText.startsWith('## ')) {
             sections[0] = sections[0].replace(/^##\s+/, '');
        } else if (sections[0] && !bodyText.startsWith('## ')) {
            // This is "Intro" content before the first H2. 
            // We can add it as a standalone card or append to Guide?
            // Let's make it a card "Introduction"
            if (sections[0].trim()) {
                 const oldCard = elements[1]; // Try to map to first non-guide card
                 newElements.push({
                    id: oldCard?.id || Date.now(),
                    type: 'input',
                    title: "Introduction",
                    subtitle: 'INTRO',
                    content: sections[0].trim(),
                    image: oldCard?.image || '',
                    width: oldCard?.width || DEFAULT_WIDTH,
                    height: oldCard?.height || DEFAULT_HEIGHT
                });
                sections.shift();
            } else {
                sections.shift(); // Empty start
            }
        }

        // Process actual sections
        sections.forEach((sec, idx) => {
            if (!sec.trim()) return;
            
            const lines = sec.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(1).join('\n').trim();
            
            // Try to map to existing cards to preserve images/IDs where possible
            // We skip the first element in `elements` because it's the Guide
            // and maybe the Intro card if we generated one above.
            const existingIndex = newElements.length; 
            const existingCard = elements[existingIndex];

            newElements.push({
                id: existingCard?.type !== 'add' ? existingCard?.id || Date.now() + idx : Date.now() + idx,
                type: 'input',
                title: title || 'Untitled Section',
                subtitle: existingCard?.subtitle || `SECTION ${String(idx + 1).padStart(2, '0')}`,
                content: content,
                image: existingCard?.image || '',
                width: existingCard?.width || DEFAULT_WIDTH,
                height: existingCard?.height || DEFAULT_HEIGHT
            });
        });

        // Always ensure there is an 'Add' button at the end
        newElements.push({ 
            id: 999999, 
            type: 'add', 
            title: 'Add New', 
            subtitle: 'Optional', 
            content: '', 
            image: '',
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT
        });

        setElements(newElements);
        setIsExpanded(false);
    };

    const handleUpdate = (id: number, field: keyof CanvasElement, value: string) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, [field]: value } : el));
    };

    const handleAddCard = () => {
        const newId = Date.now();
        setElements(prev => {
            const addIndex = prev.findIndex(el => el.type === 'add');
            if (addIndex === -1) return prev;

            const stepNumber = String(addIndex).padStart(2, '0');
            const newCard: CanvasElement = {
                id: newId,
                type: 'input',
                title: 'New Section',
                subtitle: `STEP ${stepNumber}`,
                content: '',
                image: '',
                width: DEFAULT_WIDTH,
                height: DEFAULT_HEIGHT
            };
            
            const newElements = [...prev];
            newElements.splice(addIndex, 0, newCard);
            return newElements;
        });
        
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
            }
            setSelectedId(newId);
        }, 100);
    };

    const handleDeleteCard = (id: number) => {
        setElements(prev => prev.filter(el => el.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handlePaste = (e: React.ClipboardEvent, id: number) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                         if (event.target?.result) {
                             handleUpdate(id, 'image', event.target.result as string);
                         }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const handleAddTag = () => {
        if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
            setTags([...tags, newTagInput.trim()]);
            setNewTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleExport = () => {
        // Use the unified logic to generate MD
        let mdContent = "";
        elements.forEach(el => {
            if (el.type === 'add') return;
            if (el.title) mdContent += `# ${el.title}\n\n`;
            if (el.content) mdContent += `${el.content}\n\n`;
            if (el.image) mdContent += `![Image](${el.image})\n\n`;
            mdContent += `---\n\n`;
        });

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowspace-export-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Markdown Insertion Helper (for Unified Editor) ---

    const insertMarkdown = (syntax: string, wrap: boolean = false) => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = fullDocumentText;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        let newText = '';
        let newCursorPos = 0;

        if (wrap) {
            newText = `${before}${syntax}${selected}${syntax}${after}`;
            newCursorPos = end + (syntax.length * 2);
        } else {
            const isLineStart = start === 0 || text[start - 1] === '\n';
            const prefix = isLineStart ? '' : '\n';
            newText = `${before}${prefix}${syntax}${selected}${after}`;
            newCursorPos = start + prefix.length + syntax.length;
        }

        setFullDocumentText(newText);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const togglePlatform = (id: string) => {
        if (selectedPlatforms.includes(id)) {
            setSelectedPlatforms(prev => prev.filter(p => p !== id));
        } else {
            setSelectedPlatforms(prev => [...prev, id]);
        }
    };

    const handlePublishSubmit = () => {
        if (onPublish && initialData) {
            onPublish({
                ...initialData,
                canvasData: elements,
                tags: tags,
                status: 'published'
            });
            alert(`Published to: ${selectedPlatforms.map(p => PUBLISH_PLATFORMS.find(pl => pl.id === p)?.name).join(', ')}`);
            setShowPublishModal(false);
            setSelectedPlatforms([]);
        }
    };

    const FloatingMenu = ({ id }: { id: number }) => (
        <div className="absolute -right-12 top-0 flex flex-col gap-1 bg-slate-800 border border-slate-700 p-1 rounded-lg shadow-xl animate-fade-in z-50">
             <button 
                onClick={(e) => { e.stopPropagation(); openUnifiedEditor(); }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                title="Expand & Edit All"
            >
                <Maximize2 size={14} />
            </button>
            <div className="p-1.5 text-slate-400 cursor-move hover:text-white hover:bg-slate-700 rounded transition-colors" title="Drag to move (Use card handle)">
                <Move size={14} />
            </div>
            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Copy">
                <Copy size={14} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteCard(id); }}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors" 
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
             
             {/* UNIFIED EDITOR (Previously ExpandedEditor) */}
             {isExpanded && (
                <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col animate-fade-in">
                    {/* Editor Header */}
                    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
                        <div className="flex items-center gap-4 flex-1">
                            <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-white transition-colors" title="Close without saving">
                                <Minimize2 size={20} />
                            </button>
                            <div className="h-6 w-px bg-slate-800 mx-2"></div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Columns size={18} className="text-primary-400"/>
                                Unified Document Editor
                            </h3>
                            <span className="text-xs text-slate-500 hidden md:inline">
                                Editing all cards as one Markdown document.
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                                 <button 
                                    onClick={() => setShowPreview(false)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${!showPreview ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                 >
                                     <Edit3 size={12} /> Write
                                 </button>
                                 <button 
                                    onClick={() => setShowPreview(true)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${showPreview ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                 >
                                     <Eye size={12} /> Preview
                                 </button>
                             </div>
                             <button 
                                onClick={saveUnifiedEditor}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors ml-4"
                            >
                                Done & Sync Cards
                            </button>
                        </div>
                    </div>

                    {/* Editor Toolbar */}
                    {!showPreview && (
                        <div className="h-12 border-b border-slate-800 flex items-center px-6 gap-2 bg-slate-900/30 overflow-x-auto">
                            <button onClick={() => insertMarkdown('**', true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors tooltip" title="Bold">
                                <Bold size={16} />
                            </button>
                            <button onClick={() => insertMarkdown('*', true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors tooltip" title="Italic">
                                <Italic size={16} />
                            </button>
                            <div className="w-px h-4 bg-slate-800 mx-1"></div>
                            <button onClick={() => insertMarkdown('# ')} className="p-2 text-primary-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors tooltip" title="Main Title (Card 1)">
                                <Heading1 size={16} />
                            </button>
                            <button onClick={() => insertMarkdown('## ')} className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors tooltip" title="New Card Section">
                                <Heading2 size={16} />
                            </button>
                            <div className="w-px h-4 bg-slate-800 mx-1"></div>
                            <button onClick={() => insertMarkdown('- ')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors tooltip" title="List">
                                <List size={16} />
                            </button>
                             <button onClick={() => insertMarkdown('> ')} className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-md transition-colors tooltip" title="Quote / Highlight">
                                <Quote size={16} />
                            </button>
                            <button onClick={() => insertMarkdown('`', true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors tooltip" title="Inline Code">
                                <Code size={16} />
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex">
                        {/* Write Mode */}
                        <div className={`flex-1 relative ${showPreview ? 'hidden md:block' : 'block'}`}>
                            <textarea
                                ref={textareaRef}
                                value={fullDocumentText}
                                onChange={(e) => setFullDocumentText(e.target.value)}
                                className="w-full h-full bg-slate-950 p-8 md:p-12 resize-none outline-none text-base md:text-lg text-slate-200 font-mono leading-relaxed custom-scrollbar placeholder:text-slate-700"
                                placeholder="# Main Title\n\n## Section 1\nContent...\n\n## Section 2\nContent..."
                            />
                        </div>

                        {/* Preview Mode */}
                        {(showPreview) && (
                            <div className="flex-1 bg-slate-900 border-l border-slate-800 overflow-y-auto custom-scrollbar p-8 md:p-12 prose prose-invert prose-slate max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-6 pb-2 border-b border-slate-800" {...props} />,
                                        h2: ({node, ...props}) => <div className="mt-8 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-primary-500 rounded"></div><h2 className="text-2xl font-bold text-white m-0" {...props} /></div>,
                                        p: ({node, ...props}) => <p className="mb-4 text-slate-300 leading-7" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 text-slate-300" {...props} />,
                                        blockquote: ({node, ...props}) => (
                                            <blockquote className="border-l-4 border-yellow-500 pl-4 py-1 my-4 bg-yellow-900/10 text-yellow-200 italic rounded-r-lg" {...props} />
                                        ),
                                        code: ({node, ...props}) => (
                                            <code className="bg-slate-800 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                        )
                                    }}
                                >
                                    {fullDocumentText || '*No content yet.*'}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
             )}

             {/* Main Toolbar */}
             <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                     <button className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white px-2 py-1 hover:bg-slate-800 rounded-md transition-colors">
                        Minimal INS Style <ChevronDown size={14} className="text-slate-500" />
                     </button>
                     <div className="h-5 w-px bg-slate-800 mx-2"></div>
                     <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors tooltip" title="Add Image"><ImageIcon size={18}/></button>
                        <button className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors tooltip" title="Add Text"><Type size={18}/></button>
                        <button onClick={handleAddCard} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors tooltip" title="Add Element"><Plus size={18}/></button>
                     </div>
                     <div className="h-5 w-px bg-slate-800 mx-2"></div>
                     
                     {/* Tag Management */}
                     <div className="relative">
                         <button 
                            onClick={() => setShowTagMenu(!showTagMenu)}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${showTagMenu ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            title="Manage Tags"
                         >
                             <Tag size={18} />
                             {tags.length > 0 && <span className="text-xs bg-primary-900/50 text-primary-300 px-1.5 py-0.5 rounded-full">{tags.length}</span>}
                         </button>
                         
                         {showTagMenu && (
                             <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 animate-fade-in z-50">
                                 <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Document Tags</h4>
                                 <div className="flex flex-wrap gap-2 mb-3">
                                     {tags.map(tag => (
                                         <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                                             #{tag}
                                             <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400"><X size={10} /></button>
                                         </span>
                                     ))}
                                     {tags.length === 0 && <span className="text-xs text-slate-600 italic">No tags added</span>}
                                 </div>
                                 <div className="flex gap-2">
                                     <input 
                                        type="text" 
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        placeholder="Add tag..."
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-500"
                                     />
                                     <button onClick={handleAddTag} className="p-1 bg-slate-800 hover:bg-primary-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                                         <Plus size={14} />
                                     </button>
                                 </div>
                             </div>
                         )}
                     </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    <div className="h-5 w-px bg-slate-800 mx-2"></div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <Download size={14}/> Export
                    </button>
                    <button 
                        onClick={() => setShowPublishModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-950 rounded-lg hover:bg-white transition-colors shadow-lg shadow-white/5"
                    >
                        <PlayCircle size={14}/> Publish
                    </button>
                </div>
             </div>

             {/* Canvas Area */}
             <div 
                ref={scrollContainerRef}
                className="flex-1 relative overflow-x-auto overflow-y-hidden bg-slate-950 custom-scrollbar"
                onClick={() => { setSelectedId(null); setShowTagMenu(false); }}
             >
                <div className="absolute inset-0 opacity-20 pointer-events-none fixed" 
                     style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                <div className="flex gap-8 items-end h-full px-20 pb-20 pt-10 min-w-max">
                    {elements.map((el, index) => {
                        const isSelected = selectedId === el.id;
                        const isDragging = draggedItemIndex === index;
                        
                        if (el.type === 'add') {
                            return (
                                <div
                                    key={el.id}
                                    onClick={handleAddCard}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className="w-20 h-96 rounded-2xl border-2 border-dashed border-slate-800 hover:border-primary-500 hover:bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer transition-all group opacity-60 hover:opacity-100"
                                >
                                    <div className="p-3 rounded-full bg-slate-900 border border-slate-700 group-hover:border-primary-500 group-hover:text-primary-500 transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium mt-3 group-hover:text-primary-400">Add Page</span>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={el.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                                onDoubleClick={(e) => { e.stopPropagation(); openUnifiedEditor(); }}
                                onPaste={(e) => handlePaste(e, el.id)}
                                style={{ width: el.width || DEFAULT_WIDTH, height: el.height || DEFAULT_HEIGHT }}
                                className={`
                                    relative bg-slate-900 rounded-2xl border shadow-2xl p-6 flex flex-col transition-shadow duration-200 cursor-default group shrink-0
                                    ${isSelected ? 'border-primary-500 ring-1 ring-primary-500/50 z-10' : 'border-slate-800 hover:border-slate-700'}
                                    ${isDragging ? 'opacity-50' : 'opacity-100'}
                                `}
                            >
                                {/* Drag Handle (Top) */}
                                <div 
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-slate-500 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-move hover:bg-slate-700 hover:text-white transition-all z-20"
                                    title="Drag to reorder"
                                >
                                    <GripVertical size={14} />
                                </div>

                                {isSelected && <FloatingMenu id={el.id} />}

                                {el.type === 'guide' ? (
                                    <>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-purple-500 rounded-t-2xl"></div>
                                        <div className="flex justify-between items-start">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">F</span>
                                            </div>
                                            <span className="text-xs font-mono text-slate-500">{el.subtitle}</span>
                                        </div>
                                        
                                        <div className="space-y-2 mb-8 mt-12 flex-1">
                                            <textarea 
                                                value={el.title}
                                                onChange={(e) => handleUpdate(el.id, 'title', e.target.value)}
                                                className="bg-transparent text-2xl font-bold text-white leading-tight w-full resize-none outline-none overflow-hidden h-full placeholder:text-slate-600"
                                                placeholder="Enter title..."
                                            />
                                            <div className="w-8 h-1 bg-slate-700 mt-4"></div>
                                        </div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mt-auto">Flowspace Guide</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-4 shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                            <input 
                                                value={el.subtitle}
                                                onChange={(e) => handleUpdate(el.id, 'subtitle', e.target.value)}
                                                className="text-xs font-mono text-slate-400 bg-transparent outline-none w-full"
                                            />
                                        </div>
                                        
                                        <input 
                                            value={el.title}
                                            onChange={(e) => handleUpdate(el.id, 'title', e.target.value)}
                                            className="text-lg font-medium text-slate-200 mb-6 bg-transparent outline-none w-full placeholder:text-slate-600 shrink-0"
                                            placeholder="Card Header..."
                                        />

                                        <div className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:border-slate-700 hover:bg-slate-800/30 transition-all overflow-hidden relative group/content">
                                            {el.image ? (
                                                <>
                                                    <img src={el.image} alt="Content" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/content:opacity-100 flex items-center justify-center transition-opacity">
                                                        <button 
                                                            onClick={() => handleUpdate(el.id, 'image', '')}
                                                            className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div 
                                                    className="w-full h-full relative"
                                                    onDoubleClick={(e) => { e.stopPropagation(); openUnifiedEditor(); }}
                                                >
                                                    <textarea 
                                                        value={el.content}
                                                        onChange={(e) => handleUpdate(el.id, 'content', e.target.value)}
                                                        className="w-full h-full bg-transparent p-4 outline-none text-sm text-slate-300 resize-none placeholder:text-slate-600 whitespace-pre-wrap leading-relaxed"
                                                        placeholder="Double click to expand writing mode..."
                                                        onMouseDown={(e) => e.stopPropagation()} // Allow text selection without drag interference
                                                    />
                                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded">Markdown Supported</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Resize Handle (Bottom Right) */}
                                <div 
                                    onMouseDown={(e) => handleResizeStart(e, el.id, el.width, el.height)}
                                    className="absolute bottom-0 right-0 p-1 cursor-nwse-resize text-slate-600 hover:text-primary-400 transition-colors z-20"
                                >
                                    <Scaling size={16} className="rotate-90" />
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             {/* Publish Modal */}
             {showPublishModal && (
                <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                        <button 
                            onClick={() => setShowPublishModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-white mb-2">Publish Content</h2>
                            <p className="text-sm text-slate-400">Select platforms to distribute your content.</p>
                        </div>

                        <div className="space-y-3 mb-8">
                            {PUBLISH_PLATFORMS.map(platform => {
                                const isSelected = selectedPlatforms.includes(platform.id);
                                return (
                                    <button
                                        key={platform.id}
                                        onClick={() => togglePlatform(platform.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                                            isSelected 
                                                ? 'bg-slate-800 border-primary-500' 
                                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold text-xs`}>
                                                {platform.name[0]}
                                            </div>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                                {platform.name}
                                            </span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                            isSelected 
                                                ? 'bg-primary-500 border-primary-500' 
                                                : 'border-slate-600'
                                        }`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                            onClick={handlePublishSubmit}
                            disabled={selectedPlatforms.length === 0}
                            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                                selectedPlatforms.length > 0
                                    ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            Publish Now
                        </button>
                    </div>
                </div>
             )}
        </div>
    );
};