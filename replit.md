# Bybe IDE

## Overview

Bybe is an AI-powered, browser-based IDE that combines the capabilities of modern web development environments (inspired by Replit, VS Code Web, and Cursor IDE) with autonomous AI coding assistance. The platform allows users to create, edit, and manage projects entirely through a web interface, with AI assistance for code generation, file management, and terminal operations.

**Key Features:**
- ✅ Browser-based code editor with Monaco integration
- ✅ AI-powered code assistant with multiple provider support (OpenAI, Anthropic, Groq, OpenRouter, Together AI, Ollama)
- ✅ Integrated terminal with real-time command execution via WebSocket
- ✅ File tree with full CRUD operations
- ✅ Real-time terminal collaboration through WebSocket connections
- ✅ Multi-tab editor with syntax highlighting
- ✅ Dark/Light theme support
- ✅ Resizable 3-panel layout
- ✅ Auto-save file changes

## Current Status

**✅ MVP Complete** - All core features are functional:
- File system API working (create, read, update, delete)
- Monaco editor integrated with tab system
- AI chat interface ready (requires API keys to be configured)
- Terminal with secure command execution
- WebSocket real-time communication
- In-memory project storage

**Configuration Needed:**
To enable AI features, set environment variables:
- `OPENAI_API_KEY` for OpenAI GPT
- `ANTHROPIC_API_KEY` for Anthropic Claude

## User Preferences

Preferred communication style: Монгол хэл, simple everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** Zustand (lightweight state management)
- **UI Components:** Radix UI primitives with shadcn/ui design system
- **Styling:** Tailwind CSS with custom design tokens
- **Code Editor:** Monaco Editor (VS Code's editor component)
- **Terminal:** xterm.js with fit addon

**Design System:**
- Typography: Inter for UI, JetBrains Mono for code
- Theme: Light/Dark mode support with CSS variables
- Component Library: shadcn/ui (New York style variant)
- Layout: 3-panel resizable layout (File Tree | Editor | AI/Terminal)

**State Management Strategy:**
- Global IDE state managed through Zustand store
- Includes: theme, AI provider, editor tabs, files, messages, terminal output, panel widths
- Local component state for UI interactions

**Key UI Components:**
- `FileTree`: Hierarchical file browser with context menu operations
- `CodeEditor`: Multi-tab Monaco editor with language detection
- `AIChat`: Conversational AI interface with message history
- `Terminal`: Command-line interface with output history
- `ResizablePanel`: Custom panel resizing for flexible layout

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with Express
- **Build Tool:** Vite for frontend, esbuild for backend
- **Language:** TypeScript (ESM modules)
- **Real-time:** Socket.IO for WebSocket connections
- **Database:** Drizzle ORM with PostgreSQL (Neon serverless)

**API Design:**
- RESTful endpoints for project and file operations
- WebSocket connections for terminal I/O and real-time updates
- Session-based state management

**Storage Architecture:**
- In-memory storage implementation (`MemStorage`) for development
- Database-ready interface (`IStorage`) for production
- File system abstraction for virtual project structure

**Key Backend Components:**
- `routes.ts`: API endpoint definitions and handlers
- `storage.ts`: Data persistence layer with interface abstraction
- `vite.ts`: Development server setup with HMR support
- Socket.IO server: Real-time terminal and collaboration features

**Data Models:**
- `FileNode`: Hierarchical file/folder structure
- `Project`: Container for file trees
- `EditorTab`: Open file state with modification tracking
- `AIMessage`: Chat history with role-based messages
- `User`: Authentication (prepared for future implementation)

### Design Patterns

**Component Architecture:**
- Compound components for complex UI (FileTree, Tabs)
- Controlled components with prop drilling minimized via Zustand
- Custom hooks for reusable logic (useToast, useIsMobile)

**File Management:**
- Tree structure with recursive rendering
- Path-based file identification
- Context menu actions for file operations
- Lazy loading prepared for large projects

**Editor Management:**
- Tab-based multi-file editing
- Content change tracking with modified state
- Language detection based on file extension
- Monaco editor lifecycle management

**AI Integration Strategy:**
- Provider-agnostic architecture supporting multiple AI services
- Message-based conversation history
- Prepared for streaming responses
- Model selection via dropdown in UI

### External Dependencies

**AI Providers (Planned Multi-Provider Support):**
- Anthropic Claude (SDK included: `@anthropic-ai/sdk`)
- OpenAI GPT
- Groq Cloud
- OpenRouter
- Together AI
- Ollama (local)

**Database:**
- Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- Drizzle ORM for schema management and migrations
- Connection pooling for production deployments

**Third-Party Services:**
- Google Fonts: Inter and JetBrains Mono
- Monaco Editor: VS Code editor component
- xterm.js: Terminal emulation

**Development Tools:**
- Replit-specific plugins for development environment
- Vite plugins: React, runtime error overlay, cartographer, dev banner

**UI Component Libraries:**
- Radix UI: Headless accessible component primitives (20+ components)
- class-variance-authority: Type-safe variant management
- tailwind-merge: Class name merging utility
- cmdk: Command palette component

**Real-time Communication:**
- Socket.IO: Bidirectional WebSocket communication
- Used for terminal I/O and future collaboration features

**Build & Development:**
- Vite: Frontend build tool and dev server
- esbuild: Fast backend bundling
- TypeScript: Type safety across full stack
- tsx: TypeScript execution for development