// src/components/profile/SecurityCard.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ChangePasswordForm from './ChangePasswordForm';
import Swal from 'sweetalert2';

export default function SecurityCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChangePasswordSuccess = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      Swal.fire({
        title: "Success!",
        text: "Password changed successfully.",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    }, 300); // delay 300ms
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Password & Keamanan</CardTitle>
          <CardDescription>Ubah password Anda secara berkala untuk menjaga keamanan akun.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsModalOpen(true)}>Ubah Password</Button>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password Anda</DialogTitle>
          </DialogHeader>
          <ChangePasswordForm onSuccess={handleChangePasswordSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}