## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/  

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates 

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation 

When a todo is created, search for and display a relevant image to visualize the task to be done. 

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request. 

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Solution

This solution implements a comprehensive task management system with due dates, AI-powered image generation, and an advanced dependency management system with critical path analysis.

### Architecture Overview

The solution extends the original Next.js application with:
- **Database Schema** - Extended Prisma schema with new fields and relationships for dependencies
- **Backend Logic** - Graph algorithms for dependency validation and critical path calculation
- **API Layer** - RESTful endpoints for CRUD operations and dependency management
- **Frontend Components** - React components for task management and visualization

### Part 1: Due Dates Implementation

**Features:**
- Date picker integrated into task creation form
- Due dates stored in database and displayed on each task
- Overdue dates automatically highlighted in red with bold text
- Formatted date display (e.g., "Dec 31, 2025")

**Technical Details:**
- Added `dueDate` field (nullable DateTime) to Todo model
- Frontend validation checks if date is past current time
- Date comparison normalizes times to midnight for accurate comparison

### Part 2: Image Generation with Pexels API

**Features:**
- Automatic image search based on task title
- Relevant images displayed at the top of each task card
- Smooth loading state with animated placeholder
- Graceful error handling for failed image loads
- Fade-in animation when images load

**Technical Details:**
- Server-side integration with Pexels API
- Image URL stored in database for persistence
- Client-side loading states managed with React hooks
- Responsive image display with object-cover for consistent sizing

### Part 3: Task Dependencies & Critical Path

**Features:**
- **Multiple Dependencies** - Tasks can depend on unlimited other tasks
- **Circular Dependency Prevention** - Real-time validation using DFS graph traversal
- **Critical Path Calculation** - Automatic identification using forward/backward pass algorithm
- **Earliest Start Dates** - Calculated based on dependency completion times
- **Visual Dependency Graph** - Interactive SVG visualization with hierarchical layout
- **Task Duration** - Configurable duration in days for accurate scheduling

**Technical Details:**

*Graph Algorithms:*
- Depth-First Search (DFS) for circular dependency detection
- Topological sorting for dependency ordering
- Critical Path Method (CPM) implementation
- Forward pass calculates earliest start/finish times
- Backward pass calculates latest start/finish times
- Critical path identified where earliest = latest times

*User Interface:*
- Color-coded critical path tasks (red border + badge)
- Inline dependency management within each task
- One-click dependency addition/removal
- Real-time graph updates
- Dependency visualization with arrows showing relationships
- Critical path alert banner showing project impact

*Data Structure:*
- Self-referential many-to-many relationship in Prisma
- Bidirectional navigation (dependencies and dependents)
- Join table automatically managed by Prisma

### Key Files Modified/Added

**Database & Schema:**
- `prisma/schema.prisma` - Extended with dependencies and duration fields
- `lib/graphUtils.ts` - Graph algorithms for dependency analysis

**Backend API:**
- `app/api/todos/route.ts` - Enhanced with dependency data and scheduling
- `app/api/todos/dependencies/route.ts` - New endpoint for dependency management

**Frontend:**
- `app/page.tsx` - Main interface with dependency management UI
- `app/components/DependencyGraph.tsx` - Graph visualization component

### Running the Solution

```bash
npm install
npx prisma migrate dev
npm run dev
```

Visit `http://localhost:3000` to see the application in action.

### Usage Guide

1. **Create a Task**: Enter title, optional due date, and duration (in days)
2. **Add Dependencies**: Click "Add Dependencies" on any task, select prerequisite tasks
3. **View Schedule**: See earliest start dates calculated automatically
4. **Check Critical Path**: Tasks on critical path are highlighted in red
5. **Visualize Graph**: Click "View Dependency Graph" to see full project structure

### Technologies Used

- **Next.js 15** - React framework with App Router
- **Prisma** - Type-safe ORM with SQLite
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS** - Utility-first styling
- **Pexels API** - Image search and retrieval
- **SVG** - Custom dependency graph rendering

## Submission:

1. https://youtu.be/c7jSVkW_0-g youtube link to the walkthrough

Thanks for your time and effort. We'll be in touch soon!
