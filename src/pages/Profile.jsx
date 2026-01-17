import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, moviesAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, User, Mail, Save, Loader2, Eye, Heart, Clock, LogOut, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import useAuthStore from '../store/authStore';

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout: authLogout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });

  // Fetch profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authAPI.getProfile,
    enabled: isAuthenticated,
    onSuccess: (data) => {
      const userData = data?.data;
      setFormData({
        username: userData?.username || '',
        email: userData?.email || '',
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || ''
      });
    }
  });

  // Fetch statistics
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: moviesAPI.getFavorites,
    enabled: isAuthenticated
  });

  const { data: recentlyViewedData } = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: moviesAPI.getRecentlyViewed,
    enabled: isAuthenticated
  });

  const favoriteCount = Array.isArray(favoritesData?.data?.results)
    ? favoritesData.data.results.length
    : Array.isArray(favoritesData?.data)
    ? favoritesData.data.length
    : 0;

  const viewedCount = Array.isArray(recentlyViewedData?.data?.results)
    ? recentlyViewedData.data.results.length
    : Array.isArray(recentlyViewedData?.data)
    ? recentlyViewedData.data.length
    : 0;

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['profile']);
      useAuthStore.setState({ user: response.data });
      setIsEditing(false);
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: authAPI.deleteAccount,
    onSuccess: async () => {
      await authLogout();
      navigate('/login');
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    const userData = profileData?.data;
    setFormData({
      username: userData?.username || '',
      email: userData?.email || '',
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || ''
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      deleteAccountMutation.mutate();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <UserIcon className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Login Required</h2>
          <p className="text-muted-foreground">Please log in to view your profile</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <UserIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">My Profile</h1>
          </div>
          <p className="text-muted-foreground">Manage your account and view your statistics</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </label>
                    <Input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full"
                    />
                  </div>

                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your first name"
                      className="w-full"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your last name"
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {!isEditing ? (
                      <Button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="submit"
                          disabled={updateMutation.isLoading}
                          className="gap-2"
                        >
                          {updateMutation.isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={updateMutation.isLoading}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>

                  {updateMutation.isError && (
                    <p className="text-sm text-destructive">
                      Failed to update profile. Please try again.
                    </p>
                  )}

                  {updateMutation.isSuccess && !isEditing && (
                    <p className="text-sm text-green-600">
                      Profile updated successfully!
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Logout</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Favorites Count */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Favorite Movies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Heart className="w-6 h-6 text-primary fill-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{favoriteCount}</p>
                      <p className="text-sm text-muted-foreground">movies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recently Viewed Count */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Recently Viewed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Eye className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{viewedCount}</p>
                      <p className="text-sm text-muted-foreground">movies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Age */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Member Since
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <Clock className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {user?.username}
                      </p>
                      <p className="text-sm text-muted-foreground">active user</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>
                  Jump to your favorite sections
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/favorites')}
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" />
                  View Favorites
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/recent')}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Recent Chats
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/movies')}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Browse Movies
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p className="text-base font-medium text-foreground">
                This action cannot be undone. This will permanently delete your account and remove all associated data including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile information</li>
                <li>All favorite movies</li>
                <li>Chat history and conversations</li>
                <li>Recently viewed movies</li>
                <li>All account settings</li>
              </ul>
              <p className="text-sm text-muted-foreground pt-2">
                To confirm deletion, please type <span className="font-mono font-semibold text-foreground">DELETE</span> in the box below:
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="font-mono"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
              }}
              disabled={deleteAccountMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleteAccountMutation.isLoading}
              className="gap-2"
            >
              {deleteAccountMutation.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
