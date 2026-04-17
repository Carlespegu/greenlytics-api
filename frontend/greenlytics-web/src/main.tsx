import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/AppProviders';
import { router } from '@/routes/router';
import '@/app/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>,
);
