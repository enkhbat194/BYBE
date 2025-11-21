import type { FileNode, AIMessage, Project } from '@shared/schema';
import { io, Socket } from 'socket.io-client';

const API_BASE = '/api';

export const api = {
  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async getFiles(projectId: string): Promise<FileNode[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files`);
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  async getFile(projectId: string, path: string): Promise<FileNode> {
    const encodedPath = path.substring(1);
    const res = await fetch(`${API_BASE}/projects/${projectId}/files/${encodedPath}`);
    if (!res.ok) throw new Error('Failed to fetch file');
    return res.json();
  },

  async updateFile(projectId: string, path: string, content: string): Promise<FileNode> {
    const encodedPath = path.substring(1);
    const res = await fetch(`${API_BASE}/projects/${projectId}/files/${encodedPath}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to update file');
    return res.json();
  },

  async createFile(
    projectId: string,
    name: string,
    type: 'file' | 'folder',
    path: string,
    content?: string
  ): Promise<FileNode> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, path, content }),
    });
    if (!res.ok) throw new Error('Failed to create file');
    return res.json();
  },

  async deleteFile(projectId: string, path: string): Promise<void> {
    const encodedPath = path.substring(1);
    const res = await fetch(`${API_BASE}/projects/${projectId}/files/${encodedPath}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete file');
  },

  async sendAIMessage(message: string, provider: string): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, provider }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to get AI response');
    }
    const data = await res.json();
    return data.response;
  },
};

export class TerminalSocket {
  private socket: Socket | null = null;
  private onOutputCallback: ((output: string, type: string) => void) | null = null;

  connect() {
    this.socket = io({
      path: '/socket.io',
    });

    this.socket.on('connect', () => {
      console.log('Terminal connected');
    });

    this.socket.on('output', (data: { output: string; type: string }) => {
      if (this.onOutputCallback) {
        this.onOutputCallback(data.output, data.type);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Terminal disconnected');
    });

    return this;
  }

  onOutput(callback: (output: string, type: string) => void) {
    this.onOutputCallback = callback;
    return this;
  }

  sendCommand(command: string) {
    if (this.socket) {
      this.socket.emit('command', { command });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
