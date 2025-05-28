// import { useForm } from "react-hook-form";
// import api from "../lib/api";

// export default function Payment({ bookingId, onSuccess }) {
//   const {
//     register,
//     watch,
//     handleSubmit,
//     formState: { isSubmitting }
//   } = useForm({
//     defaultValues: { method: "FULL", installments: 1 }
//   });

//   const method = watch("method");

//   const submit = async (data) => {
//     await api.post(`/student/book/payment/`, {
//       bookingId,
//       method: data.method,
//       installments: data.method === "INSTALLMENT" ? data.installments : undefined
//     });
//     onSuccess();
//   };

//   return (
//     <form onSubmit={handleSubmit(submit)} className="space-y-4">
//       <label>
//         <input
//           type="radio"
//           value="FULL"
//           {...register("method")}
//         />{" "}
//         Pay in full
//       </label>
//       <label>
//         <input
//           type="radio"
//           value="INSTALLMENT"
//           {...register("method")}
//         />{" "}
//         Pay in installments
//       </label>

//       {method === "INSTALLMENT" && (
//         <div>
//           <label>How many payments?</label>
//           <select {...register("installments", { valueAsNumber: true })}>
//             {[2, 3, 4, 5, 6].map((n) => (
//               <option key={n} value={n}>
//                 {n} installments
//               </option>
//             ))}
//           </select>
//         </div>
//       )}

//       <button
//         type="submit"
//         disabled={isSubmitting}
//         className="bg-blue-600 text-white px-4 py-2 rounded"
//       >
//         {isSubmitting ? "Processing…" : "Submit Payment"}
//       </button>
//     </form>
//   );
// }
