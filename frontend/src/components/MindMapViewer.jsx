import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, Handle } from "reactflow";
import "reactflow/dist/style.css";
import { mindmapAPI } from "../utils/api";
import "../styles/MindMapViewer.css";

function convertMindmapToReactFlow(mindmap) {
  if (!mindmap || !mindmap.root || !Array.isArray(mindmap.nodes)) return { nodes: [], edges: [] };
  // BFS layout with fixed spacing
  const nodes = [];
  const edges = [];
  const verticalSpacing = 140;
  const horizontalSpacing = 180;
  const nodeMap = {};
  mindmap.nodes.forEach((n) => {
    nodeMap[n.id] = n;
  });
  // Root node
  nodes.push({
    id: "root",
    position: { x: 500, y: 0 },
    data: { label: mindmap.root, depth: 0 },
    type: "mindmapNode",
    parent: null,
  });
  // BFS queue
  const queue = [{ id: "root", x: 500, y: 0, depth: 0 }];
  while (queue.length > 0) {
    const { id, x, y, depth } = queue.shift();
    const children = mindmap.nodes.filter((n) => n.parent === id);
    const count = children.length;
    if (count === 0) continue;
    const startX = x - ((count - 1) * horizontalSpacing) / 2;
    children.forEach((child, i) => {
      const childX = startX + i * horizontalSpacing;
      const childY = y + verticalSpacing;
      nodes.push({
        id: child.id,
        position: { x: childX, y: childY },
        data: { label: child.label, depth: depth + 1 },
        type: "mindmapNode",
        parent: child.parent,
      });
      edges.push({
        id: `${child.parent}->${child.id}`,
        source: child.parent,
        target: child.id,
        type: "default",
      });
      queue.push({ id: child.id, x: childX, y: childY, depth: depth + 1 });
    });
  }
  return { nodes, edges };
}

export default function MindMapViewer({ resourceId }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const fetchMindmap = useCallback(() => {
    setLoading(true);
    setError(null);
    mindmapAPI
      .getMindmap(resourceId)
      .then((mindmap) => {
        const { nodes, edges } = convertMindmapToReactFlow(mindmap);
        setNodes(nodes);
        setEdges(edges);
      })
      .catch((err) => {
        setError(err.message || "Failed to load mind map");
        setNodes([]);
        setEdges([]);
      })
      .finally(() => setLoading(false));
  }, [resourceId]);

  useEffect(() => {
    if (resourceId) fetchMindmap();
  }, [resourceId, fetchMindmap]);

  const handleGenerate = () => {
    setGenerating(true);
    setError(null);
    mindmapAPI
      .generateMindmap(resourceId)
      .then((mindmap) => {
        const { nodes, edges } = convertMindmapToReactFlow(mindmap);
        setNodes(nodes);
        setEdges(edges);
      })
      .catch((err) => setError(err.message || "Failed to generate mind map"))
      .finally(() => setGenerating(false));
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Loading mind map...</div>;
  }
  if (error) {
    const isMissing = error.toLowerCase().includes("no mindmap found");
    return (
      <div className="mindmap-empty">
        <div style={{ color: "#dc2626", marginBottom: 12 }}>{error}</div>
        {isMissing ? (
          <button className="mindmap-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : "Generate Mind Map"}
          </button>
        ) : (
          <button className="mindmap-btn" onClick={fetchMindmap}>Retry</button>
        )}
      </div>
    );
  }
  if (!nodes.length) {
    return (
      <div className="mindmap-empty">
        <div>No mind map found for this resource.</div>
        <button className="mindmap-btn" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate Mind Map"}
        </button>
      </div>
    );
  }
  return (
    <div style={{ width: "100%", height: "600px", background: "#f8fafc", borderRadius: 16 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
