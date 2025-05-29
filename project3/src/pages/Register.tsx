
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const DEPARTMENTS = [
  'IT',
  'LOGISTICS',
  'FINANCE',
  'MARKETING',
  'OPERATIONS',
] as const;

type Department = typeof DEPARTMENTS[number];

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [department, setDepartment] = useState<Department | ''>('');

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!username) newErrors.username = 'Username is required';
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) newErrors.email = 'Invalid email address';
  
    // Password validation
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) newErrors.password = 'Password must contain an uppercase letter';
    else if (!/[a-z]/.test(password)) newErrors.password = 'Password must contain a lowercase letter';
    else if (!/[0-9]/.test(password)) newErrors.password = 'Password must contain a number';
    else if (!/[^A-Za-z0-9]/.test(password)) newErrors.password = 'Password must contain a special character';
  
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!department) newErrors.department = 'Department is required';
  
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    
    // Type guard to ensure department is not empty
    if (!department) {
      setErrors({ department: 'Department is required' });
      return;
    }
    
    setLoading(true);
    try {
      const success = await register(email, password, username, department);
      if (success) {
        navigate('/login');
      }
    } catch (error: any) {
      let errorMsg = "Failed to create account";
      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        if (error.message.toLowerCase().includes("email") && error.message.toLowerCase().includes("exists")) {
          errorMsg = "This email is already registered. Please use a different email or try logging in.";
        } else {
          errorMsg = error.message;
        }
      }
      setErrors({ ...errors, general: errorMsg });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            <a href="/">
              Hive
            </a>
          </h1>
          <p className="text-secondary/80">Join the productivity revolution</p>
        </div>
        
        <Card className="border-accent/20 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-primary">Create an account</CardTitle>
            <CardDescription className="text-center">
              Start managing your projects today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{errors.general}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-accent/30 focus:border-primary"
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-accent/30 focus:border-primary"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-accent/30 focus:border-primary"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-accent/30 focus:border-primary"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={department}
                  onChange={e => setDepartment(e.target.value as Department)}
                  required
                  aria-label="Select department"
                  className="border-accent/30 focus:border-primary w-full rounded px-3 py-2"
                >
                  <option value="">Select a department</option>
                  {DEPARTMENTS.map(dep => (
                    <option key={dep} value={dep}>{dep.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-secondary transition-colors"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-secondary/70">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-secondary font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
