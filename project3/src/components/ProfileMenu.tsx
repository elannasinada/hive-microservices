
import { useState } from 'react';
import { User, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const ProfileMenu = () => {
  const { user } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isUpdatingPicture, setIsUpdatingPicture] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');

  const handleProfilePictureUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPicture(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', file);

      // Mock API call - replace with actual endpoint
      // const response = await fetch('/api/v1/user/profile-picture', {
      //   method: 'PUT',
      //   body: formData,
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo purposes, create a local URL
      const imageUrl = URL.createObjectURL(file);
      setProfilePicture(imageUrl);

      toast({
        title: "Success!",
        description: "Profile picture updated successfully"
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPicture(false);
    }
  };

  if (!user) return null;

  return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profilePicture} alt={user.username} />
                <AvatarFallback>
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-2 p-2">
              <Button
                  variant="ghost"
                  onClick={() => setShowProfileDialog(true)}
                  className="justify-start h-auto p-2"
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profilePicture} alt={user.username} />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Profile Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePicture} alt={user.username} />
                  <AvatarFallback className="text-lg">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-center space-y-2">
                  <Label htmlFor="picture" className="cursor-pointer">
                    <Button
                        variant="outline"
                        disabled={isUpdatingPicture}
                        className="relative"
                        asChild
                    >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isUpdatingPicture ? 'Updating...' : 'Update Profile Picture'}
                    </span>
                    </Button>
                  </Label>
                  <Input
                      id="picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpdate}
                      disabled={isUpdatingPicture}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>
              </div>

              {/* User Information (Read-only) */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Username</Label>
                    <Input value={user.username} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <Input value={user.email} readOnly className="bg-muted" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">User ID</Label>
                  <Input value={user.id} readOnly className="bg-muted" />
                </div>

                <div>
                  <Label className="text-sm font-medium">Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user.roles.map((role) => (
                        <span
                            key={role}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                      {role}
                    </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Input
                        value={user.active ? 'Active' : 'Inactive'}
                        readOnly
                        className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role Descriptions</Label>
                    <Input
                        value={user.rolesDescription.join(', ') || 'N/A'}
                        readOnly
                        className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
  );
};

export default ProfileMenu;