interface TodoWithDeps {
  id: number;
  title: string;
  duration: number;
  dependentOn: { id: number }[];
}

// Detect circular dependencies using DFS
export function hasCircularDependency(
  todos: TodoWithDeps[],
  newDependency: { fromId: number; toId: number }
): boolean {
  const graph = new Map<number, number[]>();

  // Build adjacency list
  todos.forEach(todo => {
    graph.set(todo.id, todo.dependentOn.map(dep => dep.id));
  });

  // Add the new dependency
  const existing = graph.get(newDependency.fromId) || [];
  graph.set(newDependency.fromId, [...existing, newDependency.toId]);

  // DFS to detect cycle
  const visited = new Set<number>();
  const recStack = new Set<number>();

  function hasCycle(nodeId: number): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  // Check all nodes
  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) return true;
    }
  }

  return false;
}

// Calculate earliest start dates and critical path
export function calculateSchedule(todos: TodoWithDeps[]) {
  const graph = new Map<number, number[]>();
  const inDegree = new Map<number, number>();
  const earliestStart = new Map<number, number>();
  const earliestFinish = new Map<number, number>();
  const latestStart = new Map<number, number>();
  const latestFinish = new Map<number, number>();

  // Build graph and calculate in-degrees
  todos.forEach(todo => {
    graph.set(todo.id, todo.dependentOn.map(dep => dep.id));
    inDegree.set(todo.id, todo.dependentOn.length);
    earliestStart.set(todo.id, 0);
  });

  // Topological sort with earliest start calculation
  const queue: number[] = [];
  todos.forEach(todo => {
    if (inDegree.get(todo.id) === 0) {
      queue.push(todo.id);
    }
  });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentTodo = todos.find(t => t.id === currentId)!;
    const start = earliestStart.get(currentId)!;
    const finish = start + currentTodo.duration;
    earliestFinish.set(currentId, finish);

    // Update dependent tasks
    todos.forEach(todo => {
      const deps = graph.get(todo.id) || [];
      if (deps.includes(currentId)) {
        const currentEarliestStart = earliestStart.get(todo.id)!;
        earliestStart.set(todo.id, Math.max(currentEarliestStart, finish));

        const newInDegree = (inDegree.get(todo.id) || 0) - 1;
        inDegree.set(todo.id, newInDegree);

        if (newInDegree === 0) {
          queue.push(todo.id);
        }
      }
    });
  }

  // Calculate latest start/finish for critical path
  const maxFinish = Math.max(...Array.from(earliestFinish.values()));

  todos.forEach(todo => {
    latestFinish.set(todo.id, maxFinish);
  });

  // Reverse topological order for latest times
  const reverseQueue: number[] = [];
  const reverseInDegree = new Map<number, number>();

  todos.forEach(todo => {
    const dependentCount = todos.filter(t =>
      graph.get(t.id)?.includes(todo.id)
    ).length;
    reverseInDegree.set(todo.id, dependentCount);

    if (dependentCount === 0) {
      reverseQueue.push(todo.id);
      latestFinish.set(todo.id, earliestFinish.get(todo.id)!);
    }
  });

  while (reverseQueue.length > 0) {
    const currentId = reverseQueue.shift()!;
    const currentTodo = todos.find(t => t.id === currentId)!;
    const finish = latestFinish.get(currentId)!;
    const start = finish - currentTodo.duration;
    latestStart.set(currentId, start);

    // Update dependencies
    const deps = graph.get(currentId) || [];
    deps.forEach(depId => {
      const currentLatestFinish = latestFinish.get(depId)!;
      latestFinish.set(depId, Math.min(currentLatestFinish, start));

      const newInDegree = (reverseInDegree.get(depId) || 0) - 1;
      reverseInDegree.set(depId, newInDegree);

      if (newInDegree === 0) {
        reverseQueue.push(depId);
      }
    });
  }

  // Identify critical path (tasks where earliest start = latest start)
  const criticalPath = new Set<number>();
  todos.forEach(todo => {
    const es = earliestStart.get(todo.id) || 0;
    const ls = latestStart.get(todo.id) || 0;
    if (es === ls) {
      criticalPath.add(todo.id);
    }
  });

  return {
    earliestStart,
    earliestFinish,
    latestStart,
    latestFinish,
    criticalPath,
  };
}
