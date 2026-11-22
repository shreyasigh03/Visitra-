import { useSyncExternalStore } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn, subscribeToAuth } from "../lib/auth";

const LOGIN = { admin: "/AdminLogin", teacher: "/TeacherLogin", guard: "/GuardLogin", super: "/SuperLogin" };

// `also` lets a second kind of user in.
const ProtectedRoute = ({ role, also }) => {
  const loggedIn = useSyncExternalStore(subscribeToAuth, () => isLoggedIn(role) || Boolean(also && isLoggedIn(also)));
  const { pathname, search } = useLocation();
  return loggedIn ? <Outlet /> : <Navigate to={LOGIN[role]} replace state={{ from: pathname + search }} />;
};

export default ProtectedRoute;
