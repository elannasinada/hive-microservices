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
  projectId: string;
  assignedTo?: string[];
  dueDate?: string;
};

const taskService = {
  getTasks: async (projectId: string): Promise<Task[]> => {
    try {
      const response = await apiClient.get(`/api/v1/task/management/searchTasks?projectId=${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  },

  getTaskById: async (taskId: string): Promise<Task> => {
    try {
      const response = await apiClient.get(`/api/v1/task/management/task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${taskId}:`, error);
      throw new Error('Failed to fetch task');
    }
  },

  createTask: async (projectId: string, task: Omit<CreateTaskRequest, 'projectId'>): Promise<Task> => {
    try {
      const response = await apiClient.post(`/api/v1/task/management/new-task/${projectId}`, {
        ...task,
        projectId,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  },

  updateTask: async (taskId: string, task: Partial<CreateTaskRequest>): Promise<Task> => {
    try {
      const response = await apiClient.put(`/api/v1/task/management/update-task/${taskId}`, task);
      return response.data;
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw new Error('Failed to update task');
    }
  },

  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/task/management/deleteTask/projectId/${projectId}/taskId/${taskId}`);
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      throw new Error('Failed to delete task');
    }
  },

  assignTaskToUsers: async (taskId: string, userIds: string[]): Promise<void> => {
    try {
      await apiClient.post('/api/v1/task/assignment/assignTaskToUsers', {
        taskId,
        userIds,
      });
    } catch (error) {
      console.error('Error assigning task to users:', error);
      throw new Error('Failed to assign task to users');
    }
  },

  unassignTaskFromUsers: async (taskId: string, userIds: string[]): Promise<void> => {
    try {
      await apiClient.delete('/api/v1/task/assignment/unassignTask', {
        data: {
          taskId,
          userIds,
        },
      });
    } catch (error) {
      console.error('Error unassigning task from users:', error);
      throw new Error('Failed to unassign task from users');
    }
  },

  searchTasks: async (params: {
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
    assignedTo_UserId?: string;
  }): Promise<Task[]> => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      
      const response = await apiClient.get(`/api/v1/task/management/searchTasks?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw new Error('Failed to search tasks');
    }
  },
};

export { taskService };