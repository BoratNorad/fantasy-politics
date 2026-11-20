import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth';
import { Layout } from './components/Layout';
import './index.css';
import { AdminPage } from './pages/admin/AdminPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SignupPage } from './pages/auth/SignupPage';
import { DashboardPage } from './pages/leagues/DashboardPage';
import { JoinLeaguePage } from './pages/leagues/JoinLeaguePage';
import { LeagueHomePage } from './pages/leagues/LeagueHomePage';
import { LeagueSettingsPage } from './pages/leagues/LeagueSettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayerPage } from './pages/players/PlayerPage';
import { PlayersPage } from './pages/players/PlayersPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/reset/:token" element={<ResetPasswordPage />} />
              <Route path="/join/:code" element={<JoinLeaguePage />} />
              <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route path="/leagues/:id" element={<RequireAuth><LeagueHomePage /></RequireAuth>} />
              <Route
                path="/leagues/:id/settings"
                element={<RequireAuth><LeagueSettingsPage /></RequireAuth>}
              />
              <Route path="/players" element={<RequireAuth><PlayersPage /></RequireAuth>} />
              <Route path="/players/:id" element={<RequireAuth><PlayerPage /></RequireAuth>} />
              <Route path="/admin/*" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
