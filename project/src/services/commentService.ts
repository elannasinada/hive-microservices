import { apiClient } from './apiClient';

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  entityId: string; // projectId or taskId
  entityType: 'project' | 'task';
};

export type CreateCommentRequest = {
  content: string;
  entityId: string;
  entityType: 'project' | 'task';
};

const commentService = {
  getComments: async (entityId: string, entityType: 'project' | 'task'): Promise<Comment[]> => {
    try {
      const response = await apiClient.get(`/api/v1/comment/${entityType}/${entityId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for ${entityType} ${entityId}:`, error);
      throw new Error('Failed to fetch comments');
    }
  },

  createComment: async (comment: CreateCommentRequest): Promise<Comment> => {
    try {
      const response = await apiClient.post('/api/v1/comment', comment);
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    try {
      const response = await apiClient.put(`/api/v1/comment/${commentId}`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error updating comment ${commentId}:`, error);
      throw new Error('Failed to update comment');
    }
  },

  deleteComment: async (commentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/comment/${commentId}`);
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw new Error('Failed to delete comment');
    }
  },
};

export { commentService };