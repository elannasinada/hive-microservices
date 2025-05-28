
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RoleDebug = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-primary">Role Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-secondary/70 mb-2">Authentication Status:</p>
              <Badge className={isAuthenticated ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </Badge>
            </div>

            {user && (
              <>
                <div>
                  <p className="text-sm font-medium text-secondary/70 mb-2">User ID:</p>
                  <p className="text-primary">{user.id}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-secondary/70 mb-2">Username:</p>
                  <p className="text-primary">{user.username}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-secondary/70 mb-2">Email:</p>
                  <p className="text-primary">{user.email}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-secondary/70 mb-2">Roles:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role, index) => (
                      <Badge key={index} className="bg-primary/10 text-primary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-secondary/70 mb-2">Active Status:</p>
                  <Badge className={user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-secondary/70 mb-2">Raw User Object:</p>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleDebug;
