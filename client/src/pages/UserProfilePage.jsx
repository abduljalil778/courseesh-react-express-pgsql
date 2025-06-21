// src/pages/UserProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../lib/api';
import Spinner from '@/components/Spinner';
import { Separator } from '@/components/ui/separator';

// Impor komponen-komponen baru yang akan kita buat
import AvatarManager from '@/components/profile/AvatarManager';
import PublicProfileCard from '@/components/profile/PublicProfileCard';
import SecurityCard from '@/components/profile/SecurityCard';

export default function UserProfilePage() {
  const { updateUserContext } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk memuat data profil lengkap saat halaman dibuka
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyProfile();
      setProfileData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Fungsi ini akan kita teruskan ke komponen anak setelah update berhasil
  const handleProfileUpdate = (updatedUserData) => {
    updateUserContext(updatedUserData);
    setProfileData(updatedUserData);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (!profileData) return <p>User profile could not be loaded.</p>;

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-10">
      {/* SEKSI 1: HEADER PROFIL & AVATAR */}
      <AvatarManager user={profileData} onUpdate={handleProfileUpdate} />

      <Separator />

      {/* SEKSI 2: KARTU PROFIL PUBLIK (DENGAN MODE EDIT SENDIRI) */}
      <PublicProfileCard user={profileData} onUpdate={handleProfileUpdate} />

      <Separator />

      {/* SEKSI 3: KARTU KEAMANAN (UBAH PASSWORD) */}
      <SecurityCard />
    </div>
  );
}