import React from 'react';
import { 
  Home, 
  Folder, 
  CheckSquare, 
  User, 
  LogOut, 
  PlusCircle,
  Layout as LayoutIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type SidebarProps = {
  activePage: string;
  onNavigate: (page: 'dashboard' | 'projects' | 'tasks' | 'profile') => void;
  onLogout: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const { user } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    onLogout();
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
    <div className="h-full flex flex-col text-white">
      <div className="p-4 flex items-center space-x-2">
        <LayoutIcon size={24} className="text-accent" />
        <h1 className="text-xl font-bold text-white">Hive</h1>
      </div>
      
      {user && (
        <div className="px-4 py-6 flex items-center space-x-3">
          <div className="avatar bg-accent text-primary">
            {user.name ? getInitials(user.name) : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-white/70 truncate">{user.email}</p>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex-1">
        <nav className="px-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-accent text-primary' 
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      <div className="p-4">
        <button 
          className="btn btn-secondary w-full justify-center mb-4"
        >
          <PlusCircle size={18} className="mr-2" />
          New Task
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-md transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;