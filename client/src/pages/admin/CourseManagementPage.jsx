import React, { useEffect, useState, useCallback, useRef } from "react";
import { getAllCourses, deleteCourse, getAllCategories } from "../../lib/api";
import { formatCurrencyIDR } from "../../utils/formatCurrency";
import Swal from "sweetalert2";
import { MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 8;

export default function CourseManagementPage() {
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const debounceRef = useRef();

  // 2. State untuk menyimpan kategori dari API
  const [categories, setCategories] = useState([]);

  const totalPages = Math.max(1, Math.ceil(totalCourses / PAGE_SIZE));

  // 3. useEffect untuk mengambil data kategori saat komponen dimuat
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories();
        setCategories(response.data.data || []);
      } catch (err) {
        console.error("Failed to load categories for filter:", err);
      }
    };
    fetchCategories();
  }, []);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortDir,
        search: searchTerm,
        category: categoryFilter, // Backend sudah diupdate untuk menerima categoryId
      };
      const response = await getAllCourses(params);
      setCourses(response.data?.courses || []);
      setTotalCourses(response.data?.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load courses.");
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortDir, searchTerm, categoryFilter]);

  // Debounced search/category/sort
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1); // Reset page saat search/category/sort berubah
      loadCourses();
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line
  }, [searchTerm, categoryFilter, sortBy, sortDir]);

  // Fetch on page change
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleDeleteCourse = async (courseId, courseTitle) => {
    const result = await Swal.fire({
      title: `Delete "${courseTitle}"?`,
      text:
        "This will also delete associated bookings and data. This action is irreversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteCourse(courseId);
        Swal.fire("Deleted!", "The course has been deleted.", "success");
        loadCourses();
      } catch (err) {
        Swal.fire(
          "Error!",
          err.response?.data?.message || "Could not delete the course.",
          "error"
        );
      }
    }
  };

  // Sorting kolom
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
        <Skeleton className="h-5 w-2/3 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-1/3 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-1/3 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-1/3 rounded" />
      </td>
      <td className="px-6 py-4 text-right">
        <Skeleton className="h-5 w-12 rounded" />
      </td>
    </tr>
  );

  const selectedCategoryName = categoryFilter 
    ? categories.find(cat => cat.id === categoryFilter)?.name 
    : "All Categories";

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Courses</h1>
      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-grow max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
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
        {/* Category NavigationMenu */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="min-w-[150px]">
                {selectedCategoryName}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="flex flex-col py-1 w-[200px]">
                  <button
                    onClick={() => setCategoryFilter("")}
                    className={`text-left px-4 py-2 text-sm hover:bg-indigo-100 ${
                      !categoryFilter ? "font-semibold text-indigo-600" : "text-gray-700"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)} // Gunakan cat.id
                      className={`text-left px-4 py-2 text-sm hover:bg-indigo-100 ${
                        categoryFilter === cat.id ? "font-semibold text-indigo-600" : "text-gray-700"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("title")}
              >
                Course Title
                {sortBy === "title" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Levels
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("price")}
              >
                Price
                {sortBy === "price" &&
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
                <SkeletonRow />
              </>
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {course.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {course.teacher?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.classLevels?.join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrencyIDR(course.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant='destructive' size='sm' onClick={() => handleDeleteCourse(course.id, course.title)} >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Modern ala shadcn */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-semibold">
            {(page - 1) * PAGE_SIZE + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold">
            {Math.min(page * PAGE_SIZE, totalCourses)}
          </span>{" "}
          of <span className="font-semibold">{totalCourses}</span> courses
        </span>
        <div className="flex items-center justify-end mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                // disabled={page === 1} // jika ingin disable di page 1
              />
            </PaginationItem>
            {/* Render page numbers */}
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
                // disabled={page === totalPages} // jika ingin disable di last page
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      </div>
      {error && <div className="text-red-500 text-center mt-3">{error}</div>}
    </div>
  );
}
