import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { adminAPI } from '@/utils/api';

interface AddUserFormProps {
    onClose: () => void;
    onUserAdded: () => void; // Callback to refresh the user list
    adminDepartment: string; // Pass the admin's department
}

const AddUserForm: React.FC<AddUserFormProps> = ({ onClose, onUserAdded, adminDepartment }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        // Clear error for the field when it changes
        if (errors[id]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.email.match(/^[^@]+@[^@]+\.[^@]+$/)) newErrors.email = 'Invalid email address';

        // Password validation
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Password must contain an uppercase letter';
        else if (!/[a-z]/.test(formData.password)) newErrors.password = 'Password must contain a lowercase letter';
        else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Password must contain a number';
        else if (!/[^A-Za-z0-9]/.test(formData.password)) newErrors.password = 'Password must contain a special character';

        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        try {
            const userData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                department: adminDepartment, // Use admin's department
                role: 'TEAM_MEMBER' // Default role for new users
            };

            await adminAPI.createUser(userData);

            toast({
                title: "User Added!",
                description: `New user created successfully in ${adminDepartment} department.`
            });
            onUserAdded(); // Call the parent callback to close modal and refresh list
        } catch (error: any) {
            console.error('Add User error:', error);
            let errorMsg = "Failed to create user";
            if (error && error.message) {
                errorMsg = error.message;
            }
            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive"
            });
            setErrors({ ...errors, general: errorMsg });
        }
        setLoading(false);
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add New User to {adminDepartment}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                {errors.general && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{errors.general}</div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">Username</Label>
                    <Input
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                    />
                    {errors.username && <p className="col-span-4 text-right text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                    />
                    {errors.email && <p className="col-span-4 text-right text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                    />
                    {errors.password && <p className="col-span-4 text-right text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="confirmPassword" className="text-right">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                    />
                    {errors.confirmPassword && <p className="col-span-4 text-right text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
            </form>
            <DialogFooter>
                <Button type="submit" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Adding...' : 'Add User'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default AddUserForm;