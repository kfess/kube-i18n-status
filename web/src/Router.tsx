import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { TermsOfServicePage } from './pages/TermsOfService.page';

const basename = import.meta.env.MODE === 'production' ? '/kubernetes-i18n-tracker' : '/';

const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/terms', element: <TermsOfServicePage /> },
  ],
  { basename }
);

export function Router() {
  return <RouterProvider router={router} />;
}
