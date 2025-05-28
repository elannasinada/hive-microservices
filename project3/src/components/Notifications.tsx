
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

const Notifications = () => {
  // Mock notifications data - replace with real API call
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Task Assigned',
      message: 'You have been assigned a new task: Update project documentation',
      timestamp: '2 hours ago',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Deadline Approaching',
      message: 'Task "Fix login bug" is due tomorrow',
      timestamp: '1 day ago',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'Task Completed',
      message: 'Your task "Database optimization" has been marked as complete',
      timestamp: '2 days ago',
      read: true,
      type: 'success'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 cursor-pointer">
              <div className="flex items-center justify-between w-full mb-1">
                <h4 className={`text-sm font-medium ${getTypeColor(notification.type)}`}>
                  {notification.title}
                </h4>
                <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
              </div>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
