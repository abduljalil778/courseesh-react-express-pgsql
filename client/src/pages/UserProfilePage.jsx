import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadUserAvatar, updateUser } from '../lib/api';
import Swal from 'sweetalert2';
import Spinner from '@/components/Spinner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PayoutSettingsForm from '@/components/PayoutSettingsForm';
import TeacherAvailability from '@/components/TeacherAvailability';
import UserForm from '@/components/UserForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';

export default function UserProfilePage() {
  const { user, loading, updateUserContext } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // --- Avatar Upload Logic
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      Swal.fire("No File", "Please select an image file first.", "warning");
      return;
    }
    setIsUploading(true);
    try {
      const response = await uploadUserAvatar(avatarFile);
      updateUserContext(response.data);
      setAvatarFile(null);
      setPreview(null);
      Swal.fire("Success", "Avatar updated successfully!", "success");
    } catch (err) {
      Swal.fire("Upload Failed", err.response?.data?.message || "Could not upload avatar.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Edit Form Logic
  const handleUpdateProfile = async (data) => {
    try {
      // Gunakan updateUser dari lib/api
      const response = await updateUser(user.id, data);
      updateUserContext(response.data);
      Swal.fire("Success", "Profile updated successfully!", "success");
      setIsEdit(false);
    } catch (err) {
      Swal.fire("Update Failed", err.response?.data?.message || "Could not update profile.", "error");
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (!user) return <p>User not found.</p>;

  const userAvatarUrl = preview
    ? preview
    : user.avatarUrl
      ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}`
      : `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random`;

  const isTeacher = user.role === 'TEACHER';

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>My Settings</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Navigasi Tab */}
          <div className="border-b mb-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Details
              </button>
              {isTeacher && (
                <button
                  onClick={() => setActiveTab('payout')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payout'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Payout Settings
                </button>
              )}
              {isTeacher && (
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'availability'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Unavailable Dates
                </button>
              )}
            </nav>
          </div>

          {/* Konten Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userAvatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload">Change Avatar</Label>
                  <Input id="avatar-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
                  <Button onClick={handleUploadAvatar} disabled={isUploading || !avatarFile} size="sm">
                    {isUploading ? <Spinner size={16} className="mr-2" /> : null}
                    Upload Image
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <p className="text-lg font-medium text-gray-800">{user.name}</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-lg font-medium text-gray-800">{user.email}</p>
              </div>
               <div className="space-y-2">
                <Label>Phone</Label>
                <p className="text-lg font-medium text-gray-800">{user.phone || 'Not set'}</p>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => setIsEdit(true)}>
                  Edit Profile
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'payout' && isTeacher && (
            <div className="animate-fade-in">
              <PayoutSettingsForm />
            </div>
          )}
          {activeTab === 'availability' && isTeacher && (
            <div className="animate-fade-in">
              <TeacherAvailability />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEdit} onOpenChange={setIsEdit}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information below
            </DialogDescription>
          </DialogHeader>
          <UserForm
            initialData={{
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              password: '',
            }}
            onSubmit={handleUpdateProfile}
            onCancel={() => setIsEdit(false)}
            submitLabel="Save Changes"
            hideFields={['role', 'status']}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
