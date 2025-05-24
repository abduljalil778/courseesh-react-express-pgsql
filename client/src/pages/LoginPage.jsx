import { useForm } from 'react-hook-form';
import { z }      from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';


const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string().min(6, { message: 'Invalid password' })
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async data => {
    try {
      const { user } = await login(data.email, data.password);
      // redirect based on role...
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'TEACHER') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="animate-fade-in min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 bg-white shadow space-y-4 w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <div>
          <input
            {...register('email')}
            placeholder="Email"
            className="border p-2 w-full"
          />
          {errors.email && (
            <p className="text-red-600 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            {...register('password')}
            placeholder="Password"
            className="border p-2 w-full"
          />
          {errors.password && (
            <p className="text-red-600 text-sm">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 disabled:opacity-50"
        >
          {isSubmitting && <Spinner size={20} />}
          <span>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
          </span>
        </button>
      </form>
    </div>
  );
}
