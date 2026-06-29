import { useSelector } from "react-redux";

import {
  selectUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from "../store/slices/authSlice";

const useAuth = () => {
  const user = useSelector(selectUser);
  const accessToken = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  return {
    user,
    accessToken,
    isAuthenticated,
    loading,
    error,
  };
};

export default useAuth;