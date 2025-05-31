import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Users, Plus, Search, Target, ClipboardList } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { projectAPI } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import TaskForm from './TaskForm';

interface ProjectListProps {
  projects: any[];
  onUpdate: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onUpdate }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [projectTasks, setProjectTasks] = useState<{ [projectId: string]: any[] }>({});
  
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

  const fetchMembers = async (projectId: string) => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      const data = await projectAPI.listMembers(projectId);
      setMembers(data.projectMembers || []);
    } catch (err: any) {
      setMemberError('Failed to load project members');
    } finally {
      setMemberLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      const all = await (await import('@/utils/api')).demoAPI.getTeamMembers();
      setTeamMembers(all || []);
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

  const handleAddMember = async (userId: string) => {
    setActionLoading(true);
    try {
      await projectAPI.addMember(selectedProject.projectId, userId);
      toast({ title: 'Success', description: 'Member added.' });
      fetchMembers(selectedProject.projectId);
      onUpdate();
    } catch {
      toast({ title: 'Error', description: 'Failed to add member', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };
  const handleRemoveMember = async (userId: string) => {
    setActionLoading(true);
    try {
      await projectAPI.removeMember(selectedProject.projectId, userId);
      toast({ title: 'Success', description: 'Member removed.' });
      fetchMembers(selectedProject.projectId);
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
    // Refresh project tasks
    if (selectedProjectForTask) {
      const projectId = selectedProjectForTask.id || selectedProjectForTask.projectId;
      setTimeout(() => {
        // Refresh tasks for this project
        window.location.reload(); // Simple refresh - could be optimized
      }, 500);
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

          // For start/end date, fallback to tasks if not present in project
          const startDate = project.startDate || (tasks.length > 0 ? tasks.reduce((min, t) => t.createdAt < min ? t.createdAt : min, tasks[0].createdAt) : null);
          const endDate = project.endDate || (tasks.length > 0 ? tasks.reduce((max, t) => t.dueDate > max ? t.dueDate : max, tasks[0].dueDate) : null);

          const canManageMembers = user && (user.roles.includes('ADMIN') || (user.roles.includes('PROJECT_LEADER') && user.id === project.leaderId));

          return (
            <Card key={projectId} className="border-accent/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-primary text-lg">{project.projectName}</CardTitle>
                  <Badge variant="outline" className="border-accent text-secondary">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-secondary/70 text-sm mb-4 line-clamp-2">
                  {project.projectDescription || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-xs text-secondary/60 mb-2">
                  <span>
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {startDate ? new Date(startDate).toLocaleDateString() : 'No start date'}
                  </span>
                  <span>
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {endDate ? new Date(endDate).toLocaleDateString() : 'No deadline'}
                  </span>
                </div>                {/* Project Statistics */}
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
                  <Users className="w-4 h-4 mr-2" />
                  {project.memberCount || 0} members
                  <span className="mx-2">•</span>
                  <ClipboardList className="w-4 h-4 mr-1" />
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
                        <span>{m.username} ({m.email})</span>
                        <Button size="sm" variant="destructive" disabled={actionLoading} onClick={() => handleRemoveMember(m.userId)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Add TEAM_MEMBER</h3>
                  <ul>
                    {teamMembers.filter((tm) => !members.some((m) => m.userId === tm.userId)).map((tm) => (
                      <li key={tm.userId} className="flex items-center justify-between py-1">
                        <span>{tm.username} ({tm.email})</span>
                        <Button size="sm" disabled={actionLoading} onClick={() => handleAddMember(tm.userId)}>
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}            <Button className="mt-4" onClick={() => setShowMemberModal(false)}>Close</Button>
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
    </div>
  );
};

export default ProjectList;
