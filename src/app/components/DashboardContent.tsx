"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  CheckCircle2, Circle, Filter, Plus, LogOut,
  Trash2, Edit2, X, Save, AlertCircle, MessageSquare,
  ChevronUp, ChevronDown, ChevronRight, Menu, Sun, Moon, Search, List, LayoutGrid,
  FileText, FileCode, File, Download
} from "lucide-react";

import { logout } from "../actions/auth";
import { createProject, updateProject, deleteProject, reorderProjects } from "../actions/projects";
import {
  createTask, createLog, updateTaskStatus,
  deleteTask, updateTask, updateLog, deleteLog
} from "../actions/tasks";
import { updateTagColor } from "../actions/tags";
import { createNote, updateNote, deleteNote } from "../actions/notes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase, uploadAttachment } from "@/lib/supabase";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Gera uma cor determinística baseada no texto para as tags (fallback)
const generateFallbackColor = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

interface Project {
  id: string;
  name: string;
  color: string;
  status?: string;
  _count?: { tasks: number };
}

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

interface Log {
  id: string;
  content: string;
  attachments: string[];
  type: string;
  createdAt: Date | string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  attachments: string[];
  status: string;
  tags: string[];
  logs: Log[];
  createdAt: Date | string;
}

import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardContent({
  initialProjects,
  initialTasks,
  initialNotes,
  tagConfigs,
  currentProjectId
}: {
  initialProjects: Project[],
  initialTasks: Task[],
  initialNotes: any[],
  tagConfigs: { name: string, color: string }[],
  currentProjectId?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = currentProjectId;

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Sincroniza a tarefa selecionada com os dados atualizados do servidor
  useEffect(() => {
    if (selectedTaskForDetail) {
      const updated = initialTasks.find(t => t.id === selectedTaskForDetail.id);
      if (updated) setSelectedTaskForDetail(updated);
    }
  }, [initialTasks]);

  // Fechar janelas com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTaskForDetail(null);
        setIsAddingLog(false);
        setIsProjectModalOpen(false);
        setIsTaskModalOpen(false);
        setIsNoteModalOpen(false);
        setEditingProject(null);
        setEditingTask(null);
        setEditingNoteId(null);
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed">("pending");

  const [tempLogAttachments, setTempLogAttachments] = useState<string[]>([]);
  const [tempTaskAttachments, setTempTaskAttachments] = useState<string[]>([]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogContent, setEditingLogContent] = useState("");

  // Mapeamento de cores personalizadas
  const [customTagColors, setCustomTagColors] = useState<Record<string, string>>(
    Object.fromEntries(tagConfigs.map(c => [c.name, c.color]))
  );

  const getTagColor = (tag: string) => customTagColors[tag] || generateFallbackColor(tag);

  // Estados de Notas
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isPending, startTransition] = useTransition();

  // Persistência de Tema e Visualização
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('theme-light', savedTheme === 'light');
    }

    const savedViewMode = localStorage.getItem('viewMode') as 'card' | 'list';
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('theme-light', newTheme === 'light');
  };

  const handleToggleViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  const handleCreateNote = () => {
    if (!newNoteContent || !selectedProjectId) return;
    startTransition(async () => {
      await createNote(selectedProjectId, newNoteContent);
      setNewNoteContent("");
    });
  };

  const handleUpdateNote = (id: string) => {
    if (!editingNoteContent) return;
    startTransition(async () => {
      await updateNote(id, editingNoteContent);
      setEditingNoteId(null);
      setEditingNoteContent("");
    });
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm("Excluir esta nota?")) return;
    startTransition(async () => {
      await deleteNote(id);
    });
  };
  const handleTagColorChange = (tag: string, color: string) => {
    setCustomTagColors(prev => ({ ...prev, [tag]: color }));
  };

  const saveTagColorChange = (tag: string, color: string) => {
    startTransition(async () => {
      await updateTagColor(tag, color);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  const selectedProject = initialProjects.find(p => p.id === selectedProjectId);

  // Extrair todas as tags únicas para sugestões
  const allUniqueTags = Array.from(new Set(initialTasks.flatMap(t => t.tags))).sort();

  // Filtrar tarefas por tag, status e busca
  const tasks = initialTasks.filter(t => {
    const matchesTag = !selectedTag || t.tags.includes(selectedTag);
    const matchesStatus = t.status === statusFilter;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(query) ||
      (t.description || "").toLowerCase().includes(query) ||
      t.logs.some(l => l.content.toLowerCase().includes(query)) ||
      t.tags.some(tag => tag.toLowerCase().includes(query));

    return matchesTag && matchesStatus && matchesSearch;
  });

  const handleSelectProject = (id: string) => {
    startTransition(() => {
      // Resetar filtros ao trocar de projeto
      setSelectedTag(null);
      setStatusFilter("pending");
      setSelectedTaskForDetail(null);
      setIsAddingLog(false);

      const params = new URLSearchParams(searchParams.toString());
      params.set("project", id);
      router.push(`/?${params.toString()}`);
    });
  };

  const handleCreateProject = () => {
    if (!newProjectName) return;
    startTransition(async () => {
      await createProject(newProjectName);
      setNewProjectName("");
      setIsProjectModalOpen(false);
    });
  };

  const handleUpdateProject = () => {
    if (!editingProject || !newProjectName) return;
    startTransition(async () => {
      await updateProject(editingProject.id, newProjectName, editingProject.color);
      setEditingProject(null);
      setNewProjectName("");
    });
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este projeto? Todas as tarefas serão apagadas.")) return;
    startTransition(async () => {
      await deleteProject(id);
      if (selectedProjectId === id) {
        router.push("/");
      }
    });
  };

  const handleCreateTask = () => {
    if (!newTaskTitle || !selectedProjectId) return;
    startTransition(async () => {
      if (editingTask) {
        await updateTask(editingTask.id, newTaskTitle, newTaskDescription, newTaskTags.split(",").map(t => t.trim()).filter(t => t));
      } else {
        await createTask(selectedProjectId, newTaskTitle, newTaskDescription, newTaskTags.split(",").map(t => t.trim()).filter(t => t), tempTaskAttachments);
      }
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskTags("");
      setTempTaskAttachments([]);
      setEditingTask(null);
      setIsTaskModalOpen(false);
    });
  };

  const handleDeleteTask = (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    startTransition(async () => {
      await deleteTask(id);
    });
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || "");
    setNewTaskTags(task.tags.join(", "));
    setIsTaskModalOpen(true);
  };

  const handleAddLog = (taskId: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && (e.currentTarget.value || tempLogAttachments.length > 0)) {
      e.preventDefault();
      const content = e.currentTarget.value;
      const target = e.currentTarget;
      startTransition(async () => {
        await createLog(taskId, content, "note", tempLogAttachments);
        target.value = "";
        setTempLogAttachments([]);
      });
    }
  };

  const handleToggleTask = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    startTransition(async () => {
      await updateTaskStatus(task.id, newStatus);
    });
  };

  const handleUpdateLog = (id: string) => {
    startTransition(async () => {
      await updateLog(id, editingLogContent);
      setEditingLogId(null);
    });
  };

  const handleDeleteLog = (id: string) => {
    if (!confirm("Excluir este andamento?")) return;
    startTransition(async () => {
      await deleteLog(id);
    });
  };

  const handleMoveProject = (id: string, direction: 'up' | 'down') => {
    const currentIndex = initialProjects.findIndex(p => p.id === id);
    if (currentIndex === -1) return;
    
    const newProjects = [...initialProjects];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= newProjects.length) return;
    
    // Swap
    [newProjects[currentIndex], newProjects[newIndex]] = [newProjects[newIndex], newProjects[currentIndex]];
    
    const projectIds = newProjects.map(p => p.id);
    startTransition(async () => {
      await reorderProjects(projectIds);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, callback: (url: string) => void) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            const url = await uploadAttachment(file);
            callback(url);
          } catch (err) {
            console.error("Erro ao subir imagem:", err);
            alert("Erro ao subir imagem");
          }
        }
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadAttachment(file);
        callback(url);
      } catch (err) {
        console.error("Erro ao subir imagem:", err);
        alert("Erro ao subir imagem");
      }
    }
    // Reseta o valor para permitir subir a mesma imagem novamente se necessário
    e.target.value = "";
  };

  const isImage = (url: string) => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={32} className="text-red-400" />;
    if (['xml', 'html', 'json'].includes(ext || '')) return <FileCode size={32} className="text-blue-400" />;
    if (['csv', 'txt'].includes(ext || '')) return <FileText size={32} className="text-emerald-400" />;
    return <File size={32} className="text-[#888]" />;
  };

  const handleDownload = async (url: string) => {
    const fileName = url.split('/').pop()?.split('?')[0] || 'arquivo';
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const renderContent = (content: string, attachments: string[] = []) => {

    return (
      <div className="space-y-3">
        {content && (
          <p className="text-[15.5px] leading-relaxed text-[var(--foreground)] font-medium whitespace-pre-wrap break-words">
            {content}
          </p>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {attachments.map((url, i) => {
              const isImg = isImage(url);
              const fileName = url.split('/').pop()?.split('.').slice(0, -1).join('.') || 'anexo';
              const fileExt = url.split('.').pop()?.split('?')[0].toUpperCase();

              if (isImg) {
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(url); }}
                    className="group relative block w-32 h-32 border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] transition-all shadow-lg bg-[var(--sidebar)] text-left"
                  >
                    <img
                      src={url}
                      alt="attachment"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus size={20} className="text-white" />
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); handleDownload(url); }}
                  className="group relative flex flex-col items-center justify-center w-32 h-32 border border-[var(--border)] rounded-xl bg-[var(--sidebar)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all shadow-lg p-3 text-center gap-2"
                >
                  {getFileIcon(url)}
                  <span className="text-[10px] font-black uppercase text-[#888] truncate w-full px-1 group-hover:text-[var(--accent)]">
                    {fileExt}
                  </span>
                  <div className="absolute inset-0 bg-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Download size={16} className="text-[var(--accent)]" />
                  </div>
                </button>
              );

            })}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="flex h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden selection:bg-[var(--accent)]/30 transition-colors duration-300">
      {/* SIDEBAR - Mobile Responsive */}
      {/* Backdrop para Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col flex-shrink-0 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      )}>
        <div className="p-6 border-b border-[var(--border)]/50 flex justify-between items-center">
          <div>
          <button 
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("project");
              router.push(`/?${params.toString()}`);
            }}
            className="text-left hover:opacity-80 transition-opacity flex items-center gap-3 group"
          >
            <div className="relative w-10 h-10 overflow-hidden rounded-xl border border-[var(--border)] transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
              <img 
                src="/logo-devlog.png" 
                alt="Logo DevLog" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Project Notes</h1>
              <p className="text-sm text-[#888888] mt-0.5 font-medium">seus projetos em foco</p>
            </div>
          </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-[#666] hover:text-[var(--foreground)]"
            >
              <X size={20} />
            </button>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="p-2 text-[#666666] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-md transition-all disabled:opacity-50"
              title="Sair do sistema"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-3 px-2">Projetos</h2>
            <nav className="space-y-1">
              {initialProjects.map((project) => (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() => { handleSelectProject(project.id); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left mb-1",
                      selectedProjectId === project.id
                        ? "bg-[var(--surface-hover)] text-[var(--foreground)] shadow-lg"
                        : "text-[#888] hover:bg-[var(--surface-hover)]/40 hover:text-[var(--foreground)]"
                    )}
                    style={selectedProjectId === project.id ? { borderLeft: `2px solid ${project.color}` } : {}}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500"
                        style={{
                          backgroundColor: project.color,
                          boxShadow: selectedProjectId === project.id ? `0 0 12px ${project.color}` : `0 0 4px ${project.color}40`
                        }}
                      />
                      <span className="font-bold text-sm truncate tracking-tight">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-lg transition-colors",
                        selectedProjectId === project.id ? "bg-white/10 text-[var(--foreground)]" : "bg-black/20 text-[#555]"
                      )}>
                        {project._count?.tasks || 0}
                      </span>
                    </div>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg shadow-xl border border-[var(--border)]">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveProject(project.id, 'up'); }} 
                      disabled={initialProjects.indexOf(project) === 0}
                      className="p-1 hover:text-[var(--accent)] disabled:opacity-20"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveProject(project.id, 'down'); }} 
                      disabled={initialProjects.indexOf(project) === initialProjects.length - 1}
                      className="p-1 hover:text-[var(--accent)] disabled:opacity-20"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <div className="w-px h-3 bg-[var(--border)] mx-1" />
                    <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); setNewProjectName(project.name); }} className="p-1 hover:text-blue-400"><Edit2 size={12} /></button>
                    <button onClick={(e) => handleDeleteProject(project.id, e)} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)]/50">
          <button
            onClick={() => { setEditingProject(null); setNewProjectName(""); setIsProjectModalOpen(true); }}
            className="w-full py-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs font-bold text-[#aaa] hover:text-[var(--foreground)] transition-all flex items-center justify-center gap-2 group shadow-inner"
          >
            <div className="p-1 bg-[var(--border)] group-hover:bg-[var(--accent)] rounded-md transition-colors">
              <Plus size={14} className="text-white" />
            </div>
            Novo projeto
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[var(--background)] transition-colors duration-300">
        {selectedProject ? (
          <>
            <header className="border-b border-[var(--border)] flex flex-col px-3 lg:px-8 bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-40">
              <div className="h-16 lg:h-20 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 text-[#666] hover:text-[var(--foreground)]"
                  >
                    <Menu size={24} />
                  </button>
                  <h2 className="text-base lg:text-2xl font-bold text-[var(--foreground)] tracking-tight truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">{selectedProject.name}</h2>
                  {isPending ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full animate-pulse">
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                      <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">Carregando</span>
                    </div>
                  ) : (
                    <span className="hidden sm:inline-block px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold rounded-full">
                      {selectedProject.status === 'active' ? 'ativo' : 'arquivado'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 lg:gap-3 flex-shrink-0">
                  <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-0.5 lg:p-1 shadow-sm">
                    <button
                      onClick={() => handleToggleViewMode('card')}
                      className={cn(
                        "p-1 lg:p-1.5 rounded-lg transition-all",
                        viewMode === 'card' ? "bg-[var(--accent)] text-[var(--background)] shadow-md" : "text-[#666] hover:text-[var(--foreground)]"
                      )}
                      title="Modo Card"
                    >
                      <LayoutGrid size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                    <button
                      onClick={() => handleToggleViewMode('list')}
                      className={cn(
                        "p-1 lg:p-1.5 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-[var(--accent)] text-[var(--background)] shadow-md" : "text-[#666] hover:text-[var(--foreground)]"
                      )}
                      title="Modo Lista"
                    >
                      <List size={16} className="lg:w-[18px] lg:h-[18px]" />
                    </button>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 lg:p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all shadow-sm active:scale-95"
                    title={theme === 'dark' ? "Mudar para tema claro" : "Mudar para tema escuro"}
                  >
                    {theme === 'dark' ? <Sun size={18} className="text-amber-400 lg:w-5 lg:h-5" /> : <Moon size={18} className="text-[var(--accent)] lg:w-5 lg:h-5" />}
                  </button>
                </div>
              </div>

              {/* Tag Filter Bar */}
              {allUniqueTags.length > 0 && (
                <div className="pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <Filter size={14} className="text-[#666] mr-1" />
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                      !selectedTag ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--surface)] border-[var(--border)] text-[#666] hover:border-[#444]"
                    )}
                  >Todas</button>
                  {allUniqueTags.map(tag => {
                    const tagColor = getTagColor(tag);
                    return (
                      <div key={tag} className="relative group">
                        <button
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                            selectedTag === tag ? "" : "bg-[var(--surface)] border-[#333] text-[#888] hover:border-[#444]"
                          )}
                          style={selectedTag === tag ? {
                            backgroundColor: `${tagColor}20`,
                            borderColor: tagColor,
                            color: tagColor,
                            boxShadow: `0 0 10px ${tagColor}30`
                          } : {}}
                        >{tag}</button>

                        {/* Seletor de cores escondido, aparece no hover do filtro */}
                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <input
                            type="color"
                            className="w-4 h-4 rounded-full border border-white/20 bg-transparent cursor-pointer overflow-hidden p-0"
                            value={tagColor.startsWith('hsl') ? '#3b82f6' : tagColor} // Fallback para hex se for hsl
                            onChange={(e) => handleTagColorChange(tag, e.target.value)}
                            onBlur={(e) => saveTagColorChange(tag, e.target.value)}
                            title="Mudar cor da tag"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Status Tabs */}
              <div className="mt-4 flex items-center justify-start border-b border-[#333]/50 pb-px gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all relative",
                    statusFilter === "pending" ? "text-[var(--accent)]" : "text-[#555] hover:text-[#888]"
                  )}
                >
                  Pendentes
                  {statusFilter === "pending" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />}
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all relative",
                    statusFilter === "completed" ? "text-emerald-400" : "text-[#555] hover:text-[#888]"
                  )}
                >
                  Concluídas
                  {statusFilter === "completed" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                </button>

                {/* Busca colada às abas com gap-8 */}
                <div className="relative group mb-2 w-full max-w-[200px] xs:max-w-xs sm:max-w-md ml-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#666] group-focus-within:text-[var(--accent)] transition-colors">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-[var(--sidebar)] border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#666] hover:text-[var(--foreground)]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-hidden p-4 lg:p-8 bg-[var(--background)]">
              <div className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-10 h-full">
                {/* COLUNA ESQUERDA: TAREFAS */}
                <div className="flex flex-col h-full min-h-0">
                  <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-6 pb-20">
                    <div className="flex items-center justify-between mb-4 bg-[var(--sidebar)] p-4 rounded-2xl border border-[var(--border)]">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">Fluxo de Tarefas</h3>
                      <button
                        onClick={() => { setEditingTask(null); setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskTags(""); setIsTaskModalOpen(true); }}
                        className="px-4 py-2 text-[var(--background)] text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-2 active:scale-95 shadow-lg"
                        style={{
                          backgroundColor: theme === 'light' ? 'var(--accent)' : selectedProject.color,
                          boxShadow: `0 4px 12px ${theme === 'light' ? 'var(--accent)' : selectedProject.color}30`
                        }}
                      >
                        <Plus size={14} strokeWidth={3} /> Nova Tarefa
                      </button>
                    </div>
                    {tasks.length === 0 ? (
                      <div className="text-center py-20 opacity-40 text-sm font-medium">Nenhuma tarefa encontrada neste filtro.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {tasks.map((task) => {
                          const lastLog = task.logs[task.logs.length - 1];
                          const logCount = task.logs.length;

                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTaskForDetail(task)}
                              className={cn(
                                "bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg transition-all duration-300 group cursor-pointer hover:bg-[var(--surface-hover)] relative",
                                task.status === "completed" ? "opacity-60" : "",
                                viewMode === 'list' ? "p-3" : "p-4"
                              )}
                              style={{
                                borderLeft: `3px solid ${task.status === 'completed' ? '#444' : (theme === 'light' ? 'var(--accent)' : selectedProject.color)}`,
                              }}
                            >
                              {/* Efeito de brilho no hover */}
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                                style={{ background: `radial-gradient(circle at center, ${selectedProject.color}, transparent 70%)` }}
                              />
                              <div className={cn("flex items-start", viewMode === 'list' ? "gap-3" : "gap-4")}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleTask(task); }}
                                  className={cn("flex-shrink-0 transition-colors", 
                                    viewMode === 'list' ? "mt-0.5" : "mt-1",
                                    task.status === "completed" ? "text-emerald-500" : "text-[#555] hover:text-[var(--accent)]"
                                  )}
                                >
                                  {task.status === "completed" ? <CheckCircle2 size={viewMode === 'list' ? 18 : 20} /> : <Circle size={viewMode === 'list' ? 18 : 20} />}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className={cn(
                                      "font-semibold leading-tight break-words", 
                                      task.status === "completed" ? "text-[#888] line-through" : "text-[var(--foreground)]",
                                      viewMode === 'list' ? "text-sm" : "text-lg mb-1"
                                    )}>
                                      {viewMode === 'list' ? task.title : renderContent(task.title, task.attachments)}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={(e) => { e.stopPropagation(); openEditTask(task); }} className="p-1.5 text-[#888] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20 bg-[var(--background)] rounded-md transition-all"><Edit2 size={12} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 text-[#888] hover:text-red-500 hover:bg-red-600/20 bg-[var(--background)] rounded-md transition-all"><Trash2 size={12} /></button>
                                    </div>
                                  </div>

                                  {viewMode === 'card' && task.description && (
                                    <p className="text-xs text-[var(--foreground)] opacity-70 line-clamp-2 leading-relaxed font-medium">
                                      {task.description}
                                    </p>
                                  )}

                                  {viewMode === 'card' && lastLog && (
                                    <div className="mt-2 flex items-center gap-2 text-[#888]">
                                      <MessageSquare size={12} className="flex-shrink-0" />
                                      <p className="text-xs truncate italic">
                                        {lastLog.content.replace(/!\[.*?\]\(.*?\)/g, "[Anexo]")}
                                      </p>
                                    </div>
                                  )}

                                  <div className={cn("flex items-center justify-between", viewMode === 'list' ? "mt-1.5" : "mt-3")}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      {task.attachments.length > 0 && viewMode === 'list' && (
                                        <span title="Possui anexos">
                                          <Plus size={12} className="text-[var(--accent)]" />
                                        </span>
                                      )}
                                      {task.tags.map(tag => {
                                        const tagColor = getTagColor(tag);
                                        return (
                                          <span
                                            key={tag}
                                            className={cn(
                                              "font-black rounded-full uppercase border transition-all truncate",
                                              viewMode === 'list' ? "px-1.5 py-0 text-[8px]" : "px-2.5 py-0.5 text-[10px]"
                                            )}
                                            style={{
                                              backgroundColor: `${tagColor}15`,
                                              color: tagColor,
                                              borderColor: `${tagColor}40`
                                            }}
                                          >
                                            {tag}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      <span
                                        className={cn(
                                          "font-bold uppercase tracking-widest flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all",
                                          viewMode === 'list' 
                                            ? "text-[9px] bg-[var(--surface-hover)] border-[var(--border)] shadow-sm" 
                                            : "text-[10px]"
                                        )}
                                        style={{ 
                                          color: logCount > 0 ? (theme === 'light' ? 'var(--accent)' : selectedProject.color) : '#666',
                                          borderColor: logCount > 0 ? (theme === 'light' ? 'var(--accent)40' : `${selectedProject.color}40`) : 'transparent'
                                        }}
                                      >
                                        <MessageSquare size={viewMode === 'list' ? 10 : 11} /> {logCount} {logCount === 1 ? 'Andamento' : 'Andamentos'}
                                      </span>
                                      <span className={cn(
                                        "font-bold text-[var(--accent)] bg-[var(--accent)]/10 rounded border border-[var(--accent)]/20 shadow-sm",
                                        viewMode === 'list' ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]"
                                      )}>
                                        {new Date(task.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: NOTAS (BLOQUINHOS) */}
                <div className="flex flex-col h-full min-h-0 xl:border-l xl:border-[#1a1a1a] xl:pl-10">
                  <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-20">
                    <div className="flex items-center justify-between mb-6 bg-[var(--background)]/60 p-4 rounded-2xl border border-[var(--border)] shadow-inner">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">Notas do Projeto</h3>
                      <button
                        onClick={() => { setIsNoteModalOpen(true); setNewNoteContent(""); }}
                        className="px-4 py-2 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase rounded-lg border border-[var(--accent)]/30 transition-all flex items-center gap-2 active:scale-95"
                      >
                        <Plus size={14} /> Nova Nota
                      </button>
                    </div>

                    {/* Grid de Notas (Bloquinhos) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
                      {initialNotes.length === 0 ? (
                        <div className="col-span-full py-24 text-center opacity-10 flex flex-col items-center gap-4">
                          <Plus size={48} strokeWidth={1} />
                          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhuma nota</p>
                        </div>
                      ) : (
                        initialNotes.map((note, idx) => (
                          <div
                            key={note.id}
                            className={cn(
                              "p-8 shadow-[10px_10px_20px_rgba(0,0,0,0.5)] relative transition-all group hover:-translate-y-3 hover:shadow-[20px_20px_40px_rgba(0,0,0,0.6)] flex flex-col",
                              idx % 3 === 0 ? "-rotate-2" : idx % 3 === 1 ? "rotate-1" : "rotate-2",
                              "border-t-[25px] border-amber-200/30"
                            )}
                            style={{
                              backgroundColor: idx % 2 === 0 ? '#fef3c7' : '#fde68a',
                              minHeight: '240px'
                            }}
                          >
                            {/* Efeito de fita adesiva */}
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/20 backdrop-blur-[1px] -rotate-1 border border-white/10" />

                            {editingNoteId === note.id ? (
                              <div className="flex-1 flex flex-col">
                                <textarea
                                  autoFocus
                                  className="flex-1 w-full bg-transparent border-none outline-none text-amber-950 text-[15px] font-bold resize-none leading-relaxed"
                                  value={editingNoteContent}
                                  onChange={(e) => setEditingNoteContent(e.target.value)}
                                />
                                <div className="flex justify-end gap-3 mt-6">
                                  <button onClick={() => setEditingNoteId(null)} className="text-[10px] font-black uppercase text-amber-900/40 hover:text-amber-900 transition-colors">Sair</button>
                                  <button onClick={() => handleUpdateNote(note.id)} className="px-4 py-2 bg-amber-950 text-[#fef3c7] text-[10px] font-black uppercase rounded shadow-xl hover:bg-black transition-all">Salvar</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                                  <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }} className="p-2 text-amber-950/20 hover:text-amber-900 transition-colors"><Edit2 size={12} /></button>
                                  <button onClick={() => handleDeleteNote(note.id)} className="p-2 text-amber-950/20 hover:text-red-700 transition-colors"><Trash2 size={12} /></button>
                                </div>
                                <div className="text-[16px] text-amber-950 leading-relaxed whitespace-pre-wrap font-bold flex-1">
                                  {note.content}
                                </div>
                                <div className="mt-8 pt-4 border-t border-amber-950/5 flex items-center justify-between text-amber-950/70">
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                  </span>
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Mobile Header para Estado Vazio */}
            <header className="lg:hidden h-16 border-b border-[var(--border)] flex items-center px-4 bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-40">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-[#666] hover:text-[var(--foreground)]"
              >
                <Menu size={24} />
              </button>
              <h1 className="ml-4 text-lg font-bold text-[var(--foreground)] tracking-tight">Project Notes</h1>
            </header>
            <div className="flex-1 flex items-center justify-center bg-[var(--background)] p-8">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[var(--accent)]/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] flex items-center justify-center mx-auto shadow-2xl mb-6">
                  <LayoutGrid size={40} className="text-[var(--accent)]" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-[var(--foreground)] mb-3 tracking-tight">Project Notes</h2>
                <p className="text-[#888] font-medium leading-relaxed">
                  Bem-vindo de volta! Selecione um projeto na barra lateral para começar a gerenciar suas tarefas e notas, ou crie um novo.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-left hover:border-[var(--accent)]/50 transition-all group">
                  <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus size={20} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Novo Projeto</h3>
                  <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider">Crie seu workspace</p>
                </div>
                <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-left hover:border-[var(--accent)]/50 transition-all group">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search size={20} className="text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Localizar</h3>
                  <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider">Busque em tudo</p>
                </div>
              </div>
              
              {initialProjects.length === 0 && (
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="mt-8 px-8 py-4 bg-[var(--accent)] text-[var(--background)] font-black uppercase text-xs rounded-2xl shadow-[0_10px_20px_var(--accent-30)] hover:scale-105 active:scale-95 transition-all tracking-widest"
                >
                  Começar Agora
                </button>
              )}
            </div>
          </div>
          </>
        )}
      </main>

      {/* DETALHE DA TAREFA (OVERLAY) */}
      {selectedTaskForDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-10">
          <div className="absolute inset-0 bg-[var(--backdrop,black)]/85 backdrop-blur-md" onClick={() => setSelectedTaskForDetail(null)} />
          <div className="relative w-full max-w-4xl max-h-full bg-[var(--surface)] border border-[var(--border)] rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden scale-in-center">
            <header className="h-16 lg:h-20 border-b border-[var(--border)] px-4 lg:px-8 flex items-center justify-between flex-shrink-0 bg-[var(--sidebar)]">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedTaskForDetail(null)}
                  className="p-2 -ml-2 text-[#888] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-full transition-all"
                >
                  <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Detalhes da Tarefa</h2>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <button onClick={() => openEditTask(selectedTaskForDetail)} className="p-2 lg:px-4 lg:py-2 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-sm font-bold rounded-lg border border-[var(--border)] flex items-center gap-2 text-[#888] hover:text-[var(--foreground)]">
                  <Edit2 size={14} /> <span className="hidden sm:inline">Editar Tarefa</span>
                </button>
                <button
                  onClick={() => { handleToggleTask(selectedTaskForDetail); setSelectedTaskForDetail(null); }}
                  className={cn(
                    "px-3 lg:px-4 lg:py-2 text-xs lg:text-sm font-bold rounded-lg flex items-center gap-2",
                    selectedTaskForDetail.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--accent)] text-[var(--background)]"
                  )}
                >
                  <CheckCircle2 size={16} /> <span className="hidden sm:inline">{selectedTaskForDetail.status === "completed" ? "Reabrir" : "Concluir"}</span>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="max-w-3xl mx-auto space-y-10">
                {/* Cabeçalho da Tarefa no Detalhe */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    {selectedTaskForDetail.tags.map(tag => {
                      const tagColor = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-[10px] font-black rounded-full uppercase border"
                          style={{
                            backgroundColor: `${tagColor}15`,
                            color: tagColor,
                            borderColor: `${tagColor}30`
                          }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-2xl font-bold text-[var(--foreground)] leading-tight mb-3">
                    {renderContent(selectedTaskForDetail.title, selectedTaskForDetail.attachments)}
                  </div>
                  {selectedTaskForDetail.description && (
                    <div className="mb-6 p-5 bg-[var(--background)]/40 rounded-2xl border border-[var(--border)] shadow-lg">
                      <p className="text-sm text-[var(--foreground)] leading-relaxed font-semibold italic opacity-70">
                        {selectedTaskForDetail.description}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-[#555] font-bold uppercase tracking-wider">Criada em {new Date(selectedTaskForDetail.createdAt).toLocaleString()}</p>
                </section>

                <div className="h-px bg-[var(--border)]" />

                {/* Histórico de Andamentos */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#888] uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={16} className="text-[var(--accent)]" /> Andamentos ({selectedTaskForDetail.logs.length})
                    </h3>
                    <button
                      onClick={() => setIsAddingLog(!isAddingLog)}
                      className={cn(
                        "px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-2 active:scale-95 shadow-lg border",
                        isAddingLog 
                          ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20" 
                          : "bg-[var(--accent)] border-[var(--accent)] text-[var(--background)] hover:opacity-90"
                      )}
                    >
                      {isAddingLog ? <X size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                      {isAddingLog ? "Cancelar" : "Registrar Andamento"}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedTaskForDetail.logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-md group hover:border-[var(--accent)]/30 transition-all relative overflow-hidden"
                      >
                        {/* Background glow sutil para o log */}
                        <div
                          className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none"
                          style={{ background: `radial-gradient(circle at top right, ${selectedProject?.color}, transparent)` }}
                        />
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {log.type === "blocker" && (
                              <div
                                className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider"
                                style={{
                                  backgroundColor: "#ef444420",
                                  color: "#ef4444"
                                }}
                              >
                                Bloqueio ⚠️
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-[#888]">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => { setEditingLogId(log.id); setEditingLogContent(log.content); }}
                              className="p-1 text-[#555] hover:text-blue-400 transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1 text-[#555] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {editingLogId === log.id ? (
                          <div className="space-y-3">
                            <textarea
                              autoFocus
                              className="w-full bg-[var(--background)] border border-[var(--accent)]/50 rounded-lg p-3 text-sm text-[var(--foreground)] focus:outline-none min-h-[100px]"
                              value={editingLogContent}
                              onChange={(e) => setEditingLogContent(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingLogId(null)} className="px-3 py-1 text-[10px] font-bold uppercase text-[#555] hover:text-[var(--foreground)] transition-colors">Cancelar</button>
                              <button onClick={() => handleUpdateLog(log.id)} className="px-3 py-1 text-[10px] font-bold uppercase bg-[var(--accent)] text-[var(--background)] rounded-md hover:bg-[var(--accent)] transition-colors">Salvar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[var(--foreground)] brightness-110">
                            {renderContent(log.content, log.attachments)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
            {isAddingLog && (
              <footer className="p-6 bg-[var(--sidebar)] border-t border-[var(--border)] animate-in slide-in-from-bottom duration-300">
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Preview de Imagens em Tempo Real */}
                  {tempLogAttachments.length > 0 && (
                    <div id="log-preview">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest text-glow">Anexos ({tempLogAttachments.length})</p>
                        <button onClick={() => setTempLogAttachments([])} className="text-[10px] text-[#555] hover:text-[var(--foreground)] transition-colors uppercase font-bold">Limpar tudo</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tempLogAttachments.map((url, i) => {
                          const isImg = isImage(url);
                          return (
                            <div key={i} className="relative group">
                              {isImg ? (
                                <img src={url} className="w-16 h-16 object-cover rounded-lg border border-[#333] hover:border-[var(--accent)]/50 transition-all" />
                              ) : (
                                <div className="w-16 h-16 bg-[var(--surface)] flex flex-col items-center justify-center rounded-lg border border-[#333] hover:border-[var(--accent)]/50 transition-all text-[var(--accent)]">
                                  {getFileIcon(url)}
                                  <span className="text-[8px] font-black">{url.split('.').pop()?.split('?')[0].toUpperCase()}</span>
                                </div>
                              )}
                              <button
                                onClick={() => setTempLogAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">Novo Andamento</p>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase rounded-lg border border-[var(--accent)]/30 cursor-pointer transition-all active:scale-95 shadow-sm">
                          <Plus size={14} /> Anexar Arquivo
                          <input
                            type="file"
                            accept="image/*,application/pdf,text/xml,text/html,text/csv,text/plain"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, (url) => setTempLogAttachments(prev => [...prev, url]))}
                          />
                        </label>
                        <button 
                          onClick={() => setIsAddingLog(false)}
                          className="p-1.5 text-[#555] hover:text-[var(--foreground)] transition-colors"
                          title="Fechar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="relative group">
                      <textarea
                        autoFocus
                        placeholder="Descreva o andamento... Cole prints (Ctrl+V) 📋"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const content = e.currentTarget.value;
                            const target = e.currentTarget;
                            if (!content && tempLogAttachments.length === 0) return;

                            startTransition(async () => {
                              await createLog(selectedTaskForDetail.id, content, "note", tempLogAttachments);
                              target.value = "";
                              setTempLogAttachments([]);
                              setIsAddingLog(false);
                            });
                          }
                        }}
                        onPaste={(e) => {
                          handlePaste(e, (url) => {
                            setTempLogAttachments(prev => [...prev, url]);
                          });
                        }}
                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-5 py-4 text-[15px] text-[var(--foreground)] placeholder-[#444] focus:outline-none focus:border-[var(--accent)] transition-all resize-none min-h-[120px]"
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] font-bold text-[#444] uppercase pointer-events-none group-hover:text-[#666] transition-all">
                        Pressione ENTER para registrar o andamento
                      </div>
                    </div>
                </div>
              </footer>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {(isProjectModalOpen || editingProject) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop,rgba(0,0,0,0.6))] backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-2xl p-8 shadow-2xl scale-in-center">
            <h2 className="text-2xl font-bold mb-6">{editingProject ? "Editar Projeto" : "Novo Projeto"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Nome do Projeto</label>
                <input
                  autoFocus
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)]"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
                  className="flex-1 py-3 bg-[#222222] hover:bg-[#333333] rounded-xl transition-all"
                >Cancelar</button>
                <button
                  onClick={editingProject ? handleUpdateProject : handleCreateProject}
                  disabled={isPending}
                  className="flex-1 py-3 bg-[var(--accent)] hover:bg-[var(--accent)] rounded-xl transition-all font-bold disabled:opacity-50"
                >{editingProject ? "Salvar" : "Criar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop,rgba(0,0,0,0.6))] backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[#888]">Título da Tarefa</label>
                  <label className="flex items-center gap-1.5 px-3 py-1 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase rounded-lg border border-[var(--accent)]/30 cursor-pointer transition-all active:scale-95 shadow-sm">
                    <Plus size={14} /> Anexar Arquivo
                    <input
                      type="file"
                      accept="image/*,application/pdf,text/xml,text/html,text/csv,text/plain"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, (url) => setTempTaskAttachments(prev => [...prev, url]))}
                    />
                  </label>
                </div>
                {tempTaskAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tempTaskAttachments.map((url, i) => {
                      const isImg = isImage(url);
                      return (
                        <div key={i} className="relative group">
                          {isImg ? (
                            <img src={url} className="w-14 h-14 object-cover rounded-xl border border-[#333] hover:border-[var(--accent)] transition-all" />
                          ) : (
                            <div className="w-14 h-14 bg-[var(--sidebar)] flex flex-col items-center justify-center rounded-xl border border-[#333] hover:border-[var(--accent)] transition-all text-[var(--accent)]">
                              {getFileIcon(url)}
                              <span className="text-[8px] font-black">{url.split('.').pop()?.split('?')[0].toUpperCase()}</span>
                            </div>
                          )}
                          <button onClick={() => setTempTaskAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <textarea
                  autoFocus
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--accent)] resize-none min-h-[80px] transition-all"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onPaste={(e) => {
                    handlePaste(e, (url) => {
                      setTempTaskAttachments(prev => [...prev, url]);
                    });
                  }}
                  placeholder="Título da tarefa..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Descrição (opcional)</label>
                <textarea
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)] resize-none min-h-[60px] text-sm"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Mais detalhes sobre o que precisa ser feito..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Tags (separadas por vírgula)</label>
                <input
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)]"
                  placeholder="ex: design, backend, urgente"
                  value={newTaskTags}
                  onChange={(e) => setNewTaskTags(e.target.value)}
                  list="tag-suggestions"
                />
                <datalist id="tag-suggestions">
                  {allUniqueTags.map(tag => <option key={tag} value={tag} />)}
                </datalist>
                <p className="text-[10px] text-[#555] mt-2">Sugestões: {allUniqueTags.join(", ")}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); }} className="flex-1 py-3 bg-[#222222] hover:bg-[#333333] rounded-xl transition-all">Cancelar</button>
                <button onClick={handleCreateTask} disabled={isPending} className="flex-1 py-3 bg-[var(--accent)] hover:bg-[var(--accent)] rounded-xl transition-all font-bold disabled:opacity-50">
                  {editingTask ? "Salvar Alterações" : "Criar Tarefa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE NOVA NOTA */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop,rgba(0,0,0,0.6))] backdrop-blur-sm p-4">
          <div className="bg-[#fef9c3] p-10 shadow-[20px_20px_60px_rgba(0,0,0,0.5)] relative -rotate-1 w-full max-w-xl border-t-[40px] border-amber-200/50 scale-in-center">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-12 bg-white/40 backdrop-blur-sm -rotate-2 border border-white/20 shadow-sm z-10" />
            <button
              onClick={() => setIsNoteModalOpen(false)}
              className="absolute top-2 right-4 text-amber-900/20 hover:text-amber-900 transition-all p-1"
            >
              <X size={20} />
            </button>
            <textarea
              autoFocus
              placeholder="Descreva sua ideia ou nota aqui..."
              className="w-full bg-transparent border-none outline-none text-[20px] text-amber-950 placeholder-amber-900/10 resize-none min-h-[250px] font-bold leading-relaxed"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleCreateNote();
                  setIsNoteModalOpen(false);
                }
              }}
            />
            <div className="flex justify-between items-center mt-8 pt-8 border-t border-amber-950/5">
              <span className="text-[11px] text-amber-900/30 font-black uppercase tracking-widest">Ctrl + Enter para fixar</span>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-6 py-3 text-amber-900/40 hover:text-amber-900 text-[11px] font-black uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { handleCreateNote(); setIsNoteModalOpen(false); }}
                  disabled={!newNoteContent || isPending}
                  className="px-8 py-3 bg-amber-950 hover:bg-black disabled:opacity-30 text-[#fef9c3] text-[11px] font-black uppercase rounded shadow-2xl active:scale-95 transition-all"
                >
                  Pregar Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX / MODAL DE IMAGEM */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-6 right-6 text-[var(--foreground)]/50 hover:text-[var(--foreground)] p-2 bg-[var(--surface)]/20 rounded-full transition-all">
            <X size={32} />
          </button>
          <img
            src={previewImage}
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg scale-in-center"
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
