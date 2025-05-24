export default function CourseCard({ course, onBook }) {
  return (
    <div className="border rounded p-4 shadow space-y-2">
      <h2 className="text-xl font-semibold">{course.title}</h2>
      <p>{course.description}</p>
      <div className="flex justify-between items-center">
        <span className="font-bold">${course.price.toFixed(2)}</span>
        <button
          onClick={() => onBook(course.id)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Book
        </button>
      </div>
    </div>
  );
}
