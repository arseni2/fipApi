import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import {MainPage} from "./pages/MainPage.tsx";
import {SigninPage} from "./pages/Signin/SigninPage.tsx";
import {SignupPage} from "./pages/Signup/SignupPage.tsx";
import {ProtectedRoute} from "./components/ProtectedRoute.tsx";
import {DashboardDetailPage} from "./pages/DashboardDetail/DashboardDetailPage.tsx";
import {DashboardPublicPage} from "./pages/DashboardPublicPage/DashboardPublicPage.tsx";


const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><MainPage /></ProtectedRoute>,
  },
  {
    path: '/dashboard/:id',
    element: <ProtectedRoute><DashboardDetailPage /></ProtectedRoute>,
  },
  {
    path: '/board/:publicHash',
    element: <DashboardPublicPage />,
  },
  {
    path: '/signin',
    element: <SigninPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
]);


const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}