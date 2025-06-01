import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { projectAPI, taskAPI } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

const ProjectEditForm = ({ project, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    projectName: project.projectName || '',
    projectDescription: project.projectDescription || '',
    startDate: project.startDate || '',
    endDate: project.endDate || ''
  });
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch tasks for this project
    taskAPI.search({ projectId: project.projectId }).then(setTasks);
    // Fetch members for this project
    projectAPI.listMembers(project.projectId).then(res => {
      setMembers(res.projectMembers || []);
    });
  }, [project.projectId]);

  // Only show members who are assigned to the project or have a task in this project
  const assignedUserIds = new Set([
    ...members.map(m => m.userId),
    ...tasks.flatMap(t => Object.keys(t.assignedUsers || {}))
  ]);
  const filteredMembers = members.filter(m => assignedUserIds.has(String(m.userId)));

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare payload matching ProjectRequest
      const payload = {
        projectName: form.projectName,
        projectDescription: form.projectDescription,
        startDate: form.startDate ? form.startDate : undefined,
        endDate: form.endDate ? form.endDate : undefined
      };
      await projectAPI.update(project.projectId, payload);
      toast({ title: 'Success', description: 'Project updated.' });
      onSuccess();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update project', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <Input name="projectName" value={form.projectName} onChange={handleChange} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="projectDescription" value={form.projectDescription} onChange={handleChange} />
          </div>
          <div className="flex gap-2">
            <div>
              <Label>Start Date</Label>
              <Input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
            </div>
          </div>
          {/*<div>*/}
          {/*  <Label>Team Members (assigned or with a task)</Label>*/}
          {/*  <ul className="list-disc ml-5">*/}
          {/*    {filteredMembers.map(m => (*/}
          {/*      <li key={m.userId}>{m.username} ({m.email})</li>*/}
          {/*    ))}*/}
          {/*  </ul>*/}
          {/*</div>*/}
          {/*<div>*/}
          {/*  <Label>Tasks</Label>*/}
          {/*  <ul className="list-disc ml-5">*/}
          {/*    {tasks.map(t => (*/}
          {/*      <li key={t.taskId}>{t.taskName} (Assigned: {Object.keys(t.assignedUsers || {}).length})</li>*/}
          {/*    ))}*/}
          {/*  </ul>*/}
          {/*</div>*/}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary text-white">{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditForm; 