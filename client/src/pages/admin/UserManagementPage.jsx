// src/pages/admin/UserManagementPage.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../lib/api';
import Spinner from '@/components/Spinner';
import Swal from 'sweetalert2';
import UserForm from '../../components/UserForm';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef();

  const loadUsers = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllUsers(query);
      setUsers(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce for search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadUsers(searchTerm);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, loadUsers]);

  // Focus on input saat modal open
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        document.querySelector('.user-form input')?.focus();
      }, 100);
    }
  }, [isModalOpen]);

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
    try {
      if (isUpdating) {
        await updateUser(editingUser.id, userData);
      } else {
        await createUser(userData);
      }
      Swal.fire('Success', `User ${isUpdating ? 'updated' : 'created'} successfully.`, 'success');
      handleCloseModal();
      loadUsers(searchTerm);
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.message || `Could not ${isUpdating ? 'update' : 'create'} user.`, 'error');
    }
  };

  const handleDelete = async (userId, userName) => {
    const result = await Swal.fire({
      title: `Delete ${userName}?`,
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(userId);
        Swal.fire('Deleted!', `${userName} has been deleted.`, 'success');
        loadUsers(searchTerm);
      } catch (err) {
        Swal.fire('Error', err?.response?.data?.message || 'Could not delete user.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <div className="relative flex-grow max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-400"
            aria-label="Search users"
          />
        </div>
        <button
          onClick={handleOpenCreateForm}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex-shrink-0"
        >
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-10"><Spinner size={32} /></div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
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
              {users.map(user => {
                const avatarSrc = user.avatarUrl
                  ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;

                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={avatarSrc} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? format(parseISO(user.createdAt), 'dd MMM, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenEditForm(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                        aria-label={`Edit ${user.name}`}
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Delete ${user.name}`}
                      >Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-10 text-gray-500">
            No users found{searchTerm && ` for "${searchTerm}"`}.
          </p>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={handleCloseModal}
          tabIndex={-1}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md relative user-form"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >&times;</button>
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
