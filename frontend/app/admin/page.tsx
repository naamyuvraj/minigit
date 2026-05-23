"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Folder, GitCommit, HardDrive, ShieldAlert, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5170";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await fetch(`${BACKEND}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setRecentProjects(data.recentProjects);
      } catch (err: any) {
        setError(err.message || "Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [token]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col h-[80vh] items-center justify-center text-center p-8 gap-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Access Denied / Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border">
          <div className="container-safe max-w-7xl mx-auto py-8">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              System overview, recent activities, and metrics.
            </p>
          </div>
        </div>

        <div className="container-safe max-w-7xl mx-auto py-8 space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Registered accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground">Active repositories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
                <GitCommit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCommits || 0}</div>
                <p className="text-xs text-muted-foreground">Across all projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Files Tracked</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>
                <p className="text-xs text-muted-foreground">Individual files managed</p>
              </CardContent>
            </Card>
          </div>

          {/* Tables Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest users to join the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium leading-none">{user.name}</span>
                              <span className="text-xs text-muted-foreground">@{user.username || "user"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px]">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Latest repositories created.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{project.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={project.user_id?.avatarUrl} />
                              <AvatarFallback>{project.user_id?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{project.user_id?.name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
