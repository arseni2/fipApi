import {useAuth} from "../hooks/useAuth.ts";

export const ProtectedRoute = ({ children }) => {
  const auth = useAuth();

  return (
    <div>
      {auth && children}
    </div>
  );
};