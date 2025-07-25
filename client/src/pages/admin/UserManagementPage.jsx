// src/pages/UserManagementPage.jsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import { format, parseISO } from "date-fns";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../lib/api";
import Swal from "sweetalert2";
import UserForm from "../../components/UserForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

// shadcn dialog
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const PAGE_SIZE = 8;

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const debounceRef = useRef();

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  // Fetch user list (with filters, sort, search, pagination)
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortDir,
      };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      const response = await getAllUsers(params);
      setUsers(response.data?.users || response.data || []);
      setTotalUsers(response.data?.total || 0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load users. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortDir, searchTerm, roleFilter]);

  // Debounced search/filter/sort
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line
  }, [searchTerm, roleFilter, sortBy, sortDir]);

  // Fetch on page change
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, [page]);

  // Modal handler
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
      Swal.fire(
        "Success",
        `User ${isUpdating ? "updated" : "created"} successfully.`,
        "success"
      );
      handleCloseModal();
      loadUsers();
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message ||
          `Could not ${isUpdating ? "update" : "create"} user.`,
        "error"
      );
    }
  };

  const handleDelete = async (userId, userName) => {
    const result = await Swal.fire({
      title: `Delete ${userName}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(userId);
        Swal.fire("Deleted!", `${userName} has been deleted.`, "success");
        loadUsers();
      } catch (err) {
        Swal.fire(
          "Error",
          err?.response?.data?.message || "Could not delete user.",
          "error"
        );
      }
    }
  };

  // Sort columns
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // Skeleton Loader Row
  const SkeletonRow = () => (
    <tr>
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-1/3 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-1/4 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-12 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-12 rounded" />
      </td>
      <td className="px-6 py-4 text-right">
        <Skeleton className="h-5 w-12 rounded" />
      </td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Users</h1>
      {/* Search + Role Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-grow max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              tabIndex={0}
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border-gray-300 rounded-md text-sm py-2 px-2"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>
        <Button
          onClick={handleOpenCreateForm}
          className="ml-auto px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-700 flex-shrink-0"
        >
          <Plus/>Add New User
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                Name
                {sortBy === "name" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("role")}
              >
                Role
                {sortBy === "role" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                Status
                {sortBy === "status" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("createdAt")}
              >
                Joined
                {sortBy === "createdAt" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : users.length > 0 ? (
              users.map((user) => {
                const avatarSrc = user.avatarUrl
                  ? `${import.meta.env.VITE_API_URL.replace(
                      "/api",
                      ""
                    )}${user.avatarUrl}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=random`;

                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={avatarSrc} alt={user.name} />
                          <AvatarFallback>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? format(parseISO(user.createdAt), "dd MMM, yyyy") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        variant={"outline"}
                        size={"sm"}
                        onClick={() => handleOpenEditForm(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={"destructive"}
                        size={"sm"}
                        onClick={() => handleDelete(user.id, user.name)}
                        aria-label={`Delete ${user.name}`}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No users found{searchTerm && ` for "${searchTerm}"`}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination ala shadcn */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-semibold">
            {(page - 1) * PAGE_SIZE + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold">
            {Math.min(page * PAGE_SIZE, totalUsers)}
          </span>{" "}
          of <span className="font-semibold">{totalUsers}</span> users
        </span>
        <div className="flex items-center justify-end mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-disabled={page === 1}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, idx) => (
                <PaginationItem key={idx + 1}>
                  <PaginationLink
                    isActive={page === idx + 1}
                    onClick={() => setPage(idx + 1)}
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      {error && <div className="text-red-500 text-center mt-3">{error}</div>}

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="max-w-md w-full p-0">
    <DialogHeader className="px-6 pt-6 pb-0">
      <DialogTitle>
        {editingUser ? "Edit User" : "Add New User"}
      </DialogTitle>
      <DialogDescription>
        {editingUser
          ? "Update user information below. Leave password blank if not changing."
          : "Fill in user details to create a new user."}
      </DialogDescription>
    </DialogHeader>
    {/* FORM CONTENT */}
    <div className="px-6 pb-6 pt-2">
      <UserForm
        key={editingUser ? editingUser.id : "create"}
        initialData={editingUser}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        className="user-form"
      />
    </div>
    <DialogClose asChild>
    </DialogClose>
  </DialogContent>
</Dialog>
    </div>
  );
}
