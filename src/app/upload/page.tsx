"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardPaste, Loader2, CheckCircle2, Trash2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("CUSTOM");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    circularId?: string;
  } | null>(null);

  async function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          title: title.trim() || "Untitled Circular",
          source,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: "Submitted! AI analysis is running.",
          circularId: data.circular?.id,
        });
        setText("");
        setTitle("");
      } else {
        setResult({
          success: false,
          message: data.error || "Submission failed",
        });
      }
    } catch {
      setResult({ success: false, message: "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        Paste Circular
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Paste the text of a regulatory circular. The system will run AI analysis
        automatically.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Circular Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RBI Master Direction on LRS — Amendment 2026"
            />
          </div>

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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Circular Text</label>
              {wordCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {wordCount.toLocaleString()} words
                </span>
              )}
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full text of the circular here..."
              className="min-h-[240px] font-mono text-sm leading-relaxed"
            />
          </div>

          {text.trim() && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setText("");
                setResult(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="w-full"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ClipboardPaste className="h-4 w-4 mr-1.5" />
            )}
            {submitting ? "Analyzing..." : "Submit & Analyze"}
          </Button>

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
