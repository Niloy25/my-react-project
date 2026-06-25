import { useDispatch, useSelector } from "react-redux";
import {
  signup,
  login,
  logout,
  restoreSession,
  updateUser,
  clearError,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
} from "../store/authSlice";

// Drop-in replacement for: import { useAuth } from '../context/AuthContext'
// Usage in components stays exactly the same:
//   const { user, isAuthenticated, login, logout } = useAuth();

export const useAuth = () => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions — call dispatch internally so components stay clean
    signup: (name, email, password) =>
      dispatch(signup({ name, email, password })).unwrap(),
    login: (email, password) => dispatch(login({ email, password })).unwrap(),
    logout: () => dispatch(logout()).unwrap(),
    restoreSession: () => dispatch(restoreSession()),
    updateUser: (data) => dispatch(updateUser(data)),
    clearError: () => dispatch(clearError()),
  };
};

export default useAuth;
