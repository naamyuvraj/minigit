"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, GitCommit, Plus, Edit2, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUserActivity } from "../service/app"

interface ActivityLog {
  id: string
  action: string
  actor: string
  target: string
  timestamp: Date | string
  type: "create" | "update" | "delete" | "comment"
  avatar: string
  projectId: string
}

const mockActivity: ActivityLog[] = [
  {
    id: "1",
    action: "Created project",
    actor: "Sarah Chen",
    target: "OpenBox MVP",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: "create",
    avatar: "SC",
    projectId: "1",
  },
  {
    id: "2",
    action: "Updated component",
    actor: "Mike Johnson",
    target: "Button.tsx",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    type: "update",
    avatar: "MJ",
    projectId: "1",
  },
  {
    id: "3",
    action: "Added collaborator",
    actor: "Alex Rivera",
    target: "Emma Wilson",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    type: "create",
    avatar: "AR",
    projectId: "2",
  },
  {
    id: "4",
    action: "Deleted file",
    actor: "Emma Wilson",
    target: "config.ts (archived)",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    type: "delete",
    avatar: "EW",
    projectId: "3",
  },
  {
    id: "5",
    action: "Commented on project",
    actor: "Sarah Chen",
    target: "Design System V2",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    type: "comment",
    avatar: "SC",
    projectId: "2",
  },
]

const actionIcons: Record<ActivityLog["type"], React.ComponentType> = {
  create: Plus,
  update: Edit2,
  delete: Trash2,
  comment: GitCommit,
}

const getActionBadgeVariant = (type: ActivityLog["type"]) => {
  switch (type) {
    case "create":
      return "default"
    case "update":
      return "secondary"
    case "delete":
      return "destructive"
    case "comment":
      return "outline"
    default:
      return "default"
  }
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filterType, setFilterType] = useState<"all" | ActivityLog["type"]>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true)
        const res = await getUserActivity()
        setActivities(res.activity || [])
        setError(null)
      } catch (err: any) {
        setError(err.message || "Failed to load activity logs")
        setActivities(mockActivity) // Fallback to mock on error
      } finally {
        setLoading(false)
      }
    }
    loadActivity()
  }, [])

  const filtered = activities.filter((a) => {
    const matchesSearch =
      a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.actor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || a.type === filterType
    return matchesSearch && matchesType
  })

  // Stack consecutive activities for the same project on the same day
  const stackedActivities: ActivityLog[][] = []
  let currentStack: ActivityLog[] = []

  filtered.forEach((activity) => {
    if (currentStack.length === 0) {
      currentStack.push(activity)
    } else {
      const prev = currentStack[currentStack.length - 1]
      const prevDate = new Date(prev.timestamp).toDateString()
      const currDate = new Date(activity.timestamp).toDateString()
      if (prev.projectId === activity.projectId && prevDate === currDate) {
        currentStack.push(activity)
      } else {
        stackedActivities.push(currentStack)
        currentStack = [activity]
      }
    }
  })
  if (currentStack.length > 0) {
    stackedActivities.push(currentStack)
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border">
          <div className="container-safe max-w-6xl mx-auto py-8 space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Activity</h1>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search activity..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent font-semibold">
                    Filter by Type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Activity Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setFilterType("all")}
                    className={filterType === "all" ? "bg-muted" : ""}
                  >
                    All Activities
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterType("create")}
                    className={filterType === "create" ? "bg-muted" : ""}
                  >
                    Created
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterType("update")}
                    className={filterType === "update" ? "bg-muted" : ""}
                  >
                    Updated
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterType("delete")}
                    className={filterType === "delete" ? "bg-muted" : ""}
                  >
                    Deleted
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilterType("comment")}
                    className={filterType === "comment" ? "bg-muted" : ""}
                  >
                    Commented
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="container-safe max-w-4xl mx-auto py-8">
          {filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No activity found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                {stackedActivities.map((stack, stackIndex) => {
                  const headActivity = stack[0]
                  const ActionIcon = actionIcons[headActivity.type]

                  return (
                    <div key={`stack-${stackIndex}`} className="flex gap-4 relative mb-6">
                      {/* Timeline line */}
                      {stackIndex !== stackedActivities.length - 1 && (
                        <div className="absolute left-[19px] top-14 -bottom-6 w-0.5 bg-border" />
                      )}

                      {/* Timeline dot */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center border border-border relative z-10 mt-1">
                          <ActionIcon className="w-5 h-5 text-foreground" />
                        </div>
                      </div>

                      {/* Stacked Activity cards */}
                      <div className="flex-1 pt-1 space-y-2">
                        {stack.map((activity, itemIndex) => (
                          <Card 
                            key={activity.id} 
                            className={`hover:shadow-md transition-smooth relative ${
                              itemIndex > 0 ? "ml-4 border-l-4 border-l-primary/50" : ""
                            }`}
                          >
                            <CardContent className="py-4 px-4 flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                  <AvatarFallback className="bg-foreground text-background">
                                    {activity.avatar}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-medium text-sm">{activity.actor}</span>
                                    <span className="text-muted-foreground text-sm">{activity.action}</span>
                                    <Badge variant={getActionBadgeVariant(activity.type)} className="text-[10px] uppercase">
                                      {activity.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate font-semibold">
                                    {activity.target}
                                  </p>
                                  {(activity as any).message && (
                                    <p className="text-sm text-muted-foreground italic truncate mt-1">
                                      "{ (activity as any).message }"
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
