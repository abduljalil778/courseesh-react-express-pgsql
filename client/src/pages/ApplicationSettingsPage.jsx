import React, { useEffect, useState, useCallback } from 'react';
import { getAppSettings, updateAppSettings } from '@/lib/api';
import Spinner from '@/components/Spinner';
import Swal from 'sweetalert2';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ApplicationSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAppSettings();
      setSettings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (key, value) => {
    setSettings(currentSettings =>
      currentSettings.map(setting =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validasi sederhana untuk service fee
      const serviceFee = settings.find(s => s.key === 'DEFAULT_SERVICE_FEE_PERCENTAGE');
      if (serviceFee && (isNaN(parseFloat(serviceFee.value)) || parseFloat(serviceFee.value) < 0 || parseFloat(serviceFee.value) > 1)) {
        Swal.fire('Invalid Value', 'Service fee must be a number between 0 and 1 (e.g., 0.15 for 15%).', 'error');
        setIsSubmitting(false);
        return;
      }

      await updateAppSettings(settings);
      Swal.fire('Success!', 'Settings have been updated successfully.', 'success');
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || 'Could not update settings.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={48} /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-6">
          {settings.map(setting => (
            <div key={setting.key}>
              <Label htmlFor={setting.key} className="text-base font-medium">
                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
              <p className="text-sm text-gray-500 mb-2">{setting.description}</p>
              <Input
                id={setting.key}
                value={setting.value}
                onChange={(e) => handleInputChange(setting.key, e.target.value)}
                placeholder={`Enter value for ${setting.key}`}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner size={20} className="mr-2" />}
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}