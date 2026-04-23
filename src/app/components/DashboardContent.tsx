"use client";

import React, { useState, useTransition } from "react";
import { 
  CheckCircle2, Circle, Filter, Plus, LogOut, 
  Trash2, Edit2, X, Save, AlertCircle, MessageSquare,
  ChevronDown, ChevronRight, Menu
} from "lucide-react";
import { logout } from "../actions/auth";
import { 
  createTask, createLog, updateTaskStatus, 
  deleteTask, updateTask, updateLog, deleteLog 
} from "../actions/tasks";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase, uploadAttachment } from "@/lib/supabase";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Project {
  id: string;
  name: string;
  color: string;
  _count?: { tasks: number };
}

interface Log {
  id: string;
  content: string;
  attachments: string[];
  type: string;
  createdAt: Date;
}

interface Task {
  id: string;
  title: string;
  attachments: string[];
  status: string;
  tags: string[];
  logs: Log[];
  createdAt: Date;
}

import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardContent({ 
  initialProjects, 
  initialTasks,
  currentProjectId 
}: { 
  initialProjects: Project[], 
  initialTasks: Task[],
  currentProjectId?: string 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = currentProjectId || initialProjects[0]?.id;
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  // Sincroniza a tarefa selecionada com os dados atualizados do servidor
  React.useEffect(() => {
    if (selectedTaskForDetail) {
      const updated = initialTasks.find(t => t.id === selectedTaskForDetail.id);
      if (updated) setSelectedTaskForDetail(updated);
    }
  }, [initialTasks]);
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed">("pending");
  
  const [tempLogAttachments, setTempLogAttachments] = useState<string[]>([]);
  const [tempTaskAttachments, setTempTaskAttachments] = useState<string[]>([]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogContent, setEditingLogContent] = useState("");
  
  const [isPending, startTransition] = useTransition();

  const selectedProject = initialProjects.find(p => p.id === selectedProjectId);
  
  // Extrair todas as tags únicas para sugestões
  const allUniqueTags = Array.from(new Set(initialTasks.flatMap(t => t.tags))).sort();

  // Filtrar tarefas por tag e status
  const tasks = initialTasks.filter(t => {
    const matchesTag = !selectedTag || t.tags.includes(selectedTag);
    const matchesStatus = t.status === statusFilter;
    return matchesTag && matchesStatus;
  });

  const handleSelectProject = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", id);
    router.push(`/?${params.toString()}`);
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
        await updateTask(editingTask.id, newTaskTitle, newTaskTags.split(",").map(t => t.trim()).filter(t => t));
      } else {
        await createTask(selectedProjectId, newTaskTitle, newTaskTags.split(",").map(t => t.trim()).filter(t => t), tempTaskAttachments);
      }
      setNewTaskTitle("");
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

  const renderContent = (content: string, attachments: string[] = []) => {
    return (
      <div className="space-y-3">
        {content && (
          <p className="text-[15px] leading-relaxed text-[#dddddd] whitespace-pre-wrap break-words">
            {content}
          </p>
        )}
        
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {attachments.map((url, i) => (
              <button 
                key={i} 
                onClick={(e) => { e.stopPropagation(); setPreviewImage(url); }}
                className="group relative block w-32 h-32 border border-[#333] rounded-xl overflow-hidden hover:border-blue-500 transition-all shadow-lg bg-black text-left"
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
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#111111] text-[#ededed] overflow-hidden selection:bg-blue-500/30">
      {/* SIDEBAR - Mobile Responsive */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 bg-[#1a1a1a] border-r border-[#333333] flex flex-col flex-shrink-0 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-[#333333]/50 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Project Notes</h1>
            <p className="text-sm text-[#888888] mt-1 font-medium">seus projetos em foco</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-[#666] hover:text-white"
            >
              <X size={20} />
            </button>
            <form action={logout}>
              <button type="submit" className="p-2 text-[#666666] hover:text-white hover:bg-[#333333] rounded-md transition-all">
                <LogOut size={18} />
              </button>
            </form>
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
                      "w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors text-left",
                      selectedProjectId === project.id ? "bg-[#2a2a2a] text-white" : "text-[#aaaaaa] hover:bg-[#2a2a2a]/50 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}80` }} />
                      <span className="font-medium truncate">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-[#222222] text-[#888] px-2 py-0.5 rounded-full">{project._count?.tasks || 0}</span>
                    </div>
                  </button>
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); setNewProjectName(project.name); }} className="p-1 hover:text-blue-400"><Edit2 size={12}/></button>
                    <button onClick={(e) => handleDeleteProject(project.id, e)} className="p-1 hover:text-red-400"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#333333]/50">
          <button 
            onClick={() => { setEditingProject(null); setNewProjectName(""); setIsProjectModalOpen(true); }}
            className="w-full py-2.5 border border-[#444444] border-dashed rounded-md text-sm font-medium text-[#888888] hover:text-white hover:border-[#666666] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Novo projeto
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-[#141414]">
        {selectedProject ? (
          <>
            <header className="border-b border-[#333333]/50 flex flex-col px-4 lg:px-8 bg-[#141414]/80 backdrop-blur-md sticky top-0 z-40">
              <div className="h-16 lg:h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 text-[#666] hover:text-white"
                  >
                    <Menu size={24} />
                  </button>
                  <h2 className="text-lg lg:text-2xl font-bold text-white tracking-tight truncate max-w-[150px] lg:max-w-none">{selectedProject.name}</h2>
                  <span className="hidden sm:inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full">ativo</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] text-white rounded-md text-xs lg:text-sm font-medium transition-all flex items-center gap-2" onClick={() => { setEditingTask(null); setNewTaskTitle(""); setNewTaskTags(""); setIsTaskModalOpen(true); }}>
                    <Plus size={16} /> <span className="hidden sm:inline">Nova tarefa</span>
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
                      !selectedTag ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-[#1a1a1a] border-[#333] text-[#666] hover:border-[#444]"
                    )}
                  >Todas</button>
                  {allUniqueTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                        selectedTag === tag ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-[#1a1a1a] border-[#333] text-[#888] hover:border-[#444]"
                      )}
                    >{tag}</button>
                  ))}
                </div>
              )}

              {/* Status Tabs */}
              <div className="mt-4 flex items-center gap-6 border-b border-[#333]/50 pb-px">
                <button 
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all relative",
                    statusFilter === "pending" ? "text-blue-400" : "text-[#555] hover:text-[#888]"
                  )}
                >
                  Pendentes
                  {statusFilter === "pending" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
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
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                {tasks.length === 0 ? (
                  <div className="text-center py-20 opacity-40 text-sm font-medium">Nenhuma tarefa encontrada neste filtro.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {tasks.map((task) => {
                      const lastLog = task.logs[0];
                      const logCount = task.logs.length;
                      
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => setSelectedTaskForDetail(task)}
                          className={cn(
                            "bg-[#1e1e1e] border border-[#333] rounded-xl overflow-hidden shadow-lg transition-all duration-200 group cursor-pointer hover:border-blue-500/50 hover:bg-[#222]",
                            task.status === "completed" ? "opacity-60" : ""
                          )}
                        >
                          <div className="p-4 flex items-start gap-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleToggleTask(task); }} 
                              className={cn("mt-1 flex-shrink-0 transition-colors", task.status === "completed" ? "text-emerald-500" : "text-[#555] hover:text-blue-500")}
                            >
                              {task.status === "completed" ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <div className={cn("text-lg font-semibold leading-tight break-words", task.status === "completed" ? "text-[#888] line-through" : "text-white")}>
                                {renderContent(task.title, task.attachments)}
                              </div>
                                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={(e) => { e.stopPropagation(); openEditTask(task); }} className="p-1.5 text-[#666] hover:text-blue-400 bg-[#111] rounded-md"><Edit2 size={12}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 text-[#666] hover:text-red-400 bg-[#111] rounded-md"><Trash2 size={12}/></button>
                                </div>
                              

                              {lastLog && (
                                <div className="mt-2 flex items-center gap-2 text-[#888]">
                                  <MessageSquare size={12} className="flex-shrink-0" />
                                  <p className="text-xs truncate italic">
                                    {lastLog.content.replace(/!\[.*?\]\(.*?\)/g, "[Anexo]")}
                                  </p>
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {task.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-[#111] text-[#777] text-[9px] font-bold rounded-full uppercase border border-[#222]">{tag}</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-bold text-[#555] uppercase tracking-tighter">
                                    {logCount} {logCount === 1 ? 'andamento' : 'andamentos'}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#444]">
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col opacity-30">
            <AlertCircle size={48} className="mb-4" />
            <p className="text-xl font-medium">Nenhum projeto selecionado</p>
          </div>
        )}
      </main>

      {/* DETALHE DA TAREFA (OVERLAY) */}
      {selectedTaskForDetail && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedTaskForDetail(null)} />
          <div className="relative w-full lg:max-w-4xl bg-[#141414] lg:border-l border-[#333] shadow-2xl flex flex-col slide-in-right overflow-hidden">
            <header className="h-16 lg:h-20 border-b border-[#333] px-4 lg:px-8 flex items-center justify-between flex-shrink-0 bg-[#181818]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTaskForDetail(null)}
                  className="p-2 -ml-2 text-[#888] hover:text-white hover:bg-[#222] rounded-full transition-all"
                >
                  <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white">Detalhes da Tarefa</h2>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <button onClick={() => openEditTask(selectedTaskForDetail)} className="p-2 lg:px-4 lg:py-2 bg-[#222] hover:bg-[#333] text-sm font-bold rounded-lg border border-[#333] flex items-center gap-2 text-[#888] hover:text-white">
                  <Edit2 size={14} /> <span className="hidden sm:inline">Editar Base</span>
                </button>
                <button 
                  onClick={() => { handleToggleTask(selectedTaskForDetail); setSelectedTaskForDetail(null); }} 
                  className={cn(
                    "px-3 lg:px-4 lg:py-2 text-xs lg:text-sm font-bold rounded-lg flex items-center gap-2",
                    selectedTaskForDetail.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-600 text-white"
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
                    {selectedTaskForDetail.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full uppercase border border-blue-500/20">{tag}</span>
                    ))}
                  </div>
                  <div className="text-2xl font-bold text-[#efefef] leading-tight mb-4">
                    {renderContent(selectedTaskForDetail.title, selectedTaskForDetail.attachments)}
                  </div>
                  <p className="text-xs text-[#555] font-bold uppercase tracking-wider">Criada em {new Date(selectedTaskForDetail.createdAt).toLocaleString()}</p>
                </section>

                <div className="h-px bg-[#222]" />

                {/* Histórico de Andamentos */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#888] uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={16} /> Andamentos ({selectedTaskForDetail.logs.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {selectedTaskForDetail.logs.map((log) => (
                      <div key={log.id} className="bg-[#1a1a1a] border border-[#222] rounded-xl p-5 shadow-sm group hover:border-[#333] transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", log.type === "blocker" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400")}>
                              {log.type === "blocker" ? "Bloqueio" : "Nota"}
                            </div>
                            <span className="text-[10px] font-bold text-[#444]">{new Date(log.createdAt).toLocaleString()}</span>
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
                              className="w-full bg-[#111] border border-blue-500/50 rounded-lg p-3 text-sm text-white focus:outline-none min-h-[100px]"
                              value={editingLogContent}
                              onChange={(e) => setEditingLogContent(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingLogId(null)} className="px-3 py-1 text-[10px] font-bold uppercase text-[#555] hover:text-white transition-colors">Cancelar</button>
                              <button onClick={() => handleUpdateLog(log.id)} className="px-3 py-1 text-[10px] font-bold uppercase bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">Salvar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#ddd]">
                            {renderContent(log.content, log.attachments)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
            <footer className="p-6 bg-[#181818] border-t border-[#333]">
              <div className="max-w-3xl mx-auto space-y-4">
                {/* Preview de Imagens em Tempo Real */}
                {tempLogAttachments.length > 0 && (
                  <div id="log-preview">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest text-glow">Anexos ({tempLogAttachments.length})</p>
                      <button onClick={() => setTempLogAttachments([])} className="text-[10px] text-[#555] hover:text-white transition-colors uppercase font-bold">Limpar tudo</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tempLogAttachments.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} className="w-16 h-16 object-cover rounded-lg border border-[#333] hover:border-blue-500/50 transition-all" />
                          <button 
                            onClick={() => setTempLogAttachments(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative group">
                  <textarea 
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
                        });
                      }
                    }}
                    onPaste={(e) => {
                      handlePaste(e, (url) => { 
                        setTempLogAttachments(prev => [...prev, url]);
                      });
                    }}
                    className="w-full bg-[#111] border border-[#333] rounded-xl px-5 py-4 text-[15px] text-white placeholder-[#444] focus:outline-none focus:border-blue-500 transition-all resize-none min-h-[120px]"
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-[#444] uppercase pointer-events-none group-hover:text-[#666] transition-all">
                    Pressione ENTER para registrar
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* MODALS */}
      {(isProjectModalOpen || editingProject) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-[#333333] w-full max-w-md rounded-2xl p-8 shadow-2xl scale-in-center">
            <h2 className="text-2xl font-bold mb-6">{editingProject ? "Editar Projeto" : "Novo Projeto"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Nome do Projeto</label>
                <input 
                  autoFocus
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 outline-none focus:border-blue-500"
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
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-bold disabled:opacity-50"
                >{editingProject ? "Salvar" : "Criar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-[#333333] w-full max-w-md rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Título da Tarefa</label>
                {tempTaskAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tempTaskAttachments.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} className="w-12 h-12 object-cover rounded-md border border-[#333]" />
                        <button onClick={() => setTempTaskAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={8}/></button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea 
                  autoFocus
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 outline-none focus:border-blue-500 resize-none min-h-[80px]"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onPaste={(e) => {
                    handlePaste(e, (url) => { 
                      setTempTaskAttachments(prev => [...prev, url]);
                    });
                  }}
                  placeholder="Descreva a tarefa... (Pode colar prints aqui)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Tags (separadas por vírgula)</label>
                <input 
                  className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 outline-none focus:border-blue-500"
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
                <button onClick={handleCreateTask} disabled={isPending} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-bold disabled:opacity-50">
                  {editingTask ? "Salvar Alterações" : "Criar Tarefa"}
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
          <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2 bg-white/10 rounded-full transition-all">
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
