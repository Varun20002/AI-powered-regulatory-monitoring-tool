"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Check, X, Database } from "lucide-react";
import { format } from "date-fns";
import type { BaselineRule } from "@/lib/types";

export default function BaselinePage() {
  const [rules, setRules] = useState<BaselineRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [seeding, setSeeding] = useState(false);

  async function fetchBaseline() {
    setLoading(true);
    try {
      const res = await fetch("/api/baseline");
      const data = await res.json();
      setRules(Array.isArray(data) ? data : []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBaseline();
  }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      await fetch("/api/baseline/seed", { method: "POST" });
      await fetchBaseline();
    } finally {
      setSeeding(false);
    }
  }

  async function handleSave(id: string) {
    try {
      await fetch("/api/baseline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, current_value: editValue }),
      });
      setRules((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                current_value: editValue,
                last_updated: new Date().toISOString(),
                updated_by: "officer",
              }
            : r
        )
      );
      setEditingId(null);
    } catch {
      // keep editing
    }
  }

  const domains = [...new Set(rules.map((r) => r.domain))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Glomopay Baseline
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          The regulatory baseline defines Glomopay&apos;s current regulatory
          reality.
        </p>
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium mb-2">No baseline rules found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Seed the baseline with Glomopay&apos;s regulatory rules to enable
              accurate analysis.
            </p>
            <Button onClick={handleSeed} disabled={seeding}>
              {seeding && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Seed Baseline
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            Glomopay Baseline
          </h1>
          <p className="text-sm text-muted-foreground">
            {rules.length} rules across {domains.length} domains
          </p>
        </div>
      </div>

      <Tabs defaultValue={domains[0]} className="space-y-4">
        <TabsList>
          {domains.map((domain) => (
            <TabsTrigger key={domain} value={domain}>
              {domain}
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {rules.filter((r) => r.domain === domain).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {domains.map((domain) => (
          <TabsContent key={domain} value={domain}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{domain} Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Category</TableHead>
                      <TableHead className="w-[200px]">Rule</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead className="w-[80px]">Gov. By</TableHead>
                      <TableHead className="w-[120px]">Updated</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules
                      .filter((r) => r.domain === domain)
                      .map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="text-xs font-medium">
                            {rule.category}
                          </TableCell>
                          <TableCell className="text-xs">
                            {rule.rule_name}
                          </TableCell>
                          <TableCell className="text-xs">
                            {editingId === rule.id ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-7 text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleSave(rule.id)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              rule.current_value
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {rule.governed_by}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(
                              new Date(rule.last_updated),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId !== rule.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingId(rule.id);
                                  setEditValue(rule.current_value || "");
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
