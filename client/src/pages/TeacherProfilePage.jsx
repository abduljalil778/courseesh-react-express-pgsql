// src/pages/TeacherProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getTeacherProfile } from '../lib/api';
import TeacherProfilePageSkeleton from '@/components/skeleton/TeacherProfilePageSkeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import CourseCard from '../components/CourseCard';
import { Users, BookOpen, Linkedin, GraduationCap, Award, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


// Komponen untuk menampilkan daftar (Pendidikan/Sertifikasi)
const ProfileListSection = ({ title, items, icon: Icon }) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-3">
        <Icon className="h-5 w-5 text-indigo-600" />
        {title}
      </h3>
      <ul className="space-y-2 pl-5">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-gray-700 list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
};


export default function TeacherProfilePage() {
  const { teacherId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTeacherProfile(teacherId);
      setProfileData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading) return <TeacherProfilePageSkeleton />

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  
  if (!profileData) return <div className='p-6 text-center text-gray-500'>Profile not found.</div>;

  const { profile, courses, stats } = profileData;

  const userAvatarUrl = profile.avatarUrl 
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${profile.avatarUrl}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
              <Avatar className="h-32 w-32 mx-auto border-4 border-white -mt-24 shadow-xl">
                <AvatarImage src={userAvatarUrl} alt={profile.name} />
                <AvatarFallback className="text-4xl">{profile.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="text-center mt-4">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-md text-indigo-600 font-semibold">{profile.headline || 'Instructor'}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Bergabung Sejak {format(new Date(profile.createdAt), 'MMMM yyyy')}
                </p>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-xl font-bold">{stats.totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Kursus</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Siswa</p>
                </div>
              </div>
              {(profile.websiteUrl || profile.email) && <Separator className="my-6" />}
              <div className="space-y-3 text-center">
                 {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 w-full justify-center">
                    <Linkedin className="h-4 w-4" /> LinkedIn / Website
                  </a>
                )}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>Tentang Saya</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio || 'Informasi biografi belum ditambahkan oleh instruktur.'}</p>
              </CardContent>
            </Card>

            <Card className="mt-6">
               <CardHeader>
                <CardTitle>Kualifikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProfileListSection title="Pendidikan" items={profile.education} icon={GraduationCap} />
                <ProfileListSection title="Sertifikasi" items={profile.certifications} icon={Award} />
              </CardContent>
            </Card>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Kursus Oleh {profile.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}