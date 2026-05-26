import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { CurrencyDetailPage } from '../pages/CurrencyDetailPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PortfolioPage } from '../pages/PortfolioPage';
import { RegisterPage } from '../pages/RegisterPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'currencies/:curUnit', element: <CurrencyDetailPage /> },
      { path: 'portfolio', element: <PortfolioPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
