// src/pages/admin/UserManagementPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../lib/api';
import Spinner from '@/components/Spinner';
import Swal from 'sweetalert2';
import UserForm from '../../components/UserForm';
import { Search } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async (currentSearchTerm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllUsers(currentSearchTerm);
      setUsers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers(searchTerm);
    }, 500); // Tunggu 500ms setelah user berhenti mengetik

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, loadUsers]);


  const handleOpenCreateForm = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditForm = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (userData) => {
    const isUpdating = !!editingUser;
    const action = isUpdating ? updateUser : createUser;
    const actionText = isUpdating ? 'Updating' : 'Creating';

    try {
      await action(isUpdating ? editingUser.id : userData, isUpdating ? userData : undefined);
      Swal.fire('Success!', `User ${isUpdating ? 'updated' : 'created'} successfully.`, 'success');
      handleCloseModal();
      loadUsers(searchTerm);
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || `Could not ${actionText.toLowerCase()} user.`, 'error');
    }
  };

  const handleDelete = async (userId, userName) => {
    const result = await Swal.fire({
      title: `Delete ${userName}?`,
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(userId);
        Swal.fire('Deleted!', `${userName} has been deleted.`, 'success');
        loadUsers(searchTerm);
      } catch (err) {
        Swal.fire('Error!', err.response?.data?.message || 'Could not delete user.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <div className="relative flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button onClick={handleOpenCreateForm} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex-shrink-0">
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        {isLoading ? (
            <div className="text-center py-10"><Spinner size={32}/></div>
        ) : users.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                    <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {user.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(user.createdAt), 'dd MMM, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleOpenEditForm(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                            <button onClick={() => handleDelete(user.id, user.name)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        ) : (
            <p className="text-center py-10 text-gray-500">No users found for "{searchTerm}".</p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <UserForm
              key={editingUser ? editingUser.id : 'create'}
              initialData={editingUser}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}