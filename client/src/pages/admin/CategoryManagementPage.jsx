import React, { useEffect, useState, useCallback } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../lib/api';
import Spinner from '../../components/Spinner';
import Swal from 'sweetalert2';
import CategoryForm from '../../components/admin/CategoryForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await getAllCategories();
        setCategories(response.data.data);
        setIsLoading(false);
        
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to load categories');
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreateForm = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  }

  const handleOpenEditForm = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }

  const handleSubmit = async (categoryData) => {
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, categoryData);
        Swal.fire('Success', 'Category updated successfully', 'success');
      } else {
        // Create new category
        await createCategory(categoryData);
        Swal.fire('Success', 'Category created successfully', 'success');
      }
      setIsModalOpen(false);
      loadCategories(); // Refresh categories after submit
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save category', 'error');
    }
  }

  const handleDelete = async (categoryId, categoryName) => {
    const result = await Swal.fire({
          title: `Delete ${categoryName}?`,
          text: "This action cannot be undone.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Yes, delete it!",
        });
    
    if (result.isConfirmed) {
        try {
          await deleteCategory(categoryId);
          Swal.fire('Success', 'Category deleted successfully', 'success');
          loadCategories(); // Refresh categories after delete
        } catch (err) {
          Swal.fire('Error', err.response?.data?.message || 'Failed to delete category', 'error');
        }
    }

  }

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Kategori</h1>
        <Button onClick={handleOpenCreateForm}><Plus className="mr-2 h-4 w-4"/> Tambah Kategori Baru</Button>
      </div>

      {/* Tabel untuk menampilkan kategori */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
                <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Name</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Description</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
                {categories.length > 0 ? categories.map(category => (
                    <tr key={category.id}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{category.name}</td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{category.description || '-'}</td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {category.isActive ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                            <Button variant="outline" size="sm" onClick={() => handleOpenEditForm(category)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id, category.name)}>Delete</Button>
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="4" className="text-center py-10 text-gray-500">
                            Belum ada kategori. Silakan tambahkan kategori baru.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Modal untuk form */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
            <CategoryForm
              initialData={editingCategory}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}