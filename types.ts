import { LucideIcon } from 'lucide-react';

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  CONSULTATION = 'CONSULTATION',
  INSPIRATION = 'INSPIRATION',
  WORKSHOP = 'WORKSHOP',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface NavItem {
  id: ViewType;
  label: string;
  icon: LucideIcon;
  category: 'Workspace' | 'Creation';
}

export interface BugReport {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  timestamp: string;
}

export interface InspirationItem {
  id: string;
  title: string;
  imageUrl: string;
  tags: string[];
}

export interface CanvasElement {
    id: number;
    type: 'guide' | 'input' | 'add';
    title: string;
    subtitle?: string;
    content: string;
    image?: string;
    width?: number;  // For resizing
    height?: number; // For resizing
}

export interface DraftItem {
    id: number;
    title: string;
    content?: string;
    outline?: string; // AI Generated directory/outline
    image?: string;
    tags?: string[];
    date?: string;
    status: 'pending' | 'processed' | 'published' | 'archived';
    canvasData?: CanvasElement[];
    read?: boolean;
}

export type AIProvider = 'gemini' | 'openai' | 'deepseek';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}