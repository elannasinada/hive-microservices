const API_BASE = 'http://localhost:9999';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        if (errorData && errorData.errorMessage) {
          errorMsg = errorData.errorMessage;
        }
      } catch (e) {
        // fallback to default errorMsg
      }
      const error = new Error(errorMsg);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: (userData: any) => apiRequest('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  login: (credentials: any) => apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  authenticate: () => apiRequest('/api/v1/auth/authenticate', { method: 'POST' }),
  getAccountVerification: (token: string) => apiRequest(`/api/v1/auth/accountVerification/${token}`),
  postAccountVerification: (token: string) => apiRequest(`/api/v1/auth/accountVerification/${token}`, { method: 'POST' }),
  updateProfilePicture: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(`/api/v1/auth/update-profile-picture/${userId}`, {
      method: 'PUT',
      body: formData,
      // Do NOT set Content-Type header for FormData
      headers: {
        // Existing headers from apiRequest will be applied, including Authorization
      },
    });
  },
  getAllUsers: () => apiRequest('/api/v1/auth/users'),
  getCurrentUser: () => apiRequest('/api/v1/inter-communication/current-user-dto'),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => apiRequest('/api/v1/admin/users'),
  getUsersByDepartment: (department: string) => apiRequest(`/api/v1/admin/users/by-department?department=${encodeURIComponent(department)}`),
  getUserById: (userId: string) => apiRequest(`/api/v1/admin/users/${userId}`),
  updateUser: (userId: string, userData: any) => apiRequest(`/api/v1/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  toggleUserActivation: (userId: string, active: boolean) => apiRequest(`/api/v1/admin/users/${userId}/activate?active=${active}`, {
    method: 'PUT'
  }),
  changeUserRole: (userId: string, role: string) => apiRequest(`/api/v1/admin/users/${userId}/role?role=${role}`, {
    method: 'PUT'
  }),
};

// Demo/Testing API
export const demoAPI = {
  getProjectLeaders: () => apiRequest('/authenticated/pl'),
  getAdmins: () => apiRequest('/authenticated/pa'),
  getTeamMembers: () => apiRequest('/authenticated/tm'),
  getAll: () => apiRequest('/authenticated/all'),
};

// Project API
export const projectAPI = {
  create: (projectData: any) => apiRequest('/api/v1/project/create-project', {
    method: 'POST',
    body: JSON.stringify(projectData)
  }),
  listMembers: (projectId: string) => apiRequest(`/api/v1/project/list-members/${projectId}`),
  search: () => apiRequest('/api/v1/search_project'),
  searchByName: (projectName: string) => apiRequest(`/api/v1/search_project/${projectName}`),
  addMember: (projectId: string, userId: string) => apiRequest(`/api/v1/project/${projectId}/add-member/${userId}`, { method: 'POST' }),
  removeMember: (projectId: string, userId: string) => apiRequest(`/api/v1/project/${projectId}/remove-member/${userId}`, { method: 'DELETE' }),
  getActiveProjectForUser: (userId: string) => apiRequest(`/api/v1/project/inter-communication/active-project/${userId}`),
  getCompletedProjectsForUser: (userId: string) => apiRequest(`/api/v1/project/inter-communication/completed-projects/${userId}`),
};

// Task API
export const taskAPI = {
  create: (projectId: string, taskData: any) => apiRequest(`/api/v1/task/management/new-task/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),
  update: (taskId: string, taskData: any) => apiRequest(`/api/v1/task/management/update-task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  }),
  get: (taskId: string) => apiRequest(`/api/v1/task/management/task/${taskId}`),
  delete: (projectId: string, taskId: string) => apiRequest(`/api/v1/task/management/deleteTask/projectId/${projectId}/taskId/${taskId}`, {
    method: 'DELETE'
  }),
  search: (params?: any) => {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(`/api/v1/task/management/searchTasks${queryParams}`);
  },
  export: () => apiRequest('/api/v1/task/management/exportTasks'),
  assignToUsers: (assignmentData: any) => apiRequest('/api/v1/task/assignment/assignTaskToUsers', {
    method: 'POST',
    body: JSON.stringify(assignmentData)
  }),
  assignToAll: (assignmentData: any) => apiRequest('/api/v1/task/assignment/assignTask/all', {
    method: 'POST',
    body: JSON.stringify(assignmentData)
  }),
  unassign: (unassignData: any) => apiRequest('/api/v1/task/assignment/unassignTask', {
    method: 'DELETE',
    body: JSON.stringify(unassignData)
  }),
  unassignAll: (unassignData: any) => apiRequest('/api/v1/task/assignment/unassignTask/all', {
    method: 'DELETE',
    body: JSON.stringify(unassignData)
  }),
  updateProgress: (taskId: string, projectId: string, progressData: any) => apiRequest(`/api/v1/task/progress/${taskId}/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(progressData)
  }),
  fetchTasks: () => apiRequest('/api/v1/task/management/searchTasks'),
};

// Comment API
export const commentAPI = {
  onProject: (commentData: any) => apiRequest('/api/v1/comment/on-project', {
    method: 'POST',
    body: JSON.stringify(commentData)
  }),
  onTask: (commentData: any) => apiRequest('/api/v1/comment/on-task', {
    method: 'POST',
    body: JSON.stringify(commentData)
  }),
};