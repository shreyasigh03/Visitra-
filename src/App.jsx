import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import Landingpg from "./Components/Landingpg";
import Feature from "./Components/Feature";
import Howitworks from "./Components/Howitworks";
import ProtectedRoute from "./Components/ProtectedRoute";

const VisitorRegistration = lazy(() => import("./Components/VisitorRegistration"));
const Otpverification = lazy(() => import("./Components/Otpverification"));
const Facerecognition = lazy(() => import("./Components/Facerecognition"));
const AdminLogin = lazy(() => import("./Components/AdminLogin"));
const Admindashboard = lazy(() => import("./Components/Admindashboard"));
const Adminentry = lazy(() => import("./Components/Adminentry"));
const Adminarchive = lazy(() => import("./Components/Adminarchive"));
const Adminteachers = lazy(() => import("./Components/Adminteachers"));
const TeacherLogin = lazy(() => import("./Components/TeacherLogin"));
const TeacherSetup = lazy(() => import("./Components/TeacherSetup"));
const TeacherDashboard = lazy(() => import("./Components/TeacherDashboard"));
const Gate = lazy(() => import("./Components/Gate"));
const GuardLogin = lazy(() => import("./Components/GuardLogin"));
const Adminguards = lazy(() => import("./Components/Adminguards"));
const Adminblacklist = lazy(() => import("./Components/Adminblacklist"));
const Adminactivity = lazy(() => import("./Components/Adminactivity"));
const SuperAdmin = lazy(() => import("./Components/SuperAdmin"));
const SuperLogin = lazy(() => import("./Components/SuperLogin"));
const Organizations = lazy(() => import("./Components/Organizations"));
const Adminprofile = lazy(() => import("./Components/Adminprofile"));

const Layout = () => (
  <Suspense fallback={<p className="p-10 text-center text-[var(--muted)]">Loading…</p>}>
    <Outlet />
  </Suspense>
);

const ErrorPage = () => (
  <div className="p-10 text-center">
    <h1 className="font-display mb-2 text-2xl font-extrabold">This page could not be loaded</h1>
    <p className="mb-5 text-[var(--muted)]">Please reload. If it keeps happening, go back to the home page.</p>
    <a href="/" className="btn-primary inline-block px-6 py-3">Go home</a>
  </div>
);

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Landingpg /> },
      { path: "/Feature", element: <Feature /> },
      { path: "/Works", element: <Howitworks /> },
      { path: "/Visitor", element: <VisitorRegistration /> },
      { path: "/otp", element: <Otpverification /> },
      { path: "/Facerecognition", element: <Facerecognition /> },
      { path: "/Organizations", element: <Organizations /> },
      { path: "/SuperLogin", element: <SuperLogin /> },
      {
        element: <ProtectedRoute role="super" />,
        children: [{ path: "/SuperAdmin", element: <SuperAdmin /> }],
      },
      { path: "/GuardLogin", element: <GuardLogin /> },
      {
        element: <ProtectedRoute role="guard" also="admin" />,
        children: [{ path: "/Gate", element: <Gate /> }],
      },
      { path: "/TeacherLogin", element: <TeacherLogin /> },
      { path: "/TeacherSetup", element: <TeacherSetup /> },
      { path: "/AdminLogin", element: <AdminLogin /> },
      {
        element: <ProtectedRoute role="teacher" />,
        children: [{ path: "/TeacherDashboard", element: <TeacherDashboard /> }],
      },
      {
        element: <ProtectedRoute role="admin" />,
        children: [
          { path: "/Adminguards", element: <Adminguards /> },
          { path: "/Adminblacklist", element: <Adminblacklist /> },
          { path: "/Adminactivity", element: <Adminactivity /> },
          { path: "/Adminteachers", element: <Adminteachers /> },
          { path: "/Admindashboard", element: <Admindashboard /> },
          { path: "/Adminentry", element: <Adminentry /> },
          { path: "/Adminarchive", element: <Adminarchive /> },
          { path: "/Adminprofile", element: <Adminprofile /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
