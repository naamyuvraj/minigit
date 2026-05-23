"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Plus, Search, MoreVertical, Trash2, Edit, ArrowRight, FileText, Folder, Flame, GitCommit, Activity } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { getUserProjects, createProject, commitChanges, deleteProject, getUserStats } from "../service/app"

interface ProjectItem {
  id: string
  name: string
  type: "file" | "folder"
}

interface Project {
  _id: string
  name: string
  description: string
  owner?: string
  updatedAt: Date | string
  createdAt: Date | string
  status?: "active" | "archived"
  items?: ProjectItem[]
}

// dashboard page ka start function
export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [newProject, setNewProject] = useState({ name: "", description: "" })
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [projData, statsData] = await Promise.all([
        getUserProjects().catch(() => ({ projects: [] })),
        getUserStats().catch(() => ({ stats: null }))
      ])
      
      if (projData && projData.projects) {
        setProjects(projData.projects)
      }
      if (statsData && statsData.stats) {
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ab server se project laenge
  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const data = await getUserProjects()
      if (data && data.projects) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // search aur filter ka code
  const filtered = projects.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // function: naya project banaya jayega
  const handleCreateProject = async () => {
    if (newProject.name.trim()) {
      try {
        await createProject({ name: newProject.name, description: newProject.description })
        setNewProject({ name: "", description: "" })
        setIsOpen(false)
        fetchProjects()
      } catch (error) {
        console.error('Failed to create project:', error)
      }
    }
  }

  // file upload wala scene
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && selectedProjectId) {
      try {
        const filePromises = Array.from(files).map((file) => {
          return new Promise<{ file_name: string; file_path: string; content: string }>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              resolve({
                file_name: file.name,
                file_path: file.name,
                content: (e.target?.result as string) || "",
              })
            }
            reader.onerror = reject
            reader.readAsText(file)
          })
        })

        const filesData = await Promise.all(filePromises)

        await commitChanges({
          repo_id: selectedProjectId,
          commit_title: "Uploaded files via dashboard",
          message: "Uploaded files",
          files: filesData,
        })

        fetchProjects()
      } catch (error) {
        console.error("Failed to upload files:", error)
      }

      setShowAddItem(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleAddItemToProject = () => {
    if (newItemName.trim() && selectedProjectId) {
      setProjects(
        projects.map((p) =>
          p._id === selectedProjectId
            ? {
                ...p,
                items: [
                  ...p.items,
                  {
                    id: Date.now().toString(),
                    name: newItemName,
                    type: newItemType,
                  },
                ],
              }
            : p,
        ),
      )
      setNewItemName("")
      setShowAddItem(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }

  const handleDeleteItem = (projectId: string, itemId: string) => {
    setProjects(
      projects.map((p) =>
        p._id === projectId
          ? {
              ...p,
              items: (p.items || []).filter((item) => item.id !== itemId),
            }
          : p,
      ),
    )
  }

  // html ui render hua idhar
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border">
          <div className="container-safe max-w-6xl mx-auto py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight">Your Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage your projects and see your coding activity.</p>
              </div>

              {/* Create Project Button */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto">
                    <Plus className="w-5 h-5" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>Start a new project to organize your work</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        placeholder="e.g., Mobile App Redesign"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-desc">Description</Label>
                      <Input
                        id="project-desc"
                        placeholder="Brief description of the project"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Top Metrics Cards */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Folder className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium">Total Projects</h3>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{stats.totalProjects || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <GitCommit className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium">Total Commits</h3>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{stats.totalCommits || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium">Changes Made</h3>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{stats.totalChanges || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <h3 className="text-sm font-medium">Current Streak</h3>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{stats.currentStreak || 0} days</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="container-safe max-w-6xl mx-auto py-8">
          {filtered.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl font-black text-muted-foreground mb-4 opacity-20">+</div>
                <h3 className="font-black text-lg mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">Create your first project to get started</p>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Project
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project) => (
                <Card
                  key={project._id}
                  className="border-2 hover:border-foreground/50 transition-smooth h-full flex flex-col"
                >
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-lg font-black line-clamp-2 flex-1">{project.name}</CardTitle>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => handleDeleteProject(project._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                    {(project.items || []).length > 0 && (
                      <div className="space-y-2 py-3 border-t border-b border-border flex-1">
                        <p className="text-xs font-semibold text-muted-foreground">Contents</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {project.items?.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted group"
                            >
                              <div className="flex items-center gap-2">
                                {item.type === "file" ? (
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <Folder className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span>{item.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteItem(project._id, item.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs font-medium">{project.owner}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(project.updatedAt || project.createdAt || Date.now()), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Dialog open={showAddItem && selectedProjectId === project._id} onOpenChange={setShowAddItem}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2 font-semibold bg-transparent"
                            onClick={() => setSelectedProjectId(project._id)}
                          >
                            <Plus className="w-4 h-4" />
                            Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add File or Folder</DialogTitle>
                            <DialogDescription>Add files from your PC or create a new folder</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {/* File Upload Option */}
                            <div>
                              <Label className="mb-2 block">Upload Files from PC</Label>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              <Button
                                variant="outline"
                                className="w-full gap-2 bg-transparent"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <FileText className="w-4 h-4" />
                                Select Files
                              </Button>
                            </div>

                            {/* Create Folder Option */}
                            <div>
                              <Label htmlFor="folder-name" className="mb-2 block">
                                Or Create Folder
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id="folder-name"
                                  placeholder="e.g., src"
                                  value={newItemType === "folder" ? newItemName : ""}
                                  onChange={(e) => setNewItemName(e.target.value)}
                                />
                                <Button
                                  onClick={() => {
                                    if (newItemName.trim()) {
                                      setProjects((prevProjects) =>
                                        prevProjects.map((p) =>
                                          p._id === selectedProjectId
                                            ? {
                                                ...p,
                                                items: [
                                                  ...p.items,
                                                  {
                                                    id: Date.now().toString(),
                                                    name: newItemName,
                                                    type: "folder" as const,
                                                  },
                                                ],
                                              }
                                            : p,
                                        ),
                                      )
                                      setNewItemName("")
                                      setShowAddItem(false)
                                    }
                                  }}
                                  className="gap-2"
                                >
                                  <Folder className="w-4 h-4" />
                                  Create
                                </Button>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddItem(false)}>
                              Cancel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Link href={`/project/${project._id}`}>
                        <Button variant="outline" size="sm" className="flex-1 gap-2 font-semibold bg-transparent">
                          Open
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
