import React, { useState } from 'react';
import { User, Mail, Lock, Check, X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    jobTitle: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would call an API to update the user profile
    // For this demo, we'll just show a success message
    
    setSuccessMessage('Profile updated successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }
    
    // Here you would call an API to update the password
    // For this demo, we'll just show a success message
    
    setSuccessMessage('Password updated successfully');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="max-w-3xl mx-auto fadeIn">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="relative mb-4 md:mb-0 md:mr-6">
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-primary text-3xl font-medium">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary-light transition-colors">
              <Camera size={16} />
            </button>
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-primary">{user?.name || 'User'}</h1>
            <p className="text-primary/70">{user?.email || 'user@example.com'}</p>
            <p className="text-primary/70 mt-1">Product Designer</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-primary/10 mb-6">
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === 'profile'
              ? 'text-primary border-b-2 border-accent'
              : 'text-primary/60 hover:text-primary'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeTab === 'security'
              ? 'text-primary border-b-2 border-accent'
              : 'text-primary/60 hover:text-primary'
          }`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center text-success">
          <Check size={18} className="mr-2 flex-shrink-0" />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}
      
      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center text-error">
          <X size={18} className="mr-2 flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  className="input pl-10"
                  placeholder="Your name"
                />
                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="input pl-10"
                  placeholder="Your email"
                />
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" />
              </div>
            </div>
            
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-primary mb-1">
                Job Title
              </label>
              <input
                id="jobTitle"
                type="text"
                value={profileForm.jobTitle}
                onChange={(e) => setProfileForm({...profileForm, jobTitle: e.target.value})}
                className="input"
                placeholder="Your job title"
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-primary mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                className="input min-h-[100px]"
                placeholder="Tell us about yourself"
              />
            </div>
            
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="card p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-primary mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" />
              </div>
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-primary mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" />
              </div>
              <p className="text-xs text-primary/60 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary">
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;