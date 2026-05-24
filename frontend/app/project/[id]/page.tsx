"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Folder, FileText, Search, UserPlus } from "lucide-react";
import Link from "next/link";

export default function ProjectPage() {
  const { id } = useParams();

  const [project, setProject] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("files");
  const [selectedCommit, setSelectedCommit] = useState<any | null>(null);

  // Collaborator search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingCollab, setAddingCollab] = useState(false);

  const BACKEND =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5170";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // -----------------------------
  // FETCH DATA
  // -----------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        const pRes = await fetch(`${BACKEND}/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dRes = await fetch(`${BACKEND}/projects/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!pRes.ok) throw new Error(await pRes.text());
        if (!dRes.ok) throw new Error(await dRes.text());

        const { project } = await pRes.json();
        const { files, commits } = await dRes.json();

        setProject(project);
        setFiles(files);
        setCommits(commits);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [id]);

  function groupFiles(files: any[]) {
    const groups: Record<string, any[]> = {};
    for (const file of files) {
      const folder = file.file_path.split("/")[0]; // top folder
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(file);
    }
    return groups;
  }

  const grouped = groupFiles(files);

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${BACKEND}/profile/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error("Failed to search users:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddCollaborator = async (userId: string) => {
    setAddingCollab(true);
    try {
      const res = await fetch(`${BACKEND}/projects/collaborators/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ collaboratorId: userId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProject(data.project);
      
      // Update local state by re-running search so user's added state refreshes
      setSearchResults(prev => [...prev]); 
    } catch (err) {
      console.error("Failed to add collaborator:", err);
      alert("Failed to add collaborator.");
    } finally {
      setAddingCollab(false);
    }
  };

  if (loading)
    // ui yahan ban raha hai
  return (
      <AppLayout>
        <div className="p-10 text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  if (!project)
    // ui yahan ban raha hai
  return (
      <AppLayout>
        <div className="p-10 text-red-400">Project not found</div>
      </AppLayout>
    );

  // ui yahan ban raha hai
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* HEADER */}
        <div className="border-b border-border">
          <div className="container-safe max-w-6xl mx-auto py-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{project.name}</h1>
                  <Badge variant="default">active</Badge>
                </div>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
              <Button variant="outline">Share</Button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="container-safe max-w-6xl mx-auto py-8">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setSelectedCommit(null);
            }}
          >
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="commits">Commits</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            </TabsList>

            {/* FILES */}
            <TabsContent value="files" className="space-y-6">
              {Object.keys(grouped).map((folder) => (
                <div key={folder}>
                  {grouped[folder].map((file) => (
                    <div key={file._id} className="w-full">
                      <Card className="hover:shadow-lg transition-smooth cursor-pointer border border-border">
                        <CardContent className="py-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">{file.file_path}</p>
                              <p className="text-s text-muted-foreground">
                                {file.file_name.split(".").pop()} · v
                                {file.latest_version ?? 1}
                              </p>
                            </div>
                          </div>
                          <Link href={`/project/${id}/editor/${file._id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="font-semibold"
                            >
                              Edit
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ))}
            </TabsContent>

            {/* COMMITS */}
            <TabsContent value="commits" className="space-y-4">
              <h3 className="text-lg font-semibold">Change History</h3>

              {commits.length === 0 ? (
                <p className="text-muted-foreground">No commits yet</p>
              ) : (
                <div className="space-y-2">
                  {commits.map((c) => (
                    <Card
                      key={c._id}
                      onClick={() => setSelectedCommit(c)}
                      className="cursor-pointer hover:shadow-lg transition"
                    >
                      <CardContent className="p-4">
                        <p className="font-semibold">{c.commit_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.files.length} changed files
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* SHOW DIFF FOR SELECTED COMMIT */}
              {selectedCommit && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">Files Changed</h4>
                  {selectedCommit.files.map((f: any) => (
                    <Card key={f.file_id}>
                      <CardContent className="p-4">
                        <p className="font-semibold mb-2">{f.file_name}</p>
                        <div
                          className="max-w-full overflow-auto text-sm p-2 border border-border rounded whitespace-pre-wrap font-mono"
                          style={{ backgroundColor: "#1e1e1e" }}
                          dangerouslySetInnerHTML={{ __html: f.diff }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm">{project.description}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* COLLABORATORS */}
            <TabsContent value="collaborators" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Current Team</h3>
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={project.user_id?.avatarUrl || "https://api.dicebear.com/9.x/pixel-art/svg"} alt="avatar" className="w-8 h-8 rounded-full bg-muted" />
                          <div>
                            <p className="font-semibold text-sm">{project.user_id?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">@{project.user_id?.username || "unknown"}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Owner</Badge>
                      </CardContent>
                    </Card>
                    
                    {project.collaborators?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No collaborators added yet.</p>
                    )}
                    
                    {project.collaborators?.map((c: any) => (
                      <Card key={c._id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={c.avatarUrl || "https://api.dicebear.com/9.x/pixel-art/svg"} alt="avatar" className="w-8 h-8 rounded-full bg-muted" />
                            <div>
                              <p className="font-semibold text-sm">{c.name}</p>
                              <p className="text-xs text-muted-foreground">@{c.username}</p>
                            </div>
                          </div>
                          <Badge variant="outline">Collaborator</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Add a Collaborator</h3>
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <form onSubmit={handleSearchUsers} className="flex gap-2">
                        <Input 
                          placeholder="Search username or name..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button type="submit" disabled={searching}>
                          {searching ? "..." : <Search className="w-4 h-4" />}
                        </Button>
                      </form>

                      <div className="space-y-2 mt-4">
                        {searchResults.map((user) => {
                          const isOwner = project.user_id?._id === user._id || project.user_id === user._id;
                          const isCollab = project.collaborators?.some((c: any) => c._id === user._id || c === user._id);
                          const alreadyIn = isOwner || isCollab;

                          return (
                            <div key={user._id} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center gap-2">
                                <img src={user.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full" />
                                <div>
                                  <p className="text-xs font-semibold">{user.name}</p>
                                  <p className="text-[10px] text-muted-foreground">@{user.username}</p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant={alreadyIn ? "ghost" : "default"} 
                                disabled={alreadyIn || addingCollab}
                                onClick={() => handleAddCollaborator(user._id)}
                              >
                                {alreadyIn ? "Added" : "Add"}
                              </Button>
                            </div>
                          );
                        })}
                        {searchResults.length === 0 && searchQuery && !searching && (
                          <p className="text-sm text-muted-foreground">No users found. Try searching again.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
