import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasCircularDependency } from '@/lib/graphUtils';

export async function POST(request: Request) {
  try {
    const { todoId, dependsOnId } = await request.json();

    if (!todoId || !dependsOnId) {
      return NextResponse.json(
        { error: 'Both todoId and dependsOnId are required' },
        { status: 400 }
      );
    }

    if (todoId === dependsOnId) {
      return NextResponse.json(
        { error: 'A task cannot depend on itself' },
        { status: 400 }
      );
    }

    // Fetch all todos with dependencies
    const todos = await prisma.todo.findMany({
      include: {
        dependentOn: { select: { id: true } },
      },
    });

    // Check for circular dependency
    if (hasCircularDependency(todos, { fromId: todoId, toId: dependsOnId })) {
      return NextResponse.json(
        { error: 'This dependency would create a circular dependency' },
        { status: 400 }
      );
    }

    // Add the dependency
    await prisma.todo.update({
      where: { id: todoId },
      data: {
        dependentOn: {
          connect: { id: dependsOnId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding dependency:', error);
    return NextResponse.json({ error: 'Error adding dependency' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { todoId, dependsOnId } = await request.json();

    if (!todoId || !dependsOnId) {
      return NextResponse.json(
        { error: 'Both todoId and dependsOnId are required' },
        { status: 400 }
      );
    }

    // Remove the dependency
    await prisma.todo.update({
      where: { id: todoId },
      data: {
        dependentOn: {
          disconnect: { id: dependsOnId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing dependency:', error);
    return NextResponse.json({ error: 'Error removing dependency' }, { status: 500 });
  }
}
