// src/components/profile/PublicProfileCard.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import ProfileForm from './ProfileForm';

// Komponen kecil untuk menampilkan data (read-only)
const ProfileDisplayView = ({ user }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <span className="text-sm font-medium text-muted-foreground">Nama Lengkap</span>
      <span className="col-span-2 text-sm">: {user.name}</span>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <span className="text-sm font-medium text-muted-foreground">Nomor Telepon</span>
      <span className="col-span-2 text-sm">: {user.phone || '-'}</span>
    </div>
    {user.role === 'TEACHER' && (
      <>
        <div className="grid grid-cols-3 gap-4">
          <span className="text-sm font-medium text-muted-foreground">Headline</span>
          <span className="col-span-2 text-sm">: {user.headline || '-'}</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span className="text-sm font-medium text-muted-foreground">Bio</span>
          <p className="col-span-2 text-sm whitespace-pre-wrap">: {user.bio || '-'}</p>
        </div>
         <div className="grid grid-cols-3 gap-4">
          <span className="text-sm font-medium text-muted-foreground">Website</span>
          <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="col-span-2 text-sm text-indigo-600 hover:underline truncate">: {user.websiteUrl || '-'}</a>
        </div>
         <div className="grid grid-cols-3 gap-4">
          <span className="text-sm font-medium text-muted-foreground">Pendidikan</span>
          <ul className="col-span-2 text-sm list-disc list-inside">
            {user.education?.length > 0 ? user.education.map((edu, i) => <li key={i}>{edu}</li>) : ': -'}
          </ul>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span className="text-sm font-medium text-muted-foreground">Sertifikasi</span>
          <ul className="col-span-2 text-sm list-disc list-inside">
            {user.certifications?.length > 0 ? user.certifications.map((cert, i) => <li key={i}>{cert}</li>) : ': -'}
          </ul>
        </div>
      </>
    )}
  </div>
);


export default function PublicProfileCard({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSuccess = (updatedUser) => {
    onUpdate(updatedUser);
    setIsEditing(false); // Kembali ke mode view setelah sukses
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Data ini akan ditampilkan di profil publik Anda.</CardDescription>
        </div>
        {!isEditing && <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <ProfileForm 
            user={user} 
            onUpdate={handleSuccess} 
            onCancel={() => setIsEditing(false)} 
          />
        ) : (
          <ProfileDisplayView user={user} />
        )}
      </CardContent>
    </Card>
  );
}