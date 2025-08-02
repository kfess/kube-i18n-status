import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { NavigationBar } from '@/features/NavigationBar';
import { HomePage } from './pages/Home.page';

const basename = import.meta.env.MODE === 'production' ? '/kubernetes-i18n-tracker' : '/';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <NavigationBar>
          <HomePage />
        </NavigationBar>
      ),
    },
  ],
  { basename }
);

export function Router() {
  return <RouterProvider router={router} />;
}
