import React, { useState } from 'react';
import { Check, X, Layout as LayoutIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type LoginPageProps = {
  onLoginSuccess: () => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        onLoginSuccess();
      } else {
        await register(email, password, name);
        setSuccess('Registration successful! You can now log in.');
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="grid md:grid-cols-2 w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-lg">
        {/* Left side - Form */}
        <div className="p-8 md:p-12">
          <div className="flex items-center space-x-2 mb-8">
            <LayoutIcon size={28} className="text-primary" />
            <h1 className="text-2xl font-bold text-primary">Hive</h1>
          </div>
          
          <h2 className="text-2xl font-bold text-primary mb-2">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-primary/70 mb-8">
            {isLogin 
              ? 'Enter your credentials to access your account' 
              : 'Fill in the form to get started with Hive'
            }
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center text-error">
              <X size={18} className="mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center text-success">
              <Check size={18} className="mr-2 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            
            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-accent hover:text-accent-light">
                  Forgot password?
                </button>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Log In' : 'Sign Up'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-primary/70">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={toggleMode}
                className="text-accent hover:text-accent-light font-medium"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
        
        {/* Right side - Image and text */}
        <div className="hidden md:block bg-primary p-12 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">Streamline Your Workflow</h2>
            <p className="mb-6">
              Hive helps teams collaborate effectively, manage projects, and meet deadlines with ease.
            </p>
            <ul className="space-y-3">
              {[
                'Intuitive task management',
                'Real-time collaboration',
                'Project tracking',
                'Deadline notifications'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center mr-3">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <blockquote className="mt-8 border-l-2 border-accent pl-4 italic">
            "Hive transformed how our team collaborates. We've increased productivity by 35% since implementation."
            <footer className="mt-2 text-white/80 not-italic">
              - Sarah Chen, Product Manager
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;