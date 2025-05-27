import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Users, Plus, Search } from 'lucide-react';
import { projectAPI } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface ProjectListProps {
  projects: any[];
  onUpdate: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [projectTasks, setProjectTasks] = useState<{ [projectId: string]: any[] }>({});

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

  const handleJoinRequest = async (projectId: string) => {
    try {
      await projectAPI.joinRequest(projectId);
      toast({
        title: "Success!",
        description: "Join request sent successfully."
      });
    } catch (error) {
      console.error('Join request failed:', error);
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive"
      });
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
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} indicatorClassName={progressColor} />
                </div>
                <div className="flex items-center text-secondary/60 text-sm mb-2">
                  <Users className="w-4 h-4 mr-2" />
                  {project.memberCount || 0} members
                </div>
                <div className="mt-4 pt-4 border-t border-accent/20">
                  <Button
                    onClick={() => handleJoinRequest(projectId)}
                    variant="outline"
                    size="sm"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Join Project
                  </Button>
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
    </div>
  );
};

export default ProjectList;
