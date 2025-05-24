import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { projectService } from '../services/projectService';

const PROJECT_ID = '1'; // Change this to the desired projectId

const ProjectsPage: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjectMembers(PROJECT_ID);
        setMembers(data.members || data); // adjust if API returns { members: [...] }
        setLoading(false);
      } catch (err) {
        setError('Failed to load project members.');
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <Loader size={32} className="animate-spin text-primary" />
          <p className="text-primary">Loading project members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
        <p>{error}</p>
        <button 
          className="mt-2 text-sm underline"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fadeIn">
      <h1 className="text-2xl font-bold text-primary mb-4">Project Members</h1>
      {members.length > 0 ? (
        <ul className="list-disc pl-6">
          {members.map((member, idx) => (
            <li key={member.id || idx} className="mb-2 text-primary/80">
              {member.name || member.email || JSON.stringify(member)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="card p-8 text-center">
          <h3 className="text-lg font-medium text-primary mb-2">No members found</h3>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;