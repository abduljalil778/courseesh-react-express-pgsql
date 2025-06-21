// src/components/profile/AvatarManager.jsx
import React, { useState } from 'react';
import { uploadUserAvatar } from '@/lib/api';
import Swal from 'sweetalert2';
import Spinner from '@/components/Spinner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AvatarManager({ user, onUpdate }) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setIsUploading(true);
    try {
      const response = await uploadUserAvatar(avatarFile);
      onUpdate(response.data); // Panggil fungsi dari context untuk update global
      setAvatarFile(null);
      setPreview(null);
      Swal.fire("Success", "Avatar updated successfully!", "success");
    } catch (err) {
      Swal.fire("Upload Failed", err.response?.data?.message || "Could not upload avatar.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const userAvatarUrl = preview
    ? preview
    : user.avatarUrl
      ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}`
      : `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random`;
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <Avatar className="h-24 w-24 text-3xl">
        <AvatarImage src={userAvatarUrl} alt={user.name} />
        <AvatarFallback>{user.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
      </Avatar>
      <div className="flex-grow text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
        <p className="text-md text-muted-foreground">{user.headline || user.role}</p>
        <div className="mt-4">
          <Label htmlFor="avatar-upload" className="text-sm font-medium text-indigo-600 cursor-pointer hover:underline">
            Ubah Foto
          </Label>
          <Input id="avatar-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
          {avatarFile && (
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <p className="text-sm text-muted-foreground truncate max-w-[150px]">{avatarFile.name}</p>
              <Button onClick={handleUploadAvatar} disabled={isUploading} size="sm">
                {isUploading ? <Spinner size={16} /> : 'Upload'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}