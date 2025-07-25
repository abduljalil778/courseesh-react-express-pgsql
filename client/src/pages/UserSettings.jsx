import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '@/components/Spinner';
import PayoutSettingsForm from '@/components/PayoutSettingsForm';
import TeacherAvailability from '@/components/TeacherAvailability';
import ApplicationSettingsPage from './ApplicationSettingsPage';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const NAVBAR_HEIGHT = 68;

const TABS = [
  // { key: 'app-setting', label: 'Application Settings', visible: user => user?.role === 'ADMIN' },
  { key: 'payout', label: 'Payout Settings', visible: user => user?.role === 'TEACHER' },
  { key: 'availability', label: 'Availability Settings', visible: user => user?.role === 'TEACHER' },
];

const TAB_DESCRIPTIONS = {
  'app-setting': {
    // title: "Application Settings",
    // desc: "Manage global app preferences, notifications, and branding.",
  },
  'payout': {
    title: "Payout Settings",
    desc: "Configure your payout method and bank information.",
  },
  'availability': {
    title: "Availability Settings",
    desc: "Set your unavailable dates and times to prevent bookings on holidays or leave.",
  }
};

export default function UserSettings() {
  const { user, loading } = useAuth();

  const navigate = useNavigate();

  const validTabs = useMemo(
    () => TABS.filter(tab => tab.visible(user)),
    [user]
  );

  const [activeTab, setActiveTab] = useState(() => validTabs[0]?.key || '');
  useEffect(() => {
    if (!validTabs.find(t => t.key === activeTab)) {
      setActiveTab(validTabs[0]?.key || '');
    }
  }, [validTabs, activeTab]);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (!user) return <p>User not found.</p>;

  return (
    <>
    <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Button onClick={() => navigate('/teacher')} variant='ghost'>Home</Button>
              </BreadcrumbItem>
              <BreadcrumbSeparator/>
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
      </div>
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-white-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">Settings</h1>
          <nav className="flex space-x-2 md:space-x-6 overflow-x-auto font-medium text-sm md:text-base" aria-label="Tabs">
            {validTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 md:px-6 rounded-t-md transition-all 
                  ${activeTab === tab.key
                    ? "bg-white border-b-2 border-indigo-600 text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:text-indigo-600 hover:bg-white/50"
                  }`}
                style={{ minWidth: 135 }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      {/* Tab Description */}
      <div className="max-w-4xl mx-auto pt-6 pb-2 px-0 md:px-3">
        <h3 className="text-lg font-semibold text-gray-900">{TAB_DESCRIPTIONS[activeTab]?.title}</h3>
        <p className="text-sm text-gray-500">{TAB_DESCRIPTIONS[activeTab]?.desc}</p>
      </div>
      {/* Tab Content */}
      <div className="max-w-4xl mx-auto pt-2 px-0 md:px-3">
        <div className="animate-fade-in">
          {/* {activeTab === 'app-setting' && user.role === 'ADMIN' && (
            <ApplicationSettingsPage />
          )} */}
          {activeTab === 'payout' && user.role === 'TEACHER' && (
            <PayoutSettingsForm />
          )}
          {activeTab === 'availability' && user.role === 'TEACHER' && (
            <TeacherAvailability />
          )}
        </div>
      </div>
    </div>
    </>
  );
}
