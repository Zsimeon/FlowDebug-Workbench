import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Key, Cpu, CheckCircle, Database, Download, Upload, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AISettings, AIProvider } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper to get default models
const getDefaultModel = (provider: string) => {
    if (provider === 'deepseek') return 'deepseek-chat';
    if (provider === 'openai') return 'gpt-3.5-turbo';
    return 'gemini-3-flash-preview';
};

const getDefaultUrl = (provider: string) => {
    if (provider === 'deepseek') return 'https://api.deepseek.com';
    if (provider === 'openai') return 'https://api.openai.com/v1';
    return '';
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    // Current Active Settings
    const [settings, setSettings] = useState<AISettings>({
        provider: 'gemini',
        apiKey: '',
        baseUrl: '',
        model: ''
    });

    // Key Vault: Temporarily stores keys for all providers so users don't lose them when switching tabs
    const [keyVault, setKeyVault] = useState<Record<string, string>>({
        gemini: '',
        openai: '',
        deepseek: ''
    });

    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize logic
    useEffect(() => {
        if (isOpen) {
            // 1. Load Active Settings
            const storedSettings = localStorage.getItem('flowspace_ai_settings');
            let currentSettings = settings;
            if (storedSettings) {
                currentSettings = JSON.parse(storedSettings);
                setSettings(currentSettings);
            }

            // 2. Load Key Vault (Or initialize from active settings if empty)
            const storedVault = localStorage.getItem('flowspace_key_vault');
            if (storedVault) {
                const parsedVault = JSON.parse(storedVault);
                // Ensure the active key in settings is synced to the vault
                parsedVault[currentSettings.provider] = currentSettings.apiKey;
                setKeyVault(parsedVault);
            } else {
                // If no vault exists, create one using the current active key
                setKeyVault(prev => ({
                    ...prev,
                    [currentSettings.provider]: currentSettings.apiKey
                }));
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        // 1. Save Active Settings
        localStorage.setItem('flowspace_ai_settings', JSON.stringify(settings));
        
        // 2. Save Key Vault (Update current provider's key in vault first)
        const updatedVault = { ...keyVault, [settings.provider]: settings.apiKey };
        localStorage.setItem('flowspace_key_vault', JSON.stringify(updatedVault));
        
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleProviderChange = (newProvider: AIProvider) => {
        // 1. Save the key from the input field into the vault for the OLD provider
        const oldProvider = settings.provider;
        const currentInputKey = settings.apiKey;
        
        const updatedVault = { ...keyVault, [oldProvider]: currentInputKey };
        setKeyVault(updatedVault);

        // 2. Switch Provider
        setSettings({
            ...settings,
            provider: newProvider,
            // 3. Load the key for the NEW provider from the vault
            apiKey: updatedVault[newProvider] || '',
            baseUrl: getDefaultUrl(newProvider),
            model: getDefaultModel(newProvider)
        });
    };

    // --- Data Management Logic ---

    const handleExportData = () => {
        try {
            const drafts = localStorage.getItem('flowspace_drafts') || '[]';
            const aiSettings = localStorage.getItem('flowspace_ai_settings') || '{}';
            const vault = localStorage.getItem('flowspace_key_vault') || '{}';
            
            const backupData = {
                version: "1.1",
                timestamp: new Date().toISOString(),
                drafts: JSON.parse(drafts),
                settings: JSON.parse(aiSettings),
                vault: JSON.parse(vault)
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flowspace-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed", e);
            alert("Failed to export data.");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                if (data.drafts) {
                    if (window.confirm("This will overwrite your current drafts and settings. Are you sure?")) {
                        localStorage.setItem('flowspace_drafts', JSON.stringify(data.drafts));
                        if (data.settings) localStorage.setItem('flowspace_ai_settings', JSON.stringify(data.settings));
                        if (data.vault) localStorage.setItem('flowspace_key_vault', JSON.stringify(data.vault));
                        
                        alert("Data imported successfully! The app will refresh.");
                        window.location.reload();
                    }
                } else {
                    alert("Invalid backup file format.");
                }
            } catch (error) {
                console.error("Import error", error);
                alert("Failed to import data. Invalid JSON file.");
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold text-white mb-6">Settings & Configuration</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: AI Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 text-primary-400">
                            <Cpu size={18} />
                            <h3 className="font-semibold text-sm uppercase tracking-wider">AI Model</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-slate-500">Provider Selection (Select to Activate)</label>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['gemini', 'openai', 'deepseek'] as AIProvider[]).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => handleProviderChange(p)}
                                            className={`relative py-2 px-2 rounded-lg text-xs font-medium capitalize border transition-all flex flex-col items-center justify-center gap-1 ${
                                                settings.provider === p
                                                ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/50'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                            }`}
                                        >
                                            {p}
                                            {settings.provider === p && (
                                                <div className="absolute -top-1.5 -right-1.5 bg-white text-primary-600 rounded-full p-0.5 shadow-sm">
                                                    <CheckCircle size={10} fill="currentColor" className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
                                    <ShieldCheck size={12} className="text-primary-400"/> 
                                    Configuring: {settings.provider.toUpperCase()}
                                </div>

                                {settings.provider !== 'gemini' && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-500 flex items-center gap-1">
                                            <Key size={10} /> API Key
                                        </label>
                                        <input 
                                            type="password"
                                            value={settings.apiKey}
                                            onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none placeholder:text-slate-600"
                                            placeholder={`Enter your ${settings.provider} API Key`}
                                        />
                                    </div>
                                )}
                                {settings.provider === 'gemini' && (
                                    <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded-lg text-xs text-blue-300 leading-relaxed">
                                        <span className="font-bold">Gemini Mode:</span> Using default Environment API Key. You can override it by entering a custom key below, but it's not required.
                                        
                                        <div className="mt-2 pt-2 border-t border-blue-900/30">
                                             <label className="text-[10px] text-blue-400/70 block mb-1">Optional Override Key:</label>
                                             <input 
                                                type="password"
                                                value={settings.apiKey}
                                                onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                                                className="w-full bg-slate-900/50 border border-blue-500/30 rounded px-2 py-1 text-xs text-blue-100 focus:outline-none"
                                                placeholder="Gemini API Key (Optional)"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500">Model Name</label>
                                    <input 
                                        type="text"
                                        value={settings.model}
                                        onChange={(e) => setSettings({...settings, model: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-primary-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Data Management */}
                    <div className="space-y-6 md:pl-8 md:border-l border-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-primary-400">
                            <Database size={18} />
                            <h3 className="font-semibold text-sm uppercase tracking-wider">Data Management</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Your drafts are stored locally in this app. Export a backup to keep your data safe, or transfer it to another device.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleExportData}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all group"
                                >
                                    <Download size={20} className="text-slate-400 group-hover:text-white" />
                                    <span className="text-xs font-medium text-slate-300 group-hover:text-white">Export Backup</span>
                                </button>

                                <button 
                                    onClick={handleImportClick}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all group"
                                >
                                    <Upload size={20} className="text-slate-400 group-hover:text-white" />
                                    <span className="text-xs font-medium text-slate-300 group-hover:text-white">Import Data</span>
                                </button>
                                {/* Hidden File Input */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept=".json" 
                                    className="hidden" 
                                />
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
                                <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                                <span className="text-[10px] text-yellow-200/70 leading-relaxed">
                                    Caution: Importing data will overwrite your current drafts. Please export a backup first if you are unsure.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        Currently Active: <span className="text-primary-400 font-bold uppercase">{settings.provider}</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Close
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-primary-900/20"
                        >
                            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                            {saved ? 'Saved!' : 'Save Config'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};