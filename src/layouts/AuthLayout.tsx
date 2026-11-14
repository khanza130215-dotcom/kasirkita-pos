import { Outlet } from 'react-router-dom';

export const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <Outlet />
  </div>
);
