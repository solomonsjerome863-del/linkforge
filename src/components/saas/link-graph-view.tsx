"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Globe, RotateCcw, X, Link2, FileText, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PageNode {
  id: string;
  url: string;
  title: string;
  wordCount: number;
  incomingLinks: number;
  outgoingLinks: number;
  isOrphan: boolean;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

/* ------------------------------------------------------------------ */
/*  Force-directed layout (simple, runs once)                          */
/* ------------------------------------------------------------------ */

function computeLayout(
  nodes: PageNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations = 80
): NodePosition[] {
  const n = nodes.length;
  if (n === 0) return [];

  // Build adjacency map for quick lookup
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const src = adj.get(e.sourceId) ?? [];
    src.push(e.targetId);
    adj.set(e.sourceId, src);
    const tgt = adj.get(e.targetId) ?? [];
    tgt.push(e.sourceId);
    adj.set(e.targetId, tgt);
  }

  // Initialize in a circle
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const pos: NodePosition[] = nodes.map((node, i) => ({
    id: node.id,
    x: cx + radius * Math.cos((2 * Math.PI * i) / n),
    y: cy + radius * Math.sin((2 * Math.PI * i) / n),
  }));
  const idx = new Map(pos.map((p, i) => [p.id, i]));

  // Force constants
  const repulsion = 6000;
  const attraction = 0.005;
  const centering = 0.01;
  const damping = 0.9;

  let vx = new Float64Array(n);
  let vy = new Float64Array(n);

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        vx[i] -= fx;
        vy[i] -= fy;
        vx[j] += fx;
        vy[j] += fy;
      }
    }

    // Attraction along edges
    for (const e of edges) {
      const i = idx.get(e.sourceId);
      const j = idx.get(e.targetId);
      if (i === undefined || j === undefined) continue;
      const dx = pos[j].x - pos[i].x;
      const dy = pos[j].y - pos[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      vx[i] += fx;
      vy[i] += fy;
      vx[j] -= fx;
      vy[j] -= fy;
    }

    // Centering
    for (let i = 0; i < n; i++) {
      vx[i] += (cx - pos[i].x) * centering;
      vy[i] += (cy - pos[i].y) * centering;
    }

    // Apply with damping
    for (let i = 0; i < n; i++) {
      vx[i] *= damping;
      vy[i] *= damping;
      pos[i] = {
        id: pos[i].id,
        x: pos[i].x + vx[i],
        y: pos[i].y + vy[i],
      };
    }
  }

  return pos;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncate(str: string, max = 20) {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LinkGraphView() {
  const user = useAppStore((s) => s.user);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const sites = useAppStore((s) => s.sites);
  const currentSiteId =
    selectedSiteId ?? (sites.length > 0 ? sites[0].id : null);

  const [pages, setPages] = useState<PageNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loadedForSite, setLoadedForSite] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Loading = we have a site but haven't fetched data for it yet
  const loading = !!currentSiteId && !!user && loadedForSite !== currentSiteId;

  /* ---- Fetch data ---- */
  useEffect(() => {
    if (!currentSiteId || !user) return;

    const params = new URLSearchParams({
      siteId: currentSiteId,
      userId: user.id,
    });

    Promise.all([
      fetch(`/api/pages?${params}`).then((r) => r.json()),
      fetch(`/api/suggestions?${params}`).then((r) => r.json()),
    ])
      .then(([pagesRes, sugRes]) => {
        const pagesData: PageNode[] = pagesRes.pages ?? [];
        const allSuggestions = sugRes.suggestions ?? [];
        const graphEdges: GraphEdge[] = allSuggestions
          .filter(
            (s: { status: string }) => s.status === "approved" || s.status === "applied"
          )
          .map((s: { sourcePageId: string; targetPageId: string }) => ({
            sourceId: s.sourcePageId,
            targetId: s.targetPageId,
          }));
        setPages(pagesData);
        setEdges(graphEdges);
      })
      .catch(() => {
        setPages([]);
        setEdges([]);
      })
      .finally(() => setLoadedForSite(currentSiteId));
  }, [currentSiteId, user]);

  /* ---- Compute layout ---- */
  const dimensions = { width: 900, height: 500 };

  const nodePositions = useMemo(() => {
    return computeLayout(pages, edges, dimensions.width, dimensions.height);
  }, [pages, edges, dimensions.width, dimensions.height]);

  const posMap = useMemo(() => {
    const m = new Map<string, NodePosition>();
    for (const p of nodePositions) m.set(p.id, p);
    return m;
  }, [nodePositions]);

  /* Connection counts for node sizing */
  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of edges) {
      counts.set(e.sourceId, (counts.get(e.sourceId) ?? 0) + 1);
      counts.set(e.targetId, (counts.get(e.targetId) ?? 0) + 1);
    }
    return counts;
  }, [edges]);

  /* ---- Connected node set (for highlighting) ---- */
  const connectedSet = useMemo(() => {
    if (!hoveredNodeId) return null;
    const s = new Set<string>();
    s.add(hoveredNodeId);
    for (const e of edges) {
      if (e.sourceId === hoveredNodeId) s.add(e.targetId);
      if (e.targetId === hoveredNodeId) s.add(e.sourceId);
    }
    return s;
  }, [hoveredNodeId, edges]);

  /* ---- Pan / Zoom handlers ---- */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform((prev) => {
        const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
        const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.1), 5);
        const scaleChange = newScale / prev.scale;
        return {
          scale: newScale,
          x: mouseX - scaleChange * (mouseX - prev.x),
          y: mouseY - scaleChange * (mouseY - prev.y),
        };
      });
    },
    []
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on left click on the SVG background (not on nodes)
    if ((e.target as SVGElement).closest("[data-node]")) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }));
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, []);

  /* ---- Selected node details ---- */
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return pages.find((p) => p.id === selectedNodeId) ?? null;
  }, [selectedNodeId, pages]);

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[500px] rounded-lg" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /* ---- Empty state ---- */
  if (pages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Link Network Graph</CardTitle>
            <CardDescription>
              Visualize your site&apos;s internal link structure. Orange nodes are well-linked, red nodes are orphans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
              <Globe className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No pages to visualize</p>
              <p className="text-sm mt-1">
                Crawl your site to see the link graph
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /* ---- Compute node radius ---- */
  const maxConnections = Math.max(...Array.from(connectionCounts.values()), 1);

  const getNodeRadius = (nodeId: string) => {
    const count = connectionCounts.get(nodeId) ?? 0;
    return 12 + (count / maxConnections) * 22;
  };

  /* ---- Render ---- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Link Network Graph</CardTitle>
              <CardDescription className="mt-1">
                Visualize your site&apos;s internal link structure. Orange nodes are well-linked, red nodes are orphans.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="shrink-0"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset View
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ minHeight: 500 }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full h-full select-none"
              style={{ minHeight: 500 }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                {/* Arrow marker */}
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    className="fill-gray-400"
                  />
                </marker>
                <marker
                  id="arrowhead-highlight"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    className="fill-orange-500"
                  />
                </marker>
                {/* Glow filter for nodes */}
                <filter id="node-glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                  <feFlood floodColor="#f97316" floodOpacity="0.35" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="node-glow-rose" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                  <feFlood floodColor="#f43f5e" floodOpacity="0.35" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g
                transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
              >
                {/* Edges */}
                {edges.map((edge, i) => {
                  const src = posMap.get(edge.sourceId);
                  const tgt = posMap.get(edge.targetId);
                  if (!src || !tgt) return null;

                  const isHighlighted =
                    connectedSet &&
                    (connectedSet.has(edge.sourceId) || connectedSet.has(edge.targetId));

                  const isDimmed = connectedSet && !isHighlighted;

                  const srcR = getNodeRadius(edge.sourceId);
                  const tgtR = getNodeRadius(edge.targetId);

                  // Shorten the edge so it starts/ends at the node boundary
                  const dx = tgt.x - src.x;
                  const dy = tgt.y - src.y;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                  const ux = dx / dist;
                  const uy = dy / dist;
                  const x1 = src.x + ux * srcR;
                  const y1 = src.y + uy * srcR;
                  const x2 = tgt.x - ux * (tgtR + 4);
                  const y2 = tgt.y - uy * (tgtR + 4);

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={
                        isHighlighted
                          ? "rgb(249 115 22)"
                          : "rgb(156 163 175)"
                      }
                      strokeWidth={isHighlighted ? 2 : 1}
                      markerEnd={
                        isHighlighted
                          ? "url(#arrowhead-highlight)"
                          : "url(#arrowhead)"
                      }
                      opacity={isDimmed ? 0.08 : isHighlighted ? 1 : 0.5}
                    />
                  );
                })}

                {/* Nodes */}
                {pages.map((node) => {
                  const pos = posMap.get(node.id);
                  if (!pos) return null;
                  const r = getNodeRadius(node.id);
                  const isConnected = !node.isOrphan;
                  const isHovered = hoveredNodeId === node.id;
                  const isSelected = selectedNodeId === node.id;
                  const isDimmed = connectedSet && !connectedSet.has(node.id);
                  const isHighlighted = connectedSet && connectedSet.has(node.id) && connectedSet.size > 1;

                  const fillColor = isConnected
                    ? "rgb(249 115 22)"
                    : "rgb(244 63 94)";
                  const filterId = isConnected
                    ? "url(#node-glow-orange)"
                    : "url(#node-glow-rose)";

                  return (
                    <g
                      key={node.id}
                      data-node
                      transform={`translate(${pos.x}, ${pos.y})`}
                      opacity={isDimmed ? 0.12 : 1}
                      onMouseEnter={(e) => {
                        setHoveredNodeId(node.id);
                        const svg = svgRef.current;
                        if (!svg) return;
                        const rect = svg.getBoundingClientRect();
                        const scaleRatio = rect.width / dimensions.width;
                        setTooltipPos({
                          x: pos.x * scaleRatio * transform.scale + transform.x,
                          y: pos.y * scaleRatio * transform.scale + transform.y - r * transform.scale - 12,
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredNodeId(null);
                        setTooltipPos(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                      }}
                      className="cursor-pointer"
                    >
                      {/* Shadow circle */}
                      <circle
                        r={r + 2}
                        className="fill-black/10 dark:fill-black/30"
                        style={{ pointerEvents: "none" }}
                      />
                      {/* Main circle */}
                      <circle
                        r={isHovered || isSelected ? r + 3 : r}
                        fill={fillColor}
                        filter={isHighlighted || isHovered || isSelected ? filterId : undefined}
                        stroke={
                          isSelected
                            ? "white"
                            : isHovered
                              ? "white"
                              : "transparent"
                        }
                        strokeWidth={isSelected ? 3 : isHovered ? 2 : 0}
                        className="transition-[r] duration-150"
                      />
                      {/* Label */}
                      <text
                        y={r + 16}
                        textAnchor="middle"
                        className="fill-gray-700 dark:fill-gray-300 text-[10px] font-medium pointer-events-none select-none"
                      >
                        {truncate(node.title, 20)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Legend */}
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm border rounded-lg p-3 text-xs space-y-2 pointer-events-none">
              <p className="font-semibold text-foreground">Legend</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                <span className="text-muted-foreground">Well-linked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="text-muted-foreground">Orphan</span>
              </div>
            </div>

            {/* Node count badge */}
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <Badge variant="secondary" className="text-xs bg-background/90 backdrop-blur-sm">
                {pages.length} nodes &middot; {edges.length} edges
              </Badge>
            </div>

            {/* Tooltip */}
            {tooltipPos && hoveredNodeId && (
              <div
                className="absolute z-50 px-3 py-1.5 text-xs font-medium rounded-md bg-foreground text-background shadow-lg pointer-events-none whitespace-nowrap max-w-xs truncate"
                style={{
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {pages.find((p) => p.id === hoveredNodeId)?.title ?? ""}
              </div>
            )}

            {/* Selected node detail panel */}
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-3 right-3 z-50 w-72 bg-background border rounded-lg shadow-lg p-4 text-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-foreground leading-tight pr-2 line-clamp-2">
                    {selectedNode.title}
                  </h4>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate" title={selectedNode.url}>
                      {selectedNode.url}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-muted/60 rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Hash className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-foreground text-sm">
                        {selectedNode.wordCount.toLocaleString()}
                      </span>
                      <p className="text-[10px] mt-0.5">Words</p>
                    </div>
                    <div className="bg-muted/60 rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Link2 className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-foreground text-sm">
                        {selectedNode.incomingLinks}
                      </span>
                      <p className="text-[10px] mt-0.5">Incoming</p>
                    </div>
                    <div className="bg-muted/60 rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Link2 className="w-3 h-3 rotate-180" />
                      </div>
                      <span className="font-bold text-foreground text-sm">
                        {selectedNode.outgoingLinks}
                      </span>
                      <p className="text-[10px] mt-0.5">Outgoing</p>
                    </div>
                  </div>
                  {selectedNode.isOrphan && (
                    <Badge variant="destructive" className="mt-1 text-[10px]">
                      Orphan — no incoming links
                    </Badge>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}