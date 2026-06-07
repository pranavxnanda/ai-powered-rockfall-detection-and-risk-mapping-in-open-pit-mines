import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, isAuthenticated, token, loading } = useSelector(
    (state) => state.auth
  );
  return { user, isAuthenticated, token, loading, role: user?.role };
};

export default useAuth;