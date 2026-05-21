"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Save, RotateCcw } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditorPage() {
  const { id, fileId } = useParams();

  const BACKEND =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5170";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [code, setCode] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  // ---------------------------------------------------------
  // FETCH LATEST VERSION OF THIS FILE
  // ---------------------------------------------------------
  useEffect(() => {
    async function loadContent() {
      const res = await fetch(`${BACKEND}/projects/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.log("Error loading project details");
        return;
      }

      const data = await res.json();

      const file = data.files.find((f) => f._id === fileId);

      if (!file) {
        console.error("File not found");
        return;
      }

      setFileName(file.file_name);

      // IMPORTANT: your backend uses latest_content, not versions[]
      setCode(file.latest_content || "");
      setOriginalCode(file.latest_content || "");
    }

    loadContent();
  }, [id, fileId]);

  // ---------------------------------------------------------
  // DETERMINE LANGUAGE FOR MONACO
  // ---------------------------------------------------------
  const getLanguage = (name: string) => {
    if (!name) return "plaintext";
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return "typescript";
    if (name.endsWith(".js") || name.endsWith(".jsx")) return "javascript";
    if (name.endsWith(".html") || name.endsWith(".htm")) return "html";
    if (name.endsWith(".css")) return "css";
    if (name.endsWith(".json")) return "json";
    return "plaintext";
  };

  // ---------------------------------------------------------
  // SAVE / COMMIT HANDLERS
  // ---------------------------------------------------------
const handleSave = async () => {
  try {
    const res = await fetch(`${BACKEND}/projects/file/${fileId}/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        new_content: code,
        message: commitMessage,
        project_id: id,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Commit failed:", errorData);
      alert(
        "Failed to commit changes: " + (errorData.message || res.statusText)
      );
      return;
    }

    setOriginalCode(code);
    setHasChanges(false);
    setCommitMessage("");

    alert("Committed successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to commit changes: " + err);
  }
};


  const handleDiscard = () => {
    setCode(originalCode);
    setHasChanges(false);
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <AppLayout>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Navigation Breadcrumb */}
        <div className="border-b border-border">
          <div className="container-safe max-w-6xl mx-auto py-4 flex items-center gap-2 text-sm">
            <Link
              href={`/project/${id}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {id}
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{fileName}</span>
            {hasChanges && (
              <span className="ml-4 text-xs text-yellow-600">Unsaved</span>
            )}
          </div>
        </div>

        {/* Editor + Commit Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Monaco Editor */}
          <div className="flex-1 min-w-0">
            <MonacoEditor
              language={getLanguage(fileName)}
              value={code}
              onChange={(value) => {
                setCode(value || "");
                setHasChanges(value !== originalCode);
              }}
              height="100%"
              theme="vs-dark"
              options={{
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: "on",
              }}
            />
          </div>

          {/* Commit Sidebar */}
          <div className="w-80 flex-shrink-0 border-l border-border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-sm">Commit Message</h3>

            <Input
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              className="text-sm"
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleDiscard}
                disabled={!hasChanges}
              >
                <RotateCcw className="w-4 h-4" />
                Discard
              </Button>

              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={handleSave}
                disabled={!hasChanges || !commitMessage}
              >
                <Save className="w-4 h-4" />
                Commit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
