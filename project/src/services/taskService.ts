import { apiClient } from './apiClient';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedTo: string[];
  createdAt: string;
  dueDate?: string;
};

export type CreateTaskRequest = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string[];
  dueDate?: string;
};

const taskService = {
  // POST /api/v1/task/management/new-task/{projectId}
  createTask: async (projectId: string, task: CreateTaskRequest) => {
    try {
      const response = await apiClient.post(`/api/v1/task/management/new-task/${projectId}`, task);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  },

  // PUT /api/v1/task/management/update-task/{taskId}
  updateTask: async (taskId: string, task: Partial<CreateTaskRequest>) => {
    try {
      const response = await apiClient.put(`/api/v1/task/management/update-task/${taskId}`, task);
      return response.data;
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw new Error('Failed to update task');
    }
  },

  // GET /api/v1/task/management/task/{taskId}
  getTaskById: async (taskId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/task/management/task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${taskId}:`, error);
      throw new Error('Failed to fetch task');
    }
  },

  // DELETE /api/v1/task/management/deleteTask/projectId/{projectId}/taskId/{taskId}
  deleteTask: async (projectId: string, taskId: string) => {
    try {
      await apiClient.delete(`/api/v1/task/management/deleteTask/projectId/${projectId}/taskId/${taskId}`);
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      throw new Error('Failed to delete task');
    }
  },

  // GET /api/v1/task/management/searchTasks
  searchTasks: async (params: {
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
    assignedTo_UserId?: string;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const response = await apiClient.get(`/api/v1/task/management/searchTasks?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw new Error('Failed to search tasks');
    }
  },

  // GET /api/v1/task/management/exportTasks
  exportTasks: async () => {
    try {
      const response = await apiClient.get('/api/v1/task/management/exportTasks', { responseType: 'blob' });
      return response.data;
    } catch (error) {
      console.error('Error exporting tasks:', error);
      throw new Error('Failed to export tasks');
    }
  },

  // POST /api/v1/task/assignment/assignTaskToUsers
  assignTaskToUsers: async (payload: { taskId: string; userIds: string[] }) => {
    try {
      await apiClient.post('/api/v1/task/assignment/assignTaskToUsers', payload);
    } catch (error) {
      console.error('Error assigning task to users:', error);
      throw new Error('Failed to assign task to users');
    }
  },

  // POST /api/v1/task/assignment/assignTask/all
  assignTaskToAll: async (payload: { taskId: string }) => {
    try {
      await apiClient.post('/api/v1/task/assignment/assignTask/all', payload);
    } catch (error) {
      console.error('Error assigning task to all:', error);
      throw new Error('Failed to assign task to all');
    }
  },

  // DELETE /api/v1/task/assignment/unassignTask
  unassignTask: async (payload: { taskId: string; userIds: string[] }) => {
    try {
      await apiClient.delete('/api/v1/task/assignment/unassignTask', { data: payload });
    } catch (error) {
      console.error('Error unassigning task:', error);
      throw new Error('Failed to unassign task');
    }
  },

  // DELETE /api/v1/task/assignment/unassignTask/all
  unassignTaskAll: async (payload: { taskId: string }) => {
    try {
      await apiClient.delete('/api/v1/task/assignment/unassignTask/all', { data: payload });
    } catch (error) {
      console.error('Error unassigning all users from task:', error);
      throw new Error('Failed to unassign all users from task');
    }
  },

  // POST /api/v1/task/progress/{taskId}/{projectId}
  updateTaskProgress: async (taskId: string, projectId: string, payload: any) => {
    try {
      await apiClient.post(`/api/v1/task/progress/${taskId}/${projectId}`, payload);
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw new Error('Failed to update task progress');
    }
  },
};

export { taskService };