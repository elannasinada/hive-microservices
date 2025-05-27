import React, { useState } from 'react';
import { Menu, Bell, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type NavbarProps = {
  onMenuClick: () => void;
  title: string;
};

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-primary/10 z-10">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="text-primary p-2 rounded-md lg:hidden hover:bg-primary/5"
              title="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-2 text-xl font-semibold text-primary lg:ml-0">{title}</h1>
          </div>

          <div className="flex items-center">
            {/* Search input - visible on larger screens */}
            <div className="hidden md:block relative mr-4">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" size={18} />
            </div>

            {/* Search button - visible on mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 text-primary rounded-full hover:bg-primary/5 relative"
              title="Open search"
            >
              <Search size={20} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-primary rounded-full hover:bg-primary/5 relative"
                title="Show notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-10 border border-primary/10">
                  <div className="p-3 border-b border-primary/10">
                    <h3 className="font-medium text-primary">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-primary/5 hover:bg-background transition-colors">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm text-primary">
                            <span className="font-medium">John Doe</span> assigned you a new task
                          </p>
                          <p className="text-xs text-primary/60 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-b border-primary/5 hover:bg-background transition-colors">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm text-primary">
                            <span className="font-medium">Project Sprint</span> is starting tomorrow
                          </p>
                          <p className="text-xs text-primary/60 mt-1">5 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-background transition-colors">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm text-primary">
                            <span className="font-medium">System</span> maintenance scheduled for tonight
                          </p>
                          <p className="text-xs text-primary/60 mt-1">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 text-center border-t border-primary/10">
                    <button className="text-sm text-accent hover:text-accent-light transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu - simplified version */}
            <div className="ml-3">
              <div className="avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-background z-50 p-4">
          <div className="flex items-center">
            <button 
              onClick={() => setSearchOpen(false)}
              className="p-2 text-primary"
              title="Close search"
            >
              <X size={24} />
            </button>
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 p-2 ml-2 border-b border-primary/20 bg-transparent focus:outline-none"
              autoFocus
            />
          </div>
          
          {/* Recent searches - could be populated from context/state */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-primary/60 mb-2">Recent Searches</h3>
            <ul className="space-y-2">
              <li className="p-2 hover:bg-primary/5 rounded">
                <button className="flex items-center text-primary w-full text-left">
                  <Search size={16} className="mr-2 text-primary/60" />
                  <span>Project deadline</span>
                </button>
              </li>
              <li className="p-2 hover:bg-primary/5 rounded">
                <button className="flex items-center text-primary w-full text-left">
                  <Search size={16} className="mr-2 text-primary/60" />
                  <span>Bug fixes</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;