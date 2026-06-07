import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getDefaultRoute } from '../../utils/roleRoutes';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <h1 className="text-5xl font-bold text-red-500">403</h1>
      <p className="text-xl font-semibold">Access Denied</p>
      <p className="text-gray-400 text-sm">You don't have permission to view this page.</p>
      <button
        onClick={() => navigate(getDefaultRoute(role))}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm mt-2">
        Go to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;