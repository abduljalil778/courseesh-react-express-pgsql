// src/pages/admin/PaymentOptionsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllPaymentOptionsAdmin,
  createPaymentOptionAdmin,
  updatePaymentOptionAdmin,
  deletePaymentOptionAdmin,
} from '../../lib/api';
import Spinner from '../../components/Spinner';
import Swal from 'sweetalert2';
import PaymentOptionForm from '../../components/admin/PaymentOptionForm';
import { Button } from '@/components/ui/button';

export default function PaymentOptionsPage() {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllPaymentOptionsAdmin();
      setOptions(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment options.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleOpenCreateForm = () => {
    setEditingOption(null);
    setIsModalOpen(true);
  };

  const handleOpenEditForm = (option) => {
    setEditingOption(option);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOption(null);
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    const isUpdating = !!editingOption;
    const action = isUpdating ? updatePaymentOptionAdmin : createPaymentOptionAdmin;
    const actionText = isUpdating ? 'Updating' : 'Creating';

    try {
      await action(isUpdating ? editingOption.id : formData, isUpdating ? formData : undefined);
      Swal.fire('Success!', `Payment option ${isUpdating ? 'updated' : 'created'} successfully.`, 'success');
      handleCloseModal();
      loadOptions();
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || `Could not ${actionText.toLowerCase()} option.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (optionId, bankName) => {
    const result = await Swal.fire({
      title: `Delete ${bankName}?`,
      text: "This will remove the payment option permanently.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deletePaymentOptionAdmin(optionId);
        Swal.fire('Deleted!', 'The payment option has been deleted.', 'success');
        loadOptions();
      } catch (err) {
        Swal.fire('Error!', err.response?.data?.message || 'Could not delete the option.', 'error');
      }
    }
  };


  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={48} /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;


  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payment Options</h1>
        <Button onClick={handleOpenCreateForm} className="px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <i className="fas fa-plus mr-2"></i>Add New Bank Account
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Holder</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {options.length > 0 ? options.map(option => (
              <tr key={option.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {option.logoUrl && <img src={option.logoUrl} alt={option.bankName} className="h-6 w-10 object-contain mr-3"/>}
                    <span className="text-sm font-medium text-gray-900">{option.bankName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{option.accountHolder}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{option.accountNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${option.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {option.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button variant='outline' size='sm' onClick={() => handleOpenEditForm(option)} >Edit</Button>
                  <Button variant='destructive' size='sm' onClick={() => handleDelete(option.id, option.bankName)} >Delete</Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No payment options configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editingOption ? 'Edit Payment Option' : 'Add New Payment Option'}</h2>
            <PaymentOptionForm
              initialData={editingOption}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}