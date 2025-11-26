import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSchedule } from '@/lib/graphUtils';

const PEXELS_API_KEY = 'ryIVPsvsGJkw0aRFl81RO0ZWscZJdEfn0L599oDpATvTZMtygHy1bIoA';

async function fetchPexelsImage(query: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium;
    }
    return null;
  } catch (error) {
    console.error('Error fetching image from Pexels:', error);
    return null;
  }
}

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      include: {
        dependentOn: {
          select: {
            id: true,
            title: true,
          },
        },
        dependencies: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate schedule and critical path
    const schedule = calculateSchedule(todos);

    // Enhance todos with schedule information
    const enhancedTodos = todos.map(todo => ({
      ...todo,
      earliestStart: schedule.earliestStart.get(todo.id) || 0,
      earliestFinish: schedule.earliestFinish.get(todo.id) || 0,
      latestStart: schedule.latestStart.get(todo.id) || 0,
      latestFinish: schedule.latestFinish.get(todo.id) || 0,
      isOnCriticalPath: schedule.criticalPath.has(todo.id),
    }));

    return NextResponse.json({
      todos: enhancedTodos,
      criticalPath: Array.from(schedule.criticalPath),
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, duration } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Fetch image from Pexels based on the task title
    const imageUrl = await fetchPexelsImage(title);

    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        imageUrl,
        duration: duration || 1,
      },
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}