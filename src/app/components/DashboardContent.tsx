"use client";

import React, { useState, useTransition, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle2, Circle, Filter, Plus, LogOut,
  Trash2, Edit2, X, MessageSquare,
  ChevronUp, ChevronDown, Menu, Sun, Moon, Search, List, LayoutGrid,
  FileText, FileCode, File, Download, Send, MoreVertical,
  Settings, KeyRound, Eye, EyeOff, AlertCircle
} from "lucide-react";

import { logout, changePassword } from "../actions/auth";
import { createProject, updateProject, deleteProject, reorderProjects } from "../actions/projects";
import {
  createTask, createLog, updateTaskStatus,
  deleteTask, updateTask, updateLog, deleteLog
} from "../actions/tasks";
import { updateTagColor, deleteTag } from "../actions/tags";
import { createNote, updateNote, deleteNote } from "../actions/notes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { uploadAttachment } from "@/lib/supabase";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import DevLogLogo from "./DevLogLogo";
import {
  animateNoteEntrance,
  animateTaskEntrance,
  animateItemUpdate,
  animateItemExit,
  animateLogEntrance,
  animateTaskToggle,
  animateModalCompleteExit
} from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
  gsap.config({ nullTargetWarn: false });
}

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
  initialNotes: Note[],
  tagConfigs: { name: string, color: string }[],
  currentProjectId?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = currentProjectId;

  // Estados principais
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAddingLog, setIsAddingLog] = useState(false);

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
  const [mobileTab, setMobileTab] = useState<'tasks' | 'notes'>('tasks');
  const [mobileProjectMenuId, setMobileProjectMenuId] = useState<string | null>(null);

  const [newLogContent, setNewLogContent] = useState("");
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogContent, setEditingLogContent] = useState("");

  // Mapeamento de cores personalizadas (normalizado em maiúsculas)
  const [customTagColors, setCustomTagColors] = useState<Record<string, string>>(
    Object.fromEntries(tagConfigs.map(c => [c.name.trim().toUpperCase(), c.color]))
  );

  const getTagColor = (tag: string) => {
    const normalized = tag.trim().toUpperCase();
    return customTagColors[normalized] || generateFallbackColor(normalized);
  };

  // Estados de Notas
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [notesList, setNotesList] = useState<Note[]>(initialNotes);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
  const [dragOverNoteIndex, setDragOverNoteIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isPending, startTransition] = useTransition();

  // Sincroniza e ordena as notas com base no localStorage do projeto
  useEffect(() => {
    if (!selectedProjectId) {
      setNotesList(initialNotes);
      return;
    }
    const savedOrderJson = localStorage.getItem(`devlog_notes_order_${selectedProjectId}`);
    if (savedOrderJson) {
      try {
        const savedOrder: string[] = JSON.parse(savedOrderJson);
        const map = new Map(initialNotes.map(n => [n.id, n]));
        const ordered: Note[] = [];
        for (const id of savedOrder) {
          const item = map.get(id);
          if (item) {
            ordered.push(item);
            map.delete(id);
          }
        }
        const remaining = Array.from(map.values());
        setNotesList([...remaining, ...ordered]);
        return;
      } catch (e) {
        console.error("Erro ao sincronizar ordem das notas:", e);
      }
    }
    setNotesList(initialNotes);
  }, [initialNotes, selectedProjectId]);

  const handleNoteDragStart = (e: React.DragEvent, index: number) => {
    setDraggedNoteIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleNoteDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverNoteIndex !== index) {
      setDragOverNoteIndex(index);
    }
  };

  const handleNoteDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedNoteIndex === null || draggedNoteIndex === targetIndex) {
      setDraggedNoteIndex(null);
      setDragOverNoteIndex(null);
      return;
    }

    const updated = [...notesList];
    const [movedItem] = updated.splice(draggedNoteIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setNotesList(updated);
    setDraggedNoteIndex(null);
    setDragOverNoteIndex(null);

    if (selectedProjectId) {
      localStorage.setItem(
        `devlog_notes_order_${selectedProjectId}`,
        JSON.stringify(updated.map(n => n.id))
      );
    }
  };

  const handleNoteDragEnd = () => {
    setDraggedNoteIndex(null);
    setDragOverNoteIndex(null);
  };

  // Referências DOM e Animações GSAP (com useGSAP para ciclo de vida seguro e sem memory leaks)
  const welcomeRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // GSAP: Animação de Entrada do Hero / Tela de Boas-Vindas (sem projeto selecionado)
  useGSAP(() => {
    if (!welcomeRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".welcome-badge", {
      scale: 0.75,
      autoAlpha: 0,
      duration: 0.65,
      ease: "back.out(1.7)",
      clearProps: "transform,opacity,visibility"
    })
    .from(".welcome-text", {
      y: 18,
      autoAlpha: 0,
      duration: 0.55,
      clearProps: "transform,opacity,visibility"
    }, "-=0.3")
    .from(".welcome-card", {
      y: 22,
      autoAlpha: 0,
      stagger: 0.1,
      duration: 0.45,
      clearProps: "transform,opacity,visibility"
    }, "-=0.2");

    const welcomeCta = welcomeRef.current.querySelector(".welcome-cta");
    if (welcomeCta) {
      tl.from(welcomeCta, {
        scale: 0.9,
        autoAlpha: 0,
        duration: 0.45,
        ease: "back.out(1.5)",
        clearProps: "transform,opacity,visibility"
      }, "-=0.1");
    }
  }, { scope: welcomeRef, dependencies: [selectedProjectId] });

  // GSAP: Animação do Header, Tags e Barra de Abas (com projeto selecionado)
  useGSAP(() => {
    if (!headerRef.current || !selectedProjectId) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.from(".header-top-info", {
      x: -16,
      autoAlpha: 0,
      duration: 0.4,
      clearProps: "transform,opacity,visibility"
    })
    .from(".header-top-controls", {
      x: 16,
      autoAlpha: 0,
      duration: 0.4,
      clearProps: "transform,opacity,visibility"
    }, "<");

    const tagPills = headerRef.current.querySelectorAll(".header-tag-pill");
    if (tagPills.length > 0) {
      tl.from(tagPills, {
        y: 8,
        autoAlpha: 0,
        stagger: 0.03,
        duration: 0.3,
        clearProps: "transform,opacity,visibility"
      }, "-=0.15");
    }

    const statusTabs = headerRef.current.querySelectorAll(".header-status-tabs");
    if (statusTabs.length > 0) {
      tl.from(statusTabs, {
        y: 6,
        autoAlpha: 0,
        duration: 0.3,
        clearProps: "transform,opacity,visibility"
      }, "-=0.15");
    }
  }, { scope: headerRef, dependencies: [selectedProjectId] });

  // GSAP: Animação suave e com stagger dos Cards de Tarefas e Post-its ao trocar filtros ou projeto
  useGSAP(() => {
    if (!boardRef.current || !selectedProjectId) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const taskCards = boardRef.current.querySelectorAll(".task-card-item");
    if (taskCards.length > 0) {
      gsap.from(taskCards, {
        y: 12,
        autoAlpha: 0,
        stagger: 0.035,
        duration: 0.35,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility"
      });
    }

    const noteCards = boardRef.current.querySelectorAll(".note-card-item");
    if (noteCards.length > 0) {
      gsap.from(noteCards, {
        scale: 0.96,
        autoAlpha: 0,
        stagger: 0.045,
        duration: 0.35,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility"
      });
    }
  }, { scope: boardRef, dependencies: [selectedProjectId, statusFilter, selectedTag] });

  // Estados de Configurações e Troca de Senha
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Derivado reativo da tarefa selecionada (evita cascading renders de useEffect)
  const selectedTaskForDetail = useMemo(() => {
    if (!selectedTaskId) return null;
    return initialTasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, initialTasks]);

  // Fechar janelas com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTaskId(null);
        setIsAddingLog(false);
        setIsProjectModalOpen(false);
        setIsTaskModalOpen(false);
        setIsNoteModalOpen(false);
        setIsSettingsModalOpen(false);
        setEditingProject(null);
        setEditingTask(null);
        setEditingNoteId(null);
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    setIsChangingPassword(true);

    try {
      const res = await changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setSettingsSuccess(res.message || "Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setSettingsError(res.error || "Erro ao alterar a senha.");
      }
    } catch (err: any) {
      setSettingsError("Erro de comunicação ao atualizar a senha.");
    } finally {
      setIsChangingPassword(false);
    }
  };


  // Persistência de Tema e Visualização
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const savedViewMode = localStorage.getItem('viewMode') as 'card' | 'list' | null;

    if (savedTheme || savedViewMode) {
      startTransition(() => {
        if (savedTheme) {
          setTheme(savedTheme);
          document.documentElement.classList.toggle('theme-light', savedTheme === 'light');
        }
        if (savedViewMode) {
          setViewMode(savedViewMode);
        }
      });
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

  // Rastreia e anima notas recém-criadas com a física expressiva do post-it
  const prevNoteIdsRef = useRef<Set<string>>(new Set(initialNotes.map(n => n.id)));
  useEffect(() => {
    const currentIds = new Set(initialNotes.map(n => n.id));
    const newNote = initialNotes.find(n => !prevNoteIdsRef.current.has(n.id));
    if (newNote) {
      setTimeout(() => {
        const el = document.getElementById(`note-card-${newNote.id}`);
        if (el) animateNoteEntrance(el);
      }, 80);
    }
    prevNoteIdsRef.current = currentIds;
  }, [initialNotes]);

  const handleCreateNote = () => {
    if (!newNoteContent || !selectedProjectId) return;
    const content = newNoteContent;
    startTransition(async () => {
      await createNote(selectedProjectId, content);
      setNewNoteContent("");
      setIsNoteModalOpen(false);
    });
  };

  const handleUpdateNote = (id: string) => {
    if (!editingNoteContent) return;
    const content = editingNoteContent;
    startTransition(async () => {
      await updateNote(id, content);
      setEditingNoteId(null);
      setEditingNoteContent("");
      setTimeout(() => {
        const el = document.getElementById(`note-card-${id}`);
        if (el) animateItemUpdate(el, '#f59e0b');
      }, 50);
    });
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm("Excluir esta nota?")) return;
    const el = document.getElementById(`note-card-${id}`);
    if (el) {
      animateItemExit(el, () => {
        startTransition(async () => {
          await deleteNote(id);
        });
      });
    } else {
      startTransition(async () => {
        await deleteNote(id);
      });
    }
  };
  const handleTagColorChange = (tag: string, color: string) => {
    const normalized = tag.trim().toUpperCase();
    setCustomTagColors(prev => ({ ...prev, [normalized]: color }));
  };

  const saveTagColorChange = (tag: string, color: string) => {
    const normalized = tag.trim().toUpperCase();
    startTransition(async () => {
      await updateTagColor(normalized, color);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  const selectedProject = initialProjects.find(p => p.id === selectedProjectId);
  const activeAccentColor = theme === 'light' 
    ? '#ea580c' 
    : (selectedProject?.color || '#3b82f6');

  // Todas as tags únicas do projeto (padronizadas em maiúsculas e sem duplicatas, para sugestões no modal)
  const allUniqueTags = useMemo(() => {
    return Array.from(
      new Set(initialTasks.flatMap(t => t.tags.map(tag => tag.trim().toUpperCase())))
    ).filter(Boolean).sort();
  }, [initialTasks]);

  // Tarefas no status atualmente selecionado
  const currentStatusTasks = useMemo(() => {
    return initialTasks.filter(t => t.status === statusFilter);
  }, [initialTasks, statusFilter]);

  // Tags contextuais ao status ativo com contagem de tarefas vinculadas
  const contextualTagsWithCount = useMemo(() => {
    const counts = new Map<string, number>();
    currentStatusTasks.forEach(t => {
      t.tags.forEach(tag => {
        const norm = tag.trim().toUpperCase();
        if (norm) {
          counts.set(norm, (counts.get(norm) || 0) + 1);
        }
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentStatusTasks]);

  // Auto-reset da tag selecionada caso não haja tarefas com ela no status ativo
  useEffect(() => {
    if (selectedTag) {
      const existsInCurrentStatus = contextualTagsWithCount.some(
        t => t.name.toUpperCase() === selectedTag.toUpperCase()
      );
      if (!existsInCurrentStatus) {
        setSelectedTag(null);
      }
    }
  }, [contextualTagsWithCount, selectedTag]);

  const handleDeleteTag = (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedProjectId) return;
    if (!confirm(`Deseja remover a tag "${tagName}" de todas as tarefas deste projeto?`)) return;
    startTransition(async () => {
      await deleteTag(selectedProjectId, tagName);
      if (selectedTag === tagName) {
        setSelectedTag(null);
      }
    });
  };


  const isSearching = searchQuery.trim().length > 0;

  // Busca em todas as tarefas (em andamento e concluídas) quando há pesquisa ativa
  const searchMatchingTasks = useMemo(() => {
    if (!isSearching) return [];
    const query = searchQuery.toLowerCase().trim();
    return initialTasks.filter(t => {
      const matchesTag = !selectedTag || t.tags.some(tag => tag.trim().toUpperCase() === selectedTag.trim().toUpperCase());
      const matchesQuery = 
        t.title.toLowerCase().includes(query) ||
        (t.description || "").toLowerCase().includes(query) ||
        t.logs.some(l => l.content.toLowerCase().includes(query)) ||
        t.tags.some(tag => tag.toLowerCase().includes(query));

      return matchesTag && matchesQuery;
    });
  }, [initialTasks, searchQuery, isSearching, selectedTag]);

  // Separação das tarefas pesquisadas em categorias: "Tarefas em andamento" e "Tarefas Concluídas"
  const inProgressSearchTasks = useMemo(() => {
    return searchMatchingTasks.filter(t => t.status !== "completed");
  }, [searchMatchingTasks]);

  const completedSearchTasks = useMemo(() => {
    return searchMatchingTasks.filter(t => t.status === "completed");
  }, [searchMatchingTasks]);

  // Tarefas normais quando não está em modo de pesquisa (filtradas por tag e status ativo)
  const normalTasks = useMemo(() => {
    return initialTasks.filter(t => {
      const matchesTag = !selectedTag || t.tags.some(tag => tag.trim().toUpperCase() === selectedTag.trim().toUpperCase());
      const matchesStatus = t.status === statusFilter;
      return matchesTag && matchesStatus;
    });
  }, [initialTasks, selectedTag, statusFilter]);

  const tasks = isSearching ? searchMatchingTasks : normalTasks;

  const handleSelectProject = (id: string) => {
    startTransition(() => {
      // Resetar filtros ao trocar de projeto
      setSelectedTag(null);
      setStatusFilter("pending");
      setSelectedTaskId(null);
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

  // Rastreia e anima tarefas recém-criadas com expansão e luz
  const prevTaskIdsRef = useRef<Set<string>>(new Set(initialTasks.map(t => t.id)));
  useEffect(() => {
    const currentIds = new Set(initialTasks.map(t => t.id));
    const newTask = initialTasks.find(t => !prevTaskIdsRef.current.has(t.id));
    if (newTask) {
      setTimeout(() => {
        const el = document.getElementById(`task-card-${newTask.id}`);
        if (el) animateTaskEntrance(el, activeAccentColor);
      }, 80);
    }
    prevTaskIdsRef.current = currentIds;
  }, [initialTasks, activeAccentColor]);

  // Rastreia e anima andamentos (logs) recém-adicionados na timeline
  const prevLogIdsRef = useRef<Set<string>>(
    new Set(selectedTaskForDetail?.logs.map(l => l.id) || [])
  );
  useEffect(() => {
    if (selectedTaskForDetail) {
      const currentIds = new Set(selectedTaskForDetail.logs.map(l => l.id));
      const newLog = selectedTaskForDetail.logs.find(l => !prevLogIdsRef.current.has(l.id));
      if (newLog) {
        setTimeout(() => {
          const el = document.getElementById(`log-item-${newLog.id}`);
          if (el) animateLogEntrance(el, activeAccentColor);
        }, 80);
      }
      prevLogIdsRef.current = currentIds;
    }
  }, [selectedTaskForDetail?.logs, activeAccentColor]);

  const handleCreateTask = () => {
    if (!newTaskTitle || !selectedProjectId) return;
    startTransition(async () => {
      const parsedTags = Array.from(
        new Set(
          newTaskTags
            .split(",")
            .map(t => t.trim().toUpperCase())
            .filter(Boolean)
        )
      );

      if (editingTask) {
        const taskId = editingTask.id;
        await updateTask(taskId, newTaskTitle, newTaskDescription, parsedTags);
        setTimeout(() => {
          const el = document.getElementById(`task-card-${taskId}`);
          if (el) animateItemUpdate(el, activeAccentColor);
        }, 100);
      } else {
        await createTask(selectedProjectId, newTaskTitle, newTaskDescription, parsedTags, tempTaskAttachments);
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
    const el = document.getElementById(`task-card-${id}`);
    if (el) {
      animateItemExit(el, () => {
        startTransition(async () => {
          await deleteTask(id);
        });
      });
    } else {
      startTransition(async () => {
        await deleteTask(id);
      });
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || "");
    setNewTaskTags(task.tags.map(t => t.toUpperCase()).join(", "));
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

  const handleCreateLog = () => {
    if (!newLogContent.trim() && tempLogAttachments.length === 0) return;
    if (!selectedTaskForDetail) return;
    startTransition(async () => {
      await createLog(selectedTaskForDetail.id, newLogContent, "note", tempLogAttachments);
      setNewLogContent("");
      setTempLogAttachments([]);
      setIsAddingLog(false);
    });
  };

  const handleToggleTask = (task: Task, e?: React.MouseEvent, closeDetailModal: boolean = false) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const buttonEl = (e?.currentTarget as HTMLElement) || document.getElementById(`toggle-btn-${task.id}`);
    const cardEl = document.getElementById(`task-card-${task.id}`);

    if (closeDetailModal) {
      const modalEl = document.getElementById("task-detail-modal");
      const backdropEl = document.getElementById("task-detail-backdrop");
      animateModalCompleteExit(modalEl, backdropEl, newStatus === "completed", () => {
        setSelectedTaskId(null);
        startTransition(async () => {
          await updateTaskStatus(task.id, newStatus);
        });
      }, buttonEl);
      return;
    }

    animateTaskToggle(cardEl, buttonEl, newStatus === "completed", () => {
      startTransition(async () => {
        await updateTaskStatus(task.id, newStatus);
      });
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

  const renderTaskCard = (task: Task) => {
    const lastLog = task.logs[task.logs.length - 1];
    const logCount = task.logs.length;

    return (
      <div
        key={task.id}
        id={`task-card-${task.id}`}
        onClick={() => setSelectedTaskId(task.id)}
        className={cn(
          "task-card-item bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg transition-all duration-300 group cursor-pointer hover:bg-[var(--surface-hover)] relative w-full min-w-0",
          task.status === "completed" ? "opacity-60" : "",
          viewMode === 'list' ? "p-3" : "p-3.5 sm:p-4"
        )}
        style={{
          borderLeft: `3px solid ${task.status === 'completed' ? '#444' : (theme === 'light' ? 'var(--accent)' : selectedProject?.color || 'var(--accent)')}`,
        }}
      >
        {/* Efeito de brilho no hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${theme === 'light' ? 'var(--accent)' : selectedProject?.color || 'var(--accent)'}, transparent 70%)` }}
        />
        <div className={cn("flex items-start w-full min-w-0", viewMode === 'list' ? "gap-2.5 sm:gap-3" : "gap-3 sm:gap-4")}>
          <button
            id={`toggle-btn-${task.id}`}
            onClick={(e) => { e.stopPropagation(); handleToggleTask(task, e); }}
            className={cn("flex-shrink-0 transition-colors", 
              viewMode === 'list' ? "mt-0.5" : "mt-1",
              task.status === "completed" ? "text-emerald-500" : "text-[#555] hover:text-[var(--accent)]"
            )}
          >
            {task.status === "completed" ? <CheckCircle2 size={viewMode === 'list' ? 18 : 20} /> : <Circle size={viewMode === 'list' ? 18 : 20} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 sm:gap-4 w-full min-w-0">
              <div className={cn(
                "flex-1 min-w-0 font-semibold leading-tight break-words [overflow-wrap:anywhere]", 
                task.status === "completed" ? "text-[#888] line-through" : "text-[var(--foreground)]",
                viewMode === 'list' ? "text-sm" : "text-base sm:text-lg mb-1"
              )}>
                {viewMode === 'list' ? task.title : renderContent(task.title, task.attachments)}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditTask(task); }} 
                  className="p-1.5 text-[#888] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20 bg-[var(--surface-hover)] sm:bg-[var(--background)] rounded-md transition-all"
                  title="Editar tarefa"
                >
                  <Edit2 size={13} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} 
                  className="p-1.5 text-[#888] hover:text-red-500 hover:bg-red-600/20 bg-[var(--surface-hover)] sm:bg-[var(--background)] rounded-md transition-all"
                  title="Excluir tarefa"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {viewMode === 'card' && task.description && (
              <p className="text-xs text-[var(--foreground)] opacity-70 line-clamp-2 leading-relaxed font-medium break-words [overflow-wrap:anywhere]">
                {task.description}
              </p>
            )}

            {viewMode === 'card' && lastLog && (
              <div className="mt-2 flex items-center gap-2 text-[#888] min-w-0">
                <MessageSquare size={12} className="flex-shrink-0" />
                <p className="text-xs truncate italic break-all">
                  {lastLog.content.replace(/!\[.*?\]\(.*?\)/g, "[Anexo]")}
                </p>
              </div>
            )}

            <div className={cn("flex items-center justify-between gap-2", viewMode === 'list' ? "mt-1.5" : "mt-3")}>
              <div className="flex items-center gap-1.5 overflow-hidden">
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
                        viewMode === 'list' ? "px-1.5 py-0 text-[8px]" : "px-2 py-0.5 text-[9px] sm:text-[10px]"
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
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span
                  className={cn(
                    "font-bold uppercase tracking-widest flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded border transition-all",
                    viewMode === 'list' 
                      ? "text-[9px] bg-[var(--surface-hover)] border-[var(--border)] shadow-sm" 
                      : "text-[9px] sm:text-[10px]"
                  )}
                  style={{ 
                    color: logCount > 0 ? (theme === 'light' ? 'var(--accent)' : (selectedProject?.color || 'var(--accent)')) : '#666',
                    borderColor: logCount > 0 ? (theme === 'light' ? 'var(--accent)40' : `${selectedProject?.color || 'var(--accent)'}40`) : 'transparent'
                  }}
                >
                  <MessageSquare size={10} /> {logCount}
                </span>
                <span className={cn(
                  "font-bold text-[var(--accent)] bg-[var(--accent)]/10 rounded border border-[var(--accent)]/20 shadow-sm",
                  viewMode === 'list' ? "px-1.5 py-0 text-[8px]" : "px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px]"
                )}>
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="flex h-[100dvh] w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden selection:bg-[var(--accent)]/30 transition-colors duration-300">
      {/* SIDEBAR - Mobile Responsive */}
      {/* Backdrop para Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 sm:w-80 bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col flex-shrink-0 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]" : "-translate-x-full"
      )}>
        <div className="p-5 sm:p-6 border-b border-[var(--border)]/50 flex justify-between items-center">
          <div>
          <button 
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("project");
              router.push(`/?${params.toString()}`);
            }}
            className="text-left hover:opacity-90 transition-opacity flex items-center gap-3 group"
          >
            <DevLogLogo size="md" />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--foreground)]">DevLog</h1>
              <p className="text-xs sm:text-sm text-[#888888] mt-0.5 font-medium">seus projetos em foco</p>
            </div>
          </button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-[#666] hover:text-[var(--foreground)]"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => {
                setSettingsError(null);
                setSettingsSuccess(null);
                setIsSettingsModalOpen(true);
              }}
              className="p-2 text-[#666666] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-md transition-all"
              title="Configurações e Segurança"
            >
              <Settings size={18} />
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
                <div
                  key={project.id}
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl transition-all mb-1 overflow-hidden",
                    selectedProjectId === project.id
                      ? "bg-[var(--surface-hover)] text-[var(--foreground)] shadow-lg"
                      : "text-[#888] hover:bg-[var(--surface-hover)]/40 hover:text-[var(--foreground)]"
                  )}
                  style={selectedProjectId === project.id ? { 
                    borderLeft: `3px solid ${theme === 'light' ? 'var(--accent)' : project.color}` 
                  } : {}}
                >
                  <button
                    type="button"
                    onClick={() => { handleSelectProject(project.id); setIsSidebarOpen(false); }}
                    className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: theme === 'light' ? 'var(--accent)' : project.color,
                        boxShadow: theme === 'light'
                          ? (selectedProjectId === project.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none')
                          : (selectedProjectId === project.id ? `0 0 12px ${project.color}` : `0 0 4px ${project.color}40`)
                      }}
                    />
                    <span className="font-bold text-sm truncate tracking-tight">{project.name}</span>
                  </button>

                  <div className="flex items-center gap-1.5 pr-2.5 flex-shrink-0">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-lg transition-colors",
                      selectedProjectId === project.id ? "bg-white/10 text-[var(--foreground)]" : "bg-black/20 text-[#555]"
                    )}>
                      {project._count?.tasks || 0}
                    </span>
                    {/* Botão de menu mobile */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileProjectMenuId(mobileProjectMenuId === project.id ? null : project.id);
                      }}
                      className="lg:hidden p-1.5 text-[#666] hover:text-[var(--foreground)] rounded-lg hover:bg-white/5 transition-colors"
                      title="Opções do projeto"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  <div className={cn(
                    "items-center gap-1 bg-[var(--surface)] p-1 rounded-lg shadow-xl border border-[var(--border)] z-10",
                    mobileProjectMenuId === project.id
                      ? "flex absolute right-2 top-1/2 -translate-y-1/2"
                      : "hidden lg:group-hover:flex absolute right-2 top-1/2 -translate-y-1/2"
                  )}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveProject(project.id, 'up'); }} 
                      disabled={initialProjects.indexOf(project) === 0}
                      className="p-1 hover:text-[var(--accent)] disabled:opacity-20"
                      title="Mover para cima"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveProject(project.id, 'down'); }} 
                      disabled={initialProjects.indexOf(project) === initialProjects.length - 1}
                      className="p-1 hover:text-[var(--accent)] disabled:opacity-20"
                      title="Mover para baixo"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <div className="w-px h-3 bg-[var(--border)] mx-1" />
                    <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); setNewProjectName(project.name); setMobileProjectMenuId(null); }} className="p-1 hover:text-blue-400" title="Editar"><Edit2 size={12} /></button>
                    <button onClick={(e) => { setMobileProjectMenuId(null); handleDeleteProject(project.id, e); }} className="p-1 hover:text-red-400" title="Excluir"><Trash2 size={12} /></button>
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
      <main className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden bg-[var(--background)] transition-colors duration-300">
        {selectedProject ? (
          <>
            <header ref={headerRef} className="border-b border-[var(--border)] flex flex-col px-3 sm:px-4 lg:px-8 bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-40 w-full min-w-0 max-w-full">
              <div className="h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-2">
                <div className="header-top-info flex items-center gap-2 sm:gap-4 min-w-0">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 -ml-1 text-[#888] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-xl transition-all"
                    aria-label="Abrir menu de projetos"
                  >
                    <Menu size={22} />
                  </button>
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors"
                      style={{ backgroundColor: theme === 'light' ? 'var(--accent)' : (selectedProject?.color || 'var(--accent)') }}
                    />
                    <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-[var(--foreground)] tracking-tight truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
                      {selectedProject.name}
                    </h2>
                  </div>
                  {isPending ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full animate-pulse flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Salvando</span>
                    </div>
                  ) : (
                    <span className="hidden sm:inline-block px-2.5 py-0.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold rounded-full flex-shrink-0">
                      {selectedProject.status === 'active' ? 'ativo' : 'arquivado'}
                    </span>
                  )}
                </div>
                <div className="header-top-controls flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
                  <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-0.5 sm:p-1 shadow-sm">
                    <button
                      onClick={() => handleToggleViewMode('card')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        viewMode === 'card' ? "bg-[var(--accent)] text-[var(--background)] shadow-md" : "text-[#666] hover:text-[var(--foreground)]"
                      )}
                      title="Modo Card"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleViewMode('list')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-[var(--accent)] text-[var(--background)] shadow-md" : "text-[#666] hover:text-[var(--foreground)]"
                      )}
                      title="Modo Lista"
                    >
                      <List size={16} />
                    </button>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="p-2 sm:p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all shadow-sm active:scale-95"
                    title={theme === 'dark' ? "Mudar para tema claro" : "Mudar para tema escuro"}
                  >
                    {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-[var(--accent)]" />}
                  </button>
                  <button
                    onClick={() => {
                      setSettingsError(null);
                      setSettingsSuccess(null);
                      setIsSettingsModalOpen(true);
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all shadow-sm active:scale-95 group"
                    title="Configurações e Segurança"
                  >
                    <Settings size={17} className="text-[#888] group-hover:text-[var(--foreground)] group-hover:rotate-45 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Tag Filter Bar */}
              {contextualTagsWithCount.length > 0 && (
                <div className="pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x w-full min-w-0 max-w-full">
                  <Filter size={14} className="text-[#666] mr-1 flex-shrink-0" />
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold transition-all border flex-shrink-0 flex items-center gap-1.5",
                      !selectedTag ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--surface)] border-[var(--border)] text-[#666] hover:border-[#444]"
                    )}
                  >
                    <span>Todas</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                      !selectedTag ? "bg-[var(--accent)]/30 text-current" : "bg-black/10 dark:bg-white/10 text-[#777]"
                    )}>
                      {currentStatusTasks.length}
                    </span>
                  </button>
                  {contextualTagsWithCount.map(({ name: tag, count }) => {
                    const tagColor = getTagColor(tag);
                    return (
                      <div key={tag} className="header-tag-pill relative group flex-shrink-0">
                        <button
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold transition-all border whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5",
                            selectedTag === tag ? "" : "bg-[var(--surface)] border-[#333] text-[#888] hover:border-[#444]"
                          )}
                          style={selectedTag === tag ? {
                            backgroundColor: `${tagColor}20`,
                            borderColor: tagColor,
                            color: tagColor,
                            boxShadow: `0 0 10px ${tagColor}30`
                          } : {}}
                        >
                          <span>{tag}</span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                            selectedTag === tag ? "bg-white/20 text-current" : "bg-black/10 dark:bg-white/10 text-[#777]"
                          )}>
                            {count}
                          </span>
                        </button>

                        {/* Ações da Tag: Seletor de cor e Botão de Excluir */}
                        <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1 bg-[#1a1a1a] border border-white/20 rounded-full px-1.5 py-0.5 shadow-md">
                          <input
                            type="color"
                            className="w-3.5 h-3.5 rounded-full border border-white/20 bg-transparent cursor-pointer overflow-hidden p-0"
                            value={tagColor.startsWith('hsl') ? '#3b82f6' : tagColor}
                            onChange={(e) => handleTagColorChange(tag, e.target.value)}
                            onBlur={(e) => saveTagColorChange(tag, e.target.value)}
                            title="Mudar cor da tag"
                          />
                          <button
                            onClick={(e) => handleDeleteTag(tag, e)}
                            className="text-[#888] hover:text-red-400 p-0.5 transition-colors"
                            title={`Remover tag "${tag}" de todas as tarefas deste projeto`}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Status Tabs and Search */}
              <div className="header-status-tabs py-2.5 flex flex-col sm:flex-row sm:items-center justify-start gap-3 sm:gap-6 lg:gap-8 border-t border-[var(--border)]/40 w-full min-w-0">
                <div className="flex items-center gap-5 sm:gap-6 flex-shrink-0">
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={cn(
                      "pb-1 text-sm font-bold transition-all relative flex items-center gap-1.5",
                      statusFilter === "pending" ? "text-[var(--accent)]" : "text-[#666] hover:text-[#888]"
                    )}
                  >
                    <span>Pendentes</span>
                    <span className={cn(
                      "text-[10px] font-black px-1.5 py-0.5 rounded-md",
                      statusFilter === "pending" ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface)] text-[#666]"
                    )}>
                      {initialTasks.filter(t => t.status !== "completed").length}
                    </span>
                    {statusFilter === "pending" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />}
                  </button>
                  <button
                    onClick={() => setStatusFilter("completed")}
                    className={cn(
                      "pb-1 text-sm font-bold transition-all relative flex items-center gap-1.5",
                      statusFilter === "completed" ? "text-[var(--status-completed)]" : "text-[#666] hover:text-[#888]"
                    )}
                  >
                    <span>Concluídas</span>
                    <span className={cn(
                      "text-[10px] font-black px-1.5 py-0.5 rounded-md",
                      statusFilter === "completed" ? "bg-[var(--status-completed-bg)] text-[var(--status-completed)]" : "bg-[var(--surface)] text-[#666]"
                    )}>
                      {initialTasks.filter(t => t.status === "completed").length}
                    </span>
                    {statusFilter === "completed" && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--status-completed)]"
                        style={{
                          boxShadow: theme === 'dark' ? '0 0 10px var(--status-completed-glow)' : 'none'
                        }}
                      />
                    )}
                  </button>
                </div>

                {/* Busca - posicionada mais para a esquerda, logo ao lado das abas */}
                <div className="relative group w-full sm:w-72 lg:w-80 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#666] group-focus-within:text-[var(--accent)] transition-colors">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-[var(--sidebar)] border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#666] hover:text-[var(--foreground)]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* MOBILE VIEW SWITCHER (Visible only on screens < xl) */}
            <div className="xl:hidden px-3 sm:px-4 pt-3 pb-1 bg-[var(--background)] w-full min-w-0">
              <div className="flex items-center gap-1.5 p-1 bg-[var(--sidebar)] border border-[var(--border)] rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => setMobileTab('tasks')}
                  className={cn(
                    "flex-1 min-w-0 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                    mobileTab === 'tasks' 
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm border border-[var(--border)] font-black" 
                      : "text-[#777] hover:text-[var(--foreground)]"
                  )}
                >
                  <span className="truncate">Tarefas</span>
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0",
                    mobileTab === 'tasks' ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-black/20 text-[#666]"
                  )}>
                    {tasks.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('notes')}
                  className={cn(
                    "flex-1 min-w-0 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                    mobileTab === 'notes' 
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm border border-[var(--border)] font-black" 
                      : "text-[#777] hover:text-[var(--foreground)]"
                  )}
                >
                  <span className="truncate">Notas</span>
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0",
                    mobileTab === 'notes' ? "bg-amber-400/20 text-amber-400" : "bg-black/20 text-[#666]"
                  )}>
                    {notesList.length}
                  </span>
                </button>
              </div>
            </div>

            <div ref={boardRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-8 bg-[var(--background)] w-full min-w-0">
              <div className="max-w-[1700px] w-full min-w-0 mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-10 h-full">
                {/* COLUNA ESQUERDA: TAREFAS */}
                <div className={cn(
                  "flex-col h-full min-h-0 w-full min-w-0",
                  mobileTab === 'tasks' ? "flex" : "hidden xl:flex"
                )}>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pr-1 sm:pr-2 space-y-4 sm:space-y-6 pb-20 w-full min-w-0">
                    <div className="flex items-center justify-between mb-2 sm:mb-4 bg-[var(--sidebar)] p-3 sm:p-4 rounded-2xl border border-[var(--border)] w-full min-w-0 gap-2">
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[var(--accent)] truncate">Fluxo de Tarefas</h3>
                      <button
                        onClick={() => { setEditingTask(null); setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskTags(""); setIsTaskModalOpen(true); }}
                        className="px-3 py-2 sm:px-4 sm:py-2 text-[var(--background)] text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95 shadow-lg flex-shrink-0"
                        style={{
                          backgroundColor: theme === 'light' ? 'var(--accent)' : (selectedProject?.color || 'var(--accent)'),
                          boxShadow: `0 4px 12px ${theme === 'light' ? 'var(--accent)' : (selectedProject?.color || 'var(--accent)')}30`
                        }}
                      >
                        <Plus size={14} strokeWidth={3} /> Nova Tarefa
                      </button>
                    </div>
                    {isSearching ? (
                      /* MODO DE BUSCA ATIVA: CATEGORIAS SEPARADAS */
                      searchMatchingTasks.length === 0 ? (
                        <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                          <div className="w-12 h-12 rounded-full bg-[var(--border)]/50 flex items-center justify-center mx-auto mb-3 text-[#777]">
                            <Search size={20} />
                          </div>
                          <p className="text-sm font-bold text-[var(--foreground)]">Nenhuma tarefa encontrada</p>
                          <p className="text-xs text-[#888] mt-1">Nenhum resultado para "{searchQuery}".</p>
                          <button
                            onClick={() => setSearchQuery("")}
                            className="mt-4 px-4 py-1.5 text-xs font-bold bg-[var(--accent)] text-[var(--background)] rounded-xl hover:opacity-90 transition-opacity"
                          >
                            Limpar pesquisa
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                          {/* Categoria 1: Tarefas em andamento */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]/60">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">
                                  Tarefas em andamento
                                </h4>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)]">
                                  {inProgressSearchTasks.length}
                                </span>
                              </div>
                            </div>

                            {inProgressSearchTasks.length === 0 ? (
                              <div className="p-4 bg-[var(--surface)]/40 border border-dashed border-[var(--border)]/60 rounded-xl text-center text-xs text-[#777]">
                                Nenhuma tarefa em andamento encontrada.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3 sm:gap-4 w-full min-w-0">
                                {inProgressSearchTasks.map(task => renderTaskCard(task))}
                              </div>
                            )}
                          </div>

                          {/* Categoria 2: Tarefas Concluídas */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]/60">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--status-completed)]" />
                                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--status-completed)]">
                                  Tarefas Concluídas
                                </h4>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[var(--status-completed-bg)] text-[var(--status-completed)]">
                                  {completedSearchTasks.length}
                                </span>
                              </div>
                            </div>

                            {completedSearchTasks.length === 0 ? (
                              <div className="p-4 bg-[var(--surface)]/40 border border-dashed border-[var(--border)]/60 rounded-xl text-center text-xs text-[#777]">
                                Nenhuma tarefa concluída encontrada.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3 sm:gap-4 w-full min-w-0">
                                {completedSearchTasks.map(task => renderTaskCard(task))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      /* MODO NORMAL: LISTA POR STATUS ATIVO */
                      tasks.length === 0 ? (
                        <div className="text-center py-20 opacity-40 text-sm font-medium">Nenhuma tarefa encontrada neste filtro.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 w-full min-w-0">
                          {tasks.map(task => renderTaskCard(task))}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: NOTAS (BLOQUINHOS) */}
                <div className={cn(
                  "flex-col h-full min-h-0 w-full min-w-0 xl:border-l xl:border-[#1a1a1a] xl:pl-10",
                  mobileTab === 'notes' ? "flex" : "hidden xl:flex"
                )}>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pr-1 sm:pr-2 pb-20 w-full min-w-0">
                    <div className="flex items-center justify-between mb-4 sm:mb-6 bg-[var(--background)]/60 p-3 sm:p-4 rounded-2xl border border-[var(--border)] shadow-inner w-full min-w-0 gap-2">
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[var(--accent)] truncate">Notas do Projeto</h3>
                      <button
                        onClick={() => { setIsNoteModalOpen(true); setNewNoteContent(""); }}
                        className="px-3 py-2 sm:px-4 sm:py-2 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase rounded-lg border border-[var(--accent)]/30 transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95 flex-shrink-0"
                      >
                        <Plus size={14} /> Nova Nota
                      </button>
                    </div>

                    {/* Grid de Notas (Bloquinhos) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 p-1 sm:p-2">
                      {notesList.length === 0 ? (
                        <div className="col-span-full py-24 text-center opacity-20 flex flex-col items-center gap-4">
                          <Plus size={48} strokeWidth={1} />
                          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhuma nota</p>
                        </div>
                      ) : (
                        notesList.map((note, idx) => {
                          // Amarelos suaves e equilibrados de post-it clássico (confortáveis aos olhos)
                          const isNoteSoftYellow = idx % 2 === 0;
                          const noteBg = isNoteSoftYellow ? '#fef3c7' : '#fde68a';
                          const isBeingDragged = draggedNoteIndex === idx;
                          const isDragTarget = dragOverNoteIndex === idx;

                          return (
                            <div
                              key={note.id}
                              id={`note-card-${note.id}`}
                              draggable={!editingNoteId}
                              onDragStart={(e) => handleNoteDragStart(e, idx)}
                              onDragOver={(e) => handleNoteDragOver(e, idx)}
                              onDrop={(e) => handleNoteDrop(e, idx)}
                              onDragEnd={handleNoteDragEnd}
                              className={cn(
                                "note-card-item p-5 sm:p-7 relative transition-all duration-200 group flex flex-col rounded-sm cursor-grab active:cursor-grabbing select-none",
                                "shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),0_8px_10px_-6px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_36px_-6px_rgba(0,0,0,0.35)]",
                                "hover:-translate-y-1.5",
                                "border-t-[18px] sm:border-t-[22px] border-amber-200/60",
                                isBeingDragged ? "opacity-30 scale-95 ring-2 ring-amber-400" : "",
                                isDragTarget ? "ring-2 ring-amber-500 scale-[1.02]" : ""
                              )}
                              style={{
                                backgroundColor: noteBg,
                                minHeight: '210px'
                              }}
                            >
                              {/* Efeito de fita adesiva clássica e indicador de arraste */}
                              <div 
                                className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-5 sm:h-6 bg-white/45 backdrop-blur-[2px] border border-white/30 shadow-sm flex items-center justify-center pointer-events-none rounded-[1px]"
                                title="Arraste para trocar de posição"
                              >
                                <div className="w-6 h-1 border-y border-amber-950/25" />
                              </div>

                              {editingNoteId === note.id ? (
                                <div className="flex-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
                                  <textarea
                                    autoFocus
                                    className="flex-1 w-full bg-transparent border-none outline-none text-amber-950 text-[15px] font-bold resize-none leading-relaxed placeholder-amber-950/40"
                                    value={editingNoteContent}
                                    onChange={(e) => setEditingNoteContent(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-3 mt-4 sm:mt-6">
                                    <button onClick={() => setEditingNoteId(null)} className="text-[10px] font-black uppercase text-amber-900/50 hover:text-amber-900 transition-colors">Sair</button>
                                    <button onClick={() => handleUpdateNote(note.id)} className="px-4 py-2 bg-amber-950 text-[#fef3c7] text-[10px] font-black uppercase rounded shadow-xl hover:bg-black transition-all">Salvar</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-20" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }} className="p-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-amber-950 hover:text-amber-900 transition-colors" title="Editar nota"><Edit2 size={13} /></button>
                                    <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 bg-black/10 hover:bg-red-500/20 rounded-lg text-amber-950 hover:text-red-700 transition-colors" title="Excluir nota"><Trash2 size={13} /></button>
                                  </div>
                                  <div className="text-[15px] sm:text-[16px] text-amber-950 leading-relaxed whitespace-pre-wrap font-bold flex-1 pt-1 break-words">
                                    {note.content}
                                  </div>
                                  <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-amber-950/15 flex items-center justify-between text-amber-950/70">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                      {new Date(note.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-amber-500/80 shadow-sm" />
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
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
              <div className="ml-3 flex items-center gap-2.5">
                <DevLogLogo size="sm" />
                <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">DevLog</h1>
              </div>
            </header>
            <div ref={welcomeRef} className="flex-1 flex items-center justify-center bg-[var(--background)] p-4 sm:p-8">
            <div className="max-w-md w-full text-center space-y-6 sm:space-y-8">
              <div className="welcome-badge relative inline-block mb-4 sm:mb-6">
                <DevLogLogo size="xl" />
              </div>
              <div className="welcome-text">
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] mb-2 sm:mb-3 tracking-tight">DevLog</h2>
                <p className="text-xs sm:text-sm text-[#888] font-medium leading-relaxed">
                  Bem-vindo de volta! Selecione um projeto na barra lateral para gerenciar suas tarefas e notas, ou crie um novo workspace.
                </p>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <div 
                  onClick={() => setIsProjectModalOpen(true)}
                  className="welcome-card p-4 sm:p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-left hover:border-[var(--accent)]/50 transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Plus size={18} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-0.5 sm:mb-1">Novo Projeto</h3>
                  <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider">Crie seu workspace</p>
                </div>
                <div 
                  onClick={() => setIsSidebarOpen(true)}
                  className="welcome-card p-4 sm:p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-left hover:border-[var(--accent)]/50 transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Search size={18} className="text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-0.5 sm:mb-1">Ver Projetos</h3>
                  <p className="text-[10px] text-[#666] font-bold uppercase tracking-wider">Navegue no menu</p>
                </div>
              </div>
              
              {initialProjects.length === 0 && (
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="welcome-cta mt-6 sm:mt-8 px-6 sm:px-8 py-3.5 sm:py-4 bg-[var(--accent)] text-[var(--background)] font-black uppercase text-xs rounded-2xl shadow-[0_10px_20px_var(--accent-30)] hover:scale-105 active:scale-95 transition-all tracking-widest"
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
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-10">
          <div id="task-detail-backdrop" className="absolute inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-md transition-opacity" onClick={() => setSelectedTaskId(null)} />
          <div id="task-detail-modal" className="relative w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-[28px] sm:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden scale-in-center">
            <header className="h-14 sm:h-16 lg:h-20 border-b border-[var(--border)] px-3 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 bg-[var(--sidebar)]">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="p-1.5 sm:p-2 -ml-1 text-[#888] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-full transition-all"
                  title="Fechar"
                >
                  <X size={20} />
                </button>
                <h2 className="text-base sm:text-xl font-bold text-[var(--foreground)] truncate">Detalhes da Tarefa</h2>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
                <button 
                  onClick={() => openEditTask(selectedTaskForDetail)} 
                  className="p-2 sm:px-3 sm:py-2 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-xs sm:text-sm font-bold rounded-lg border border-[var(--border)] flex items-center gap-1.5 text-[#888] hover:text-[var(--foreground)] transition-all shadow-sm active:scale-95" 
                  title="Editar Tarefa"
                >
                  <Edit2 size={13} /> <span className="hidden sm:inline">Editar</span>
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Excluir esta tarefa?")) {
                      const modalEl = document.getElementById("task-detail-modal");
                      animateItemExit(modalEl, () => {
                        setSelectedTaskId(null);
                        startTransition(async () => {
                          await deleteTask(selectedTaskForDetail.id);
                        });
                      });
                    }
                  }} 
                  className={cn(
                    "p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-sm active:scale-95 group",
                    theme === 'light'
                      ? "bg-black/20 hover:bg-black/30 border-red-600/35 text-red-700 hover:text-red-800"
                      : "bg-red-950/40 hover:bg-red-950/60 border-red-500/40 text-red-400 hover:text-red-300"
                  )}
                  title="Excluir Tarefa"
                >
                  <Trash2 
                    size={14} 
                    className={cn(
                      "transition-colors",
                      theme === 'light' ? "text-red-700 group-hover:text-red-800" : "text-red-400 group-hover:text-red-300"
                    )} 
                  /> 
                  <span className="hidden sm:inline">Excluir</span>
                </button>
                <button
                  id={`modal-toggle-btn-${selectedTaskForDetail.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTask(selectedTaskForDetail, e, true);
                  }}
                  className={cn(
                    "px-2.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all",
                    selectedTaskForDetail.status === "completed" ? "bg-[var(--status-completed-bg)] text-[var(--status-completed)] border border-[var(--status-completed)]/30" : "bg-[var(--accent)] text-[var(--background)] shadow-md"
                  )}
                >
                  <CheckCircle2 size={15} /> <span className="hidden sm:inline">{selectedTaskForDetail.status === "completed" ? "Reabrir" : "Concluir"}</span>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6 sm:space-y-10">
                {/* Cabeçalho da Tarefa no Detalhe */}
                <section>
                  <div className="flex items-center gap-1.5 mb-2.5">
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
                  <div className="text-xl sm:text-2xl font-bold text-[var(--foreground)] leading-tight mb-3">
                    {renderContent(selectedTaskForDetail.title, selectedTaskForDetail.attachments)}
                  </div>
                  {selectedTaskForDetail.description && (
                    <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-[var(--background)]/40 rounded-2xl border border-[var(--border)] shadow-lg">
                      <p className="text-sm text-[var(--foreground)] leading-relaxed font-semibold italic opacity-70">
                        {selectedTaskForDetail.description}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-[#555] font-bold uppercase tracking-wider">Criada em {new Date(selectedTaskForDetail.createdAt).toLocaleString()}</p>
                </section>

                <div className="h-px bg-[var(--border)]" />

                {/* Histórico de Andamentos */}
                <section className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm font-bold text-[#888] uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={16} className="text-[var(--accent)]" /> Andamentos ({selectedTaskForDetail.logs.length})
                    </h3>
                    <button
                      onClick={() => setIsAddingLog(!isAddingLog)}
                      className={cn(
                        "px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 active:scale-95 shadow-lg border",
                        isAddingLog 
                          ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20" 
                          : "bg-[var(--accent)] border-[var(--accent)] text-[var(--background)] hover:opacity-90"
                      )}
                    >
                      {isAddingLog ? <X size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={3} />}
                      {isAddingLog ? "Cancelar" : "Registrar Andamento"}
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {selectedTaskForDetail.logs.map((log) => (
                      <div
                        key={log.id}
                        id={`log-item-${log.id}`}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-md group hover:border-[var(--accent)]/30 transition-all relative overflow-hidden"
                      >
                        {/* Background glow sutil para o log */}
                        <div
                          className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none"
                          style={{ background: `radial-gradient(circle at top right, ${selectedProject?.color}, transparent)` }}
                        />
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {log.type === "blocker" && (
                              <div
                                className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
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

                          <div className="flex items-center gap-1 sm:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => { setEditingLogId(log.id); setEditingLogContent(log.content); }}
                              className="p-1.5 text-[#666] hover:text-blue-400 transition-colors"
                              title="Editar andamento"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-[#666] hover:text-red-400 transition-colors"
                              title="Excluir andamento"
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
              <footer className="p-3 sm:p-6 bg-[var(--sidebar)] border-t border-[var(--border)] animate-in slide-in-from-bottom duration-300">
                <div className="max-w-3xl mx-auto space-y-3">
                  {/* Preview de Anexos */}
                  {tempLogAttachments.length > 0 && (
                    <div id="log-preview">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">Anexos ({tempLogAttachments.length})</p>
                        <button onClick={() => setTempLogAttachments([])} className="text-[10px] text-[#555] hover:text-[var(--foreground)] transition-colors uppercase font-bold">Limpar tudo</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tempLogAttachments.map((url, i) => {
                          const isImg = isImage(url);
                          return (
                            <div key={i} className="relative group">
                              {isImg ? (
                                <img src={url} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-[#333] hover:border-[var(--accent)]/50 transition-all" />
                              ) : (
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--surface)] flex flex-col items-center justify-center rounded-lg border border-[#333] hover:border-[var(--accent)]/50 transition-all text-[var(--accent)]">
                                  {getFileIcon(url)}
                                  <span className="text-[8px] font-black">{url.split('.').pop()?.split('?')[0].toUpperCase()}</span>
                                </div>
                              )}
                              <button
                                onClick={() => setTempLogAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">Novo Andamento</p>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase rounded-lg border border-[var(--accent)]/30 cursor-pointer transition-all active:scale-95 shadow-sm">
                        <Plus size={13} /> Anexar Arquivo
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
                      value={newLogContent}
                      onChange={(e) => setNewLogContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateLog();
                        }
                      }}
                      onPaste={(e) => {
                        handlePaste(e, (url) => {
                          setTempLogAttachments(prev => [...prev, url]);
                        });
                      }}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-base sm:text-sm text-[var(--foreground)] placeholder-[#444] focus:outline-none focus:border-[var(--accent)] transition-all resize-none min-h-[90px] sm:min-h-[110px]"
                    />
                  </div>

                  {/* Action Button for Touch and Desktop */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[10px] text-[#555] hidden sm:inline">
                      Pressione ENTER para enviar ou toque no botão ao lado
                    </span>
                    <button
                      type="button"
                      onClick={handleCreateLog}
                      disabled={(!newLogContent.trim() && tempLogAttachments.length === 0) || isPending}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--background)] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ml-auto"
                    >
                      <Send size={14} />
                      <span>Registrar Andamento</span>
                    </button>
                  </div>
                </div>
              </footer>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {(isProjectModalOpen || editingProject) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop,rgba(0,0,0,0.6))] backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-2xl p-5 sm:p-8 shadow-2xl scale-in-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{editingProject ? "Editar Projeto" : "Novo Projeto"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#888] mb-1.5">Nome do Projeto</label>
                <input
                  autoFocus
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-base sm:text-sm outline-none focus:border-[var(--accent)]"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nome do projeto..."
                />
              </div>
              <div className="flex gap-2.5 sm:gap-3 pt-2 sm:pt-4">
                <button
                  onClick={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
                  className="flex-1 py-2.5 sm:py-3 bg-[#222222] hover:bg-[#333333] text-xs sm:text-sm rounded-xl transition-all font-medium"
                >Cancelar</button>
                <button
                  onClick={editingProject ? handleUpdateProject : handleCreateProject}
                  disabled={isPending}
                  className="flex-1 py-2.5 sm:py-3 bg-[var(--accent)] hover:bg-[var(--accent)] text-xs sm:text-sm rounded-xl transition-all font-bold disabled:opacity-50"
                >{editingProject ? "Salvar" : "Criar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop,rgba(0,0,0,0.6))] backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-2xl p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-[#888]">Título da Tarefa</label>
                  <label className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase rounded-lg border border-[var(--accent)]/30 cursor-pointer transition-all active:scale-95 shadow-sm">
                    <Plus size={13} /> Anexar Arquivo
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
                          <button 
                            onClick={() => setTempTaskAttachments(prev => prev.filter((_, idx) => idx !== i))} 
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <textarea
                  autoFocus
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--accent)] resize-none min-h-[80px] text-base sm:text-sm transition-all"
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
                <label className="block text-xs sm:text-sm font-medium text-[#888] mb-1.5">Descrição (opcional)</label>
                <textarea
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--accent)] resize-none min-h-[60px] text-base sm:text-sm"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Mais detalhes sobre o que precisa ser feito..."
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#888] mb-1.5">Tags (separadas por vírgula)</label>
                <input
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--accent)] text-base sm:text-sm uppercase"
                  placeholder="EX: DESIGN, BACKEND, URGENTE"
                  value={newTaskTags}
                  onChange={(e) => setNewTaskTags(e.target.value.toUpperCase())}
                  list="tag-suggestions"
                />
                <datalist id="tag-suggestions">
                  {allUniqueTags.map(tag => <option key={tag} value={tag} />)}
                </datalist>
                <p className="text-[10px] text-[#555] mt-1.5 truncate">Sugestões: {allUniqueTags.join(", ")}</p>
              </div>
              <div className="flex gap-2.5 sm:gap-3 pt-2 sm:pt-4">
                <button onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); }} className="flex-1 py-2.5 sm:py-3 bg-[#222222] hover:bg-[#333333] text-xs sm:text-sm rounded-xl transition-all font-medium">Cancelar</button>
                <button onClick={handleCreateTask} disabled={isPending} className="flex-1 py-2.5 sm:py-3 bg-[var(--accent)] hover:bg-[var(--accent)] text-xs sm:text-sm rounded-xl transition-all font-bold disabled:opacity-50">
                  {editingTask ? "Salvar" : "Criar Tarefa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVA NOTA */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop,rgba(0,0,0,0.6))] backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[#fef9c3] p-5 sm:p-10 shadow-[20px_20px_60px_rgba(0,0,0,0.5)] relative rotate-0 sm:-rotate-1 w-full max-w-xl border-t-[24px] sm:border-t-[40px] border-amber-200/50 rounded-b-xl scale-in-center">
            <div className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-12 bg-white/40 backdrop-blur-sm -rotate-2 border border-white/20 shadow-sm z-10" />
            <button
              onClick={() => setIsNoteModalOpen(false)}
              className="absolute top-1.5 sm:top-2 right-2 sm:right-4 text-amber-900/40 hover:text-amber-900 transition-all p-1"
            >
              <X size={20} />
            </button>
            <textarea
              autoFocus
              placeholder="Descreva sua ideia ou nota aqui..."
              className="w-full bg-transparent border-none outline-none text-[16px] sm:text-[20px] text-amber-950 placeholder-amber-900/20 resize-none min-h-[180px] sm:min-h-[250px] font-bold leading-relaxed pt-2"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleCreateNote();
                  setIsNoteModalOpen(false);
                }
              }}
            />
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-amber-950/10">
              <span className="text-[11px] text-amber-900/40 font-black uppercase tracking-widest hidden sm:inline">Ctrl + Enter para fixar</span>
              <div className="flex gap-2 sm:gap-4 justify-end">
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 text-amber-900/60 hover:text-amber-900 text-xs font-black uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { handleCreateNote(); setIsNoteModalOpen(false); }}
                  disabled={!newNoteContent || isPending}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-amber-950 hover:bg-black disabled:opacity-30 text-[#fef9c3] text-xs font-black uppercase rounded-lg shadow-xl active:scale-95 transition-all"
                >
                  Pregar Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÕES E SEGURANÇA (TROCA DE SENHA) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[var(--backdrop,rgba(0,0,0,0.6))] backdrop-blur-sm p-3 sm:p-4">
          <div 
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]/60 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">Configurações da Conta</h3>
                  <p className="text-[11px] text-[#777]">Segurança e credenciais de acesso</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-[#777] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-xl transition-all"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário de Troca de Senha */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2">
                <KeyRound size={14} />
                <span>Alterar Senha de Acesso</span>
              </div>

              {settingsError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#888] mb-1">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    placeholder="Sua senha atual..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 pr-10 outline-none focus:border-[var(--accent)] text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888] mb-1">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Mínimo de 4 caracteres..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 pr-10 outline-none focus:border-[var(--accent)] text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888] mb-1">Confirmar Nova Senha</label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Repita a nova senha..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[var(--accent)] text-sm transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 py-2.5 bg-[var(--surface-hover)] hover:bg-[var(--border)]/40 text-xs sm:text-sm rounded-xl transition-all font-medium text-[var(--foreground)]"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 py-2.5 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-[var(--background)] text-xs sm:text-sm rounded-xl transition-all font-bold shadow-md active:scale-95"
                >
                  {isChangingPassword ? "Atualizando..." : "Salvar Senha"}
                </button>
              </div>
            </form>
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
