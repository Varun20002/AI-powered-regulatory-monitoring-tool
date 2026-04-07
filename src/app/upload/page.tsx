"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("CUSTOM");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    circularId?: string;
  } | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.pdf$/i, ""));
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.pdf$/i, ""));
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("source", source);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: "Upload successful! Analysis triggered.",
          circularId: data.circular?.id,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Upload failed",
        });
      }
    } catch {
      setResult({ success: false, message: "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Upload Circular
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Upload a PDF circular for analysis. The system will extract text and run
        AI analysis automatically.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PDF Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-muted-foreground/40"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm font-medium">
                  Drop PDF here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF files only, max 50MB
                </p>
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Circular title"
            />
          </div>

          {/* Source */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Source</label>
            <Select value={source} onValueChange={(v) => v && setSource(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOM">Custom</SelectItem>
                <SelectItem value="RBI">RBI</SelectItem>
                <SelectItem value="SEBI">SEBI</SelectItem>
                <SelectItem value="IFSCA">IFSCA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            {uploading ? "Uploading & Analyzing..." : "Upload & Analyze"}
          </Button>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg p-3 text-sm ${
                result.success
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success && <CheckCircle2 className="h-4 w-4" />}
                <span>{result.message}</span>
              </div>
              {result.circularId && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-green-700"
                  onClick={() =>
                    router.push(`/circular/${result.circularId}`)
                  }
                >
                  View Analysis →
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
