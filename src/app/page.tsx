import React from "react";
import { getProjects } from "./actions/projects";
import { getTasks } from "./actions/tasks";
import DashboardContent from "./components/DashboardContent";

export default async function ProjectNotesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ project?: string }> 
}) {
  const projects = await getProjects();
  
  // Resolve searchParams promise
  const params = await searchParams;
  const selectedProjectId = params.project || projects[0]?.id;
  
  const tasks = selectedProjectId ? await getTasks(selectedProjectId) : [];

  return (
    <DashboardContent 
      initialProjects={projects.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        _count: { tasks: p._count.tasks }
      }))} 
      initialTasks={tasks.map(t => ({
        id: t.id,
        title: t.title,
        attachments: t.attachments,
        status: t.status,
        tags: t.tags,
        createdAt: t.createdAt,
        logs: t.logs.map(l => ({
          id: l.id,
          content: l.content,
          attachments: l.attachments,
          type: l.type,
          createdAt: l.createdAt
        }))
      }))}
      currentProjectId={selectedProjectId}
    />
  );
}
