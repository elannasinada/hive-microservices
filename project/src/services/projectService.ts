import { apiClient } from './apiClient';

export type Project = {
  id: string;
  projectName: string;
  projectDescription: string;
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
  getProjectMembers: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/project/list-members/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching members for project ${projectId}:`, error);
      throw new Error('Failed to fetch project members');
    }
  },
};

export { projectService };