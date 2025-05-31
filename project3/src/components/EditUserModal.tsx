import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { adminAPI } from '@/utils/api';

const DEPARTMENTS = [
  'IT',
  'LOGISTICS', 
  'FINANCE',
  'MARKETING',
  'OPERATIONS',
] as const;

const ROLES = [
  { value: 'ROLE_ADMIN', label: 'Admin' },
  { value: 'ROLE_PROJECT_LEADER', label: 'Project Leader' },
  { value: 'ROLE_TEAM_MEMBER', label: 'Team Member' },
] as const;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdated 
}) => {
  console.log('EditUserModal rendered with props:', { isOpen, user: user?.username });
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    department: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});  // Populate form when user changes
  useEffect(() => {
    if (user) {
      console.log('Populating form with user data:', user);
      
      const userRole = user.roles && user.roles.length > 0 
        ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].role)
        : 'ROLE_TEAM_MEMBER';
      
      // Better department extraction logic
      let userDepartment = '';
      if (user.departments && user.departments.length > 0) {
        const dept = user.departments[0];
        userDepartment = typeof dept === 'string' ? dept : dept.department;
      } else if (user.department) {
        userDepartment = user.department;
      }

      // Use actualUsername instead of username (which contains email)
      const actualUsername = user.actualUsername || user.username || '';

      console.log('Extracted values:', { actualUsername, userRole, userDepartment, active: user.active });

      setFormData({
        username: actualUsername,
        email: user.email || '',
        role: userRole,
        department: userDepartment,
        active: user.active !== false,
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field when it changes
    if (errors[field]) {
      setErrors(prev => { 
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    return newErrors;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validate();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    
    try {      // Check if username, email, or department changed
      const currentUsername = user.actualUsername || user.username || '';
      const usernameChanged = formData.username !== currentUsername;
      const emailChanged = formData.email !== user.email;
      const departmentChanged = formData.department !== (user.department || (user.departments?.[0]?.department || user.departments?.[0]));
      
      // Update basic user info (username, email, department) if any changed
      if (usernameChanged || emailChanged || departmentChanged) {
        const updateData = {
          username: formData.username,
          email: formData.email,
          departments: formData.department ? [{ department: formData.department }] : []
        };
        
        console.log('Updating user basic info:', updateData);
        await adminAPI.updateUser(user.userId, updateData);
      }

      // Update user role
      const currentRole = user.roles?.[0]?.role || user.roles?.[0];
      if (formData.role !== currentRole) {
        console.log('Updating user role from', currentRole, 'to', formData.role);
        await adminAPI.changeUserRole(user.userId, formData.role);
      }

      // Update user activation status
      if (formData.active !== user.active) {
        console.log('Updating user activation from', user.active, 'to', formData.active);
        await adminAPI.toggleUserActivation(user.userId, formData.active);
      }

      toast({
        title: "Success!",
        description: "User information updated successfully."
      });

      onUserUpdated();
      onClose();
      
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast({
        title: "Error",
        description: "Failed to update user information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User Information</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {Object.values(errors).map((error, index) => (
                <div key={index} className="text-sm">{error}</div>
              ))}
            </div>
          )}          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="col-span-3"
              placeholder="Enter username"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="col-span-3"
              placeholder="Enter email address"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange('role', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleChange('department', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="active" className="text-right">Active Status</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleChange('active', checked)}
              />
              <Label htmlFor="active" className="text-sm">
                {formData.active ? 'Active' : 'Inactive'}
              </Label>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
