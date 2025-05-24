import { apiClient } from './apiClient';

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  members: number;
  tasks: number;
  status: 'active' | 'archived' | 'completed';
};

export type CreateProjectRequest = {
  name: string;
  description: string;
};

const projectService = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await apiClient.get('/api/v1/project');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Failed to fetch projects');
    }
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    try {
      const response = await apiClient.get(`/api/v1/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw new Error('Failed to fetch project');
    }
  },

  createProject: async (project: CreateProjectRequest): Promise<Project> => {
    try {
      const response = await apiClient.post('/api/v1/project', project);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  },

  updateProject: async (projectId: string, project: Partial<CreateProjectRequest>): Promise<Project> => {
    try {
      const response = await apiClient.put(`/api/v1/project/${projectId}`, project);
      return response.data;
    } catch (error) {
      console.error(`Error updating project ${projectId}:`, error);
      throw new Error('Failed to update project');
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/project/${projectId}`);
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error);
      throw new Error('Failed to delete project');
    }
  },

  searchProjects: async (query: string): Promise<Project[]> => {
    try {
      const response = await apiClient.get(`/api/v1/search_project?query=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching projects:', error);
      throw new Error('Failed to search projects');
    }
  },
};

export { projectService };