"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';
import DependencyGraph from './components/DependencyGraph';

interface EnhancedTodo extends Todo {
  dependentOn: { id: number; title: string }[];
  dependencies: { id: number; title: string }[];
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  isOnCriticalPath: boolean;
}

function TodoImage({ imageUrl }: { imageUrl: string | null }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return null;
  }

  return (
    <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-300 animate-pulse flex items-center justify-center">
          <span className="text-gray-500 text-sm">Loading image...</span>
        </div>
      )}
      <img
        src={imageUrl}
        alt="Task visualization"
        className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
}

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState('1');
  const [todos, setTodos] = useState<EnhancedTodo[]>([]);
  const [criticalPath, setCriticalPath] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [managingDepsFor, setManagingDepsFor] = useState<number | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data.todos || []);
      setCriticalPath(data.criticalPath || []);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setIsLoading(true);
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodo,
          dueDate: dueDate || null,
          duration: parseInt(duration) || 1
        }),
      });
      setNewTodo('');
      setDueDate('');
      setDuration('1');
      await fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (id:any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleAddDependency = async (todoId: number, dependsOnId: number) => {
    try {
      const res = await fetch('/api/todos/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, dependsOnId }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to add dependency');
        return;
      }

      await fetchTodos();
    } catch (error) {
      console.error('Failed to add dependency:', error);
      alert('Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (todoId: number, dependsOnId: number) => {
    try {
      await fetch('/api/todos/dependencies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, dependsOnId }),
      });
      await fetchTodos();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return due < now;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-white mb-4">Things To Do App</h1>

        {criticalPath.length > 0 && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-center">
            Critical Path: {criticalPath.length} task(s) - Any delay will affect project completion
          </div>
        )}

        <button
          onClick={() => setShowGraph(true)}
          className="w-full bg-white text-orange-600 font-semibold p-3 rounded-lg mb-6 hover:bg-gray-100 transition duration-300 shadow-lg"
        >
          View Dependency Graph
        </button>

        <div className="bg-white bg-opacity-90 p-4 rounded-lg mb-6 shadow-lg">
          <h2 className="font-bold text-gray-800 mb-3">Add New Task</h2>
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              className="p-3 rounded-lg focus:outline-none text-gray-700 border border-gray-300"
              placeholder="Task title"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="p-3 rounded-lg focus:outline-none text-gray-700 border border-gray-300"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <input
                type="number"
                min="1"
                className="p-3 rounded-lg focus:outline-none text-gray-700 border border-gray-300"
                placeholder="Duration (days)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddTodo}
              disabled={isLoading}
              className="bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>

        <ul className="space-y-4">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`bg-white bg-opacity-90 p-4 rounded-lg shadow-lg ${
                todo.isOnCriticalPath ? 'border-4 border-red-500' : ''
              }`}
            >
              <TodoImage imageUrl={todo.imageUrl} />

              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-800">{todo.title}</span>
                    {todo.isOnCriticalPath && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Critical Path
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div>Duration: {todo.duration} day(s)</div>
                    <div>Earliest Start: Day {todo.earliestStart}</div>
                    {todo.dueDate && (
                      <div className={isOverdue(todo.dueDate) ? 'text-red-600 font-semibold' : ''}>
                        Due: {formatDate(todo.dueDate)}
                      </div>
                    )}
                  </div>

                  {todo.dependentOn.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold text-gray-700">Depends on:</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {todo.dependentOn.map((dep) => (
                          <span
                            key={dep.id}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                          >
                            {dep.title}
                            <button
                              onClick={() => handleRemoveDependency(todo.id, dep.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300 ml-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border-t pt-3">
                <button
                  onClick={() => setManagingDepsFor(managingDepsFor === todo.id ? null : todo.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {managingDepsFor === todo.id ? 'Hide' : 'Add'} Dependencies
                </button>

                {managingDepsFor === todo.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Select tasks this depends on:
                    </div>
                    <div className="space-y-2">
                      {todos
                        .filter((t) => t.id !== todo.id && !todo.dependentOn.find((d) => d.id === t.id))
                        .map((potentialDep) => (
                          <button
                            key={potentialDep.id}
                            onClick={() => handleAddDependency(todo.id, potentialDep.id)}
                            className="block w-full text-left p-2 bg-white hover:bg-blue-50 rounded border border-gray-200 text-sm"
                          >
                            {potentialDep.title}
                          </button>
                        ))}
                      {todos.filter((t) => t.id !== todo.id && !todo.dependentOn.find((d) => d.id === t.id)).length === 0 && (
                        <div className="text-sm text-gray-500 italic">No available tasks to add as dependencies</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <div className="text-center text-white text-lg mt-8">
            No tasks yet. Add your first task above!
          </div>
        )}
      </div>

      {showGraph && <DependencyGraph todos={todos} onClose={() => setShowGraph(false)} />}
    </div>
  );
}
