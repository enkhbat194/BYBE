import { type User, type InsertUser, type FileNode, type Project } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProject(id: string): Promise<Project | undefined>;
  createProject(name: string): Promise<Project>;
  updateProject(id: string, files: FileNode[]): Promise<Project>;
  
  getFile(projectId: string, path: string): Promise<FileNode | undefined>;
  createFile(projectId: string, file: FileNode, parentPath?: string): Promise<FileNode>;
  updateFile(projectId: string, path: string, content: string): Promise<FileNode>;
  deleteFile(projectId: string, path: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    
    const defaultProject: Project = {
      id: 'default',
      name: 'My Project',
      files: this.createDefaultFiles(),
    };
    this.projects.set('default', defaultProject);
  }

  private createDefaultFiles(): FileNode[] {
    return [
      {
        id: '1',
        name: 'src',
        type: 'folder',
        path: '/src',
        children: [
          {
            id: '2',
            name: 'components',
            type: 'folder',
            path: '/src/components',
            children: [
              {
                id: '3',
                name: 'App.tsx',
                type: 'file',
                path: '/src/components/App.tsx',
                content: 'import React from "react";\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Hello Bybe IDE!</h1>\n      <p>Start coding with AI assistance!</p>\n    </div>\n  );\n}\n\nexport default App;'
              },
              {
                id: '4',
                name: 'Header.tsx',
                type: 'file',
                path: '/src/components/Header.tsx',
                content: 'export default function Header() {\n  return (\n    <header>\n      <h1>My Application</h1>\n    </header>\n  );\n}'
              },
            ],
          },
          {
            id: '5',
            name: 'index.ts',
            type: 'file',
            path: '/src/index.ts',
            content: 'import App from "./components/App";\n\nconsole.log("Application loaded successfully");\n\nconst root = document.getElementById("root");\nif (root) {\n  // Render app\n}'
          },
          {
            id: '6',
            name: 'utils.ts',
            type: 'file',
            path: '/src/utils.ts',
            content: 'export function add(a: number, b: number): number {\n  return a + b;\n}\n\nexport function formatDate(date: Date): string {\n  return date.toLocaleDateString();\n}'
          },
        ],
      },
      {
        id: '7',
        name: 'public',
        type: 'folder',
        path: '/public',
        children: [
          {
            id: '8',
            name: 'index.html',
            type: 'file',
            path: '/public/index.html',
            content: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>My App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script src="/src/index.ts"></script>\n  </body>\n</html>'
          },
        ],
      },
      {
        id: '9',
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  }\n}'
      },
      {
        id: '10',
        name: 'README.md',
        type: 'file',
        path: '/README.md',
        content: '# My Project\n\nWelcome to my awesome project built with Bybe IDE!\n\n## Features\n- AI-powered development\n- Real-time code editing\n- Terminal integration\n\n## Getting Started\n```bash\nnpm install\nnpm run dev\n```'
      },
    ];
  }

  private findFileInTree(files: FileNode[], path: string): FileNode | undefined {
    for (const file of files) {
      if (file.path === path) return file;
      if (file.children) {
        const found = this.findFileInTree(file.children, path);
        if (found) return found;
      }
    }
    return undefined;
  }

  private updateFileInTree(files: FileNode[], path: string, content: string): boolean {
    for (const file of files) {
      if (file.path === path && file.type === 'file') {
        file.content = content;
        return true;
      }
      if (file.children) {
        if (this.updateFileInTree(file.children, path, content)) return true;
      }
    }
    return false;
  }

  private deleteFileInTree(files: FileNode[], path: string): boolean {
    for (let i = 0; i < files.length; i++) {
      if (files[i].path === path) {
        files.splice(i, 1);
        return true;
      }
      if (files[i].children) {
        if (this.deleteFileInTree(files[i].children!, path)) return true;
      }
    }
    return false;
  }

  private insertFileInTree(files: FileNode[], file: FileNode, parentPath?: string): boolean {
    if (!parentPath || parentPath === '/') {
      files.push(file);
      return true;
    }

    for (const node of files) {
      if (node.path === parentPath && node.type === 'folder') {
        if (!node.children) node.children = [];
        node.children.push(file);
        return true;
      }
      if (node.children) {
        if (this.insertFileInTree(node.children, file, parentPath)) return true;
      }
    }
    return false;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(name: string): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      id,
      name,
      files: [],
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, files: FileNode[]): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error('Project not found');
    project.files = files;
    return project;
  }

  async getFile(projectId: string, path: string): Promise<FileNode | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;
    return this.findFileInTree(project.files, path);
  }

  async createFile(projectId: string, file: FileNode, parentPath?: string): Promise<FileNode> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');
    
    const inserted = this.insertFileInTree(project.files, file, parentPath);
    if (!inserted) throw new Error('Parent folder not found');
    
    return file;
  }

  async updateFile(projectId: string, path: string, content: string): Promise<FileNode> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');
    
    const updated = this.updateFileInTree(project.files, path, content);
    if (!updated) throw new Error('File not found');
    
    const file = this.findFileInTree(project.files, path);
    if (!file) throw new Error('File not found after update');
    
    return file;
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');
    
    const deleted = this.deleteFileInTree(project.files, path);
    if (!deleted) throw new Error('File not found');
  }
}

export const storage = new MemStorage();
