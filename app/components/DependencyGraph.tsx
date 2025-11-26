"use client"
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  title: string;
  dependentOn: { id: number; title: string }[];
  dependencies: { id: number; title: string }[];
  isOnCriticalPath: boolean;
  earliestStart: number;
}

interface DependencyGraphProps {
  todos: Todo[];
  onClose: () => void;
}

export default function DependencyGraph({ todos, onClose }: DependencyGraphProps) {
  const [positions, setPositions] = useState<Map<number, { x: number; y: number }>>(new Map());

  useEffect(() => {
    // Calculate positions using a simple hierarchical layout
    const newPositions = new Map<number, { x: number; y: number }>();
    const layers = new Map<number, number[]>();
    const visited = new Set<number>();

    // Group nodes by their depth (earliest start)
    todos.forEach(todo => {
      const layer = todo.earliestStart;
      if (!layers.has(layer)) {
        layers.set(layer, []);
      }
      layers.get(layer)!.push(todo.id);
    });

    const sortedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0]);
    const layerHeight = 120;
    const nodeWidth = 180;
    const nodeSpacing = 40;

    sortedLayers.forEach(([layer, nodeIds], layerIndex) => {
      const layerWidth = nodeIds.length * (nodeWidth + nodeSpacing);
      const startX = Math.max(50, (800 - layerWidth) / 2);

      nodeIds.forEach((nodeId, index) => {
        newPositions.set(nodeId, {
          x: startX + index * (nodeWidth + nodeSpacing),
          y: 50 + layerIndex * layerHeight,
        });
      });
    });

    setPositions(newPositions);
  }, [todos]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dependency Graph</h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
              Critical path tasks are highlighted in red
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <svg
            width="100%"
            height={Math.max(400, todos.length * 60)}
            className="border border-gray-200 rounded"
          >
            {/* Draw edges first */}
            {todos.map(todo => {
              const fromPos = positions.get(todo.id);
              if (!fromPos) return null;

              return todo.dependentOn.map(dep => {
                const toPos = positions.get(dep.id);
                if (!toPos) return null;

                const isOnCriticalPath = todo.isOnCriticalPath &&
                  todos.find(t => t.id === dep.id)?.isOnCriticalPath;

                return (
                  <g key={`${todo.id}-${dep.id}`}>
                    <defs>
                      <marker
                        id={`arrowhead-${todo.id}-${dep.id}`}
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3, 0 6"
                          fill={isOnCriticalPath ? '#ef4444' : '#9ca3af'}
                        />
                      </marker>
                    </defs>
                    <line
                      x1={fromPos.x + 90}
                      y1={fromPos.y}
                      x2={toPos.x + 90}
                      y2={toPos.y + 40}
                      stroke={isOnCriticalPath ? '#ef4444' : '#9ca3af'}
                      strokeWidth={isOnCriticalPath ? 3 : 2}
                      markerEnd={`url(#arrowhead-${todo.id}-${dep.id})`}
                    />
                  </g>
                );
              });
            })}

            {/* Draw nodes */}
            {todos.map(todo => {
              const pos = positions.get(todo.id);
              if (!pos) return null;

              return (
                <g key={todo.id}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={180}
                    height={40}
                    rx={8}
                    fill={todo.isOnCriticalPath ? '#ef4444' : '#3b82f6'}
                    className="drop-shadow-md"
                  />
                  <text
                    x={pos.x + 90}
                    y={pos.y + 15}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {todo.title.length > 20 ? todo.title.substring(0, 20) + '...' : todo.title}
                  </text>
                  <text
                    x={pos.x + 90}
                    y={pos.y + 30}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                  >
                    ES: Day {todo.earliestStart}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Legend:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span>Critical Path Tasks</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Regular Tasks</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-red-500 mr-2"></div>
                <span>Critical Dependencies</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-gray-400 mr-2"></div>
                <span>Regular Dependencies</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              ES = Earliest Start (in days from project start)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
