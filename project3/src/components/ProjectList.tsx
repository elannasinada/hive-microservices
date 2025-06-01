import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Users, Plus, Search, Target, ClipboardList, MoreHorizontal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { projectAPI } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import TaskForm from './TaskForm';
import ProjectEditForm from './ProjectEditForm';

interface ProjectListProps {
  projects: any[];
  onUpdate: () => void;
}

// Helper to format dates
function formatDate(date: any) {
  if (!date) return 'No date available';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return date;
  }
}


function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return "Unknown duration";
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    const roundedMonths = diffMonths + (end.getDate() >= start.getDate() ? 0 : -1) + 1;
    return roundedMonths <= 0 ? "Less than a month" : `${roundedMonths} ${roundedMonths === 1 ? 'month' : 'months'}`;
  } catch {
    return "Unknown duration";
  }
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onUpdate }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [projectTasks, setProjectTasks] = useState<{ [projectId: string]: any[] }>({});
  
  // New: Cache members for each project
  const [projectMembersById, setProjectMembersById] = useState<{ [projectId: string]: any[] }>({});

  // Member management state
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Task management state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState<any>(null);

  // Edit project state
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any>(null);

  // Check if user can manage tasks
  const canManageTasks = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      let results;
      if (searchTerm.trim()) {
        results = await projectAPI.searchByName(searchTerm);
      } else {
        results = await projectAPI.search();
      }
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Error",
        description: "Failed to search projects",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const displayProjects = searchResults.length > 0 ? searchResults : projects;

  // Fetch tasks for all displayed projects
  useEffect(() => {
    const fetchTasksForProjects = async () => {
      const tasksByProject: { [projectId: string]: any[] } = {};
      await Promise.all(
        displayProjects.map(async (project: any) => {
          const projectId = project.id || project.projectId;
          try {
            const tasks = await (window as any).taskAPI
              ? (window as any).taskAPI.search({ projectId })
              : (await import('@/utils/api')).taskAPI.search({ projectId });
            tasksByProject[projectId] = tasks || [];
          } catch {
            tasksByProject[projectId] = [];
          }
        })
      );
      setProjectTasks(tasksByProject);
    };
    if (displayProjects.length > 0) fetchTasksForProjects();
  }, [displayProjects]);

  // Fetch members for a project and cache them
  const fetchMembers = async (projectId: string) => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      const data = await projectAPI.listMembers(projectId);
      // Filter out PROJECT_LEADER users from the members list
      const filteredMembers = (data.projectMembers || []).filter((member: any) => {
        const userRoles = Array.isArray(member.roles)
          ? member.roles.map((r: any) => typeof r === 'string' ? r : r.role)
          : [];
        const isProjectLeader = userRoles.some((role: string) =>
          role === 'ROLE_PROJECT_LEADER' || role === 'PROJECT_LEADER');
        return !isProjectLeader;
      });
      setMembers(filteredMembers);
      setProjectMembersById(prev => ({ ...prev, [projectId]: filteredMembers }));
    } catch (err: any) {
      setMemberError('Failed to load project members');
    } finally {
      setMemberLoading(false);
    }
  };

  // Fetch team members (for adding new members)
  const fetchTeamMembers = async () => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      let users = [];
      try {
        users = await (await import('@/utils/api')).adminAPI.getAllUsers();
      } catch (adminError) {
        try {
          users = await (await import('@/utils/api')).authAPI.getAllUsers();
        } catch (authError) {
          users = [];
        }
      }
      const formattedUsers = users
        .map((user: any) => ({
          userId: user.userId || user.user_id || user.id,
          username: user.actualUsername || user.username || 'Unknown User',
          email: user.email || 'No Email',
          department: user.department || (user.departments && user.departments.length > 0 ? user.departments[0].department : null),
          roles: user.roles || []
        }))
        .filter((user: any) => {
          const userRoles = Array.isArray(user.roles)
            ? user.roles.map((r: any) => typeof r === 'string' ? r : r.role)
            : [];
          const isAdmin = userRoles.some((role: string) => role === 'ROLE_ADMIN' || role === 'ADMIN');
          const isProjectLeader = userRoles.some((role: string) => role === 'ROLE_PROJECT_LEADER' || role === 'PROJECT_LEADER');
          return !isAdmin && !isProjectLeader;
        });
      setTeamMembers(formattedUsers || []);
    } catch (err: any) {
      setMemberError('Failed to load team members');
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    if (showMemberModal && selectedProject) {
      fetchMembers(selectedProject.projectId);
      fetchTeamMembers();
    }
  }, [showMemberModal, selectedProject]);

  // Add member and refresh cache
  const handleAddMember = async (userId: string) => {
    setActionLoading(true);
    try {
      await projectAPI.addMember(selectedProject.projectId, userId);
      toast({ title: 'Success', description: 'Member added.' });
      fetchMembers(selectedProject.projectId); // refresh cache
      onUpdate();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.age ||
        err?.message ||
        'Failed to add member';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Remove member and refresh cache
  const handleRemoveMember = async (userId: string) => {
    setActionLoading(true);
    try {
      await projectAPI.removeMember(selectedProject.projectId, userId);
      toast({ title: 'Success', description: 'Member removed.' });
      fetchMembers(selectedProject.projectId); // refresh cache
      onUpdate();
    } catch {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTask = (project: any) => {
    setSelectedProjectForTask(project);
    setShowTaskForm(true);
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    setSelectedProjectForTask(null);
    onUpdate();
    if (selectedProjectForTask) {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Search Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search for projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border-accent/30 focus:border-primary"
            />
            <Button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-primary hover:bg-secondary text-white"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProjects.map((project: any) => {
          const projectId = project.id || project.projectId;
          const rawTasks = projectTasks[projectId];
          const tasks = Array.isArray(rawTasks) ? rawTasks : [];
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          let progressColor = 'bg-red-500';
          if (progress > 70) progressColor = 'bg-green-500';
          else if (progress > 30) progressColor = 'bg-yellow-500';

          // Any PROJECT_LEADER can manage members, not just those who are members of the project
          const canManageMembers = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

          // Use formatted dates
          const formattedStartDate = formatDate(project.startDate);
          const formattedEndDate = formatDate(project.endDate);
            const duration = calculateDuration(project.startDate, project.endDate);

          // Use the correct member count
          const memberCount = (project.members && Array.isArray(project.members.projectMembers))
            ? project.members.projectMembers.length
            : (project.memberCount || 0);

          return (
            <Card key={projectId} className="border-accent/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-primary text-lg">{project.projectName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-accent text-secondary">
                      Active
                    </Badge>
                    <button
                      className="p-1 rounded hover:bg-accent/10"
                      title="Edit Project"
                      onClick={() => { setProjectToEdit(project); setShowEditProjectModal(true); }}
                    >
                      <MoreHorizontal className="w-5 h-5 text-secondary" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-secondary/70 text-sm mb-4 line-clamp-2">
                  {project.projectDescription || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-xs text-secondary/60 mb-2">
                  <span>
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {formattedStartDate}
                  </span>
                  <span>
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {formattedEndDate}
                  </span>
                  <span>
                    Duration: {duration}
                  </span>
                </div>
                {/* Project Statistics */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {tasks.filter((t: any) => t.status === 'to_do').length}
                    </div>
                    <div className="text-xs text-secondary/60">To Do</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {tasks.filter((t: any) => t.status === 'in_progress').length}
                    </div>
                    <div className="text-xs text-secondary/60">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {completedTasks}
                    </div>
                    <div className="text-xs text-secondary/60">Completed</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Overall Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} indicatorClassName={progressColor} />
                </div>
                <div className="flex items-center text-secondary/60 text-sm mb-3">
                  <Users className="w-4 h-4 mr-2"/>
                  {memberCount} members
                  <span className="mx-2">•</span>
                  <ClipboardList className="w-4 h-4 mr-1"/>
                  {totalTasks} task{totalTasks !== 1 ? 's' : ''} total
                </div>
                <div className="space-y-2">
                  {canManageMembers && (
                      <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                          onClick={() => { setSelectedProject(project); setShowMemberModal(true); }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Members
                    </Button>
                  )}
                  {canManageTasks && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-accent text-accent hover:bg-accent hover:text-white"
                      onClick={() => handleAddTask(project)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displayProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-secondary/70">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first project to get started'}
          </p>
        </div>
      )}

      {/* Member Management Modal */}
      {showMemberModal && selectedProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Manage Members for {selectedProject.projectName}</h2>
            {memberLoading ? (
              <p>Loading...</p>
            ) : memberError ? (
              <p className="text-red-500">{memberError}</p>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Current Members</h3>
                  <ul className="mb-2">
                    {members.length === 0 && <li className="text-secondary/60">No members yet.</li>}
                    {members.map((m) => (
                      <li key={m.userId} className="flex items-center justify-between py-1">
                        <span>{m.username}</span>
                        <Button size="sm" variant="destructive" disabled={actionLoading} onClick={() => handleRemoveMember(m.userId)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Add a Team Member</h3>
                  <ul>
                    {teamMembers.filter((tm) => !members.some((m) => m.userId === tm.userId)).map((tm) => (
                      <li key={tm.userId} className="flex items-center justify-between py-1">
                        <span>{tm.username}</span>
                        <Button size="sm" disabled={actionLoading} onClick={() => handleAddMember(tm.userId)}>
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            <Button className="mt-4" onClick={() => setShowMemberModal(false)}>Close</Button>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && selectedProjectForTask && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onSuccess={handleTaskCreated}
          projects={[selectedProjectForTask]}
        />
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && projectToEdit && (
        <ProjectEditForm
          project={projectToEdit}
          onClose={() => { setShowEditProjectModal(false); setProjectToEdit(null); }}
          onSuccess={() => { setShowEditProjectModal(false); setProjectToEdit(null); onUpdate(); }}
        />
      )}
    </div>
  );
};

export default ProjectList;
