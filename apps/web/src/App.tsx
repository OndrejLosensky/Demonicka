import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/landing/Landing';
import Header from './components/navigation/Header';
import { CoreProviders } from './components/providers/CoreProviders';
import RoleRoute from './components/auth/RoleRoute';
import GuestRoute from './components/auth/GuestRoute';
import { USER_ROLE } from '@demonicka/shared-types';
import { Dashboard } from './pages/Dashboard/Dashboard';
import Participants from './pages/Dashboard/Participants';
import Barrels from './pages/Dashboard/Barrels';
import { ConsumptionDetail } from './pages/Dashboard/ConsumptionDetail';
import { KpiDetail, KpiList } from './pages/Dashboard/KpiDetail';
import { BarrelDetail } from './pages/Dashboard/BarrelDetail';
import { TopUsersDetail } from './pages/Dashboard/TopUsersDetail';
import Leaderboard from './pages/Dashboard/Leaderboard';
import ProfilePage from './pages/Dashboard/Profile/index';
import { FeedbackPage } from './pages/Dashboard/Feedback';
import { Events } from './pages/Dashboard/Events';
import { EventDetail } from './pages/Dashboard/Events/EventDetail';
import { EventResults } from './pages/Dashboard/Events/EventResults';
import { EventRegistrationReview } from './pages/Dashboard/Events/EventRegistrationReview';
import { Docs } from './pages/Dashboard/System/Docs';
import { SystemLayout } from './pages/Dashboard/System/SystemLayout';
import { SystemPage } from './pages/Dashboard/System/SystemPage';
import { UsersPage } from './pages/Dashboard/System/UsersPage';
import { StatisticsPage } from './pages/Dashboard/System/StatisticsPage';
import { OperationsPage } from './pages/Dashboard/System/OperationsPage';
import { SettingsPage } from './pages/Dashboard/System/SettingsPage';
import { JobsPage } from './pages/Dashboard/System/JobsPage';
import { Activity } from './pages/Dashboard/Activity';
import { AchievementsPage } from './pages/User/Achievements';
import { UserDashboardLayout } from './pages/User/Dashboard/UserDashboardLayout';
import { UserDashboardOverview } from './pages/User/Dashboard/UserDashboardOverview';
import { UserDashboardEvents } from './pages/User/Dashboard/UserDashboardEvents';
import { UserDashboardEventLayout } from './pages/User/Dashboard/UserDashboardEventLayout';
import { UserDashboardEventDetail } from './pages/User/Dashboard/UserDashboardEventDetail';
import { UserDashboardEventBeerPong } from './pages/User/Dashboard/UserDashboardEventBeerPong';
import { UserDashboardEventGallery } from './pages/User/Dashboard/UserDashboardEventGallery';
import { LegacyUserDashboardRedirect } from './pages/User/Dashboard/LegacyUserDashboardRedirect';
import { BeerPongList } from './pages/BeerPong';
import { BeerPongDetail } from './pages/BeerPong/BeerPongDetail';
import { UserSettingsPage } from './pages/User/Settings/UserSettingsPage';
import { LegacyUserSettingsRedirect } from './pages/User/Settings/LegacyUserSettingsRedirect';
import { GalleryPage } from './pages/User/Gallery/GalleryPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import { CompleteRegistration } from './pages/Auth/CompleteRegistration';
import { EnterToken } from './pages/Auth/EnterToken';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { GoogleCallback } from './pages/Auth/GoogleCallback';
import { RegisterEventByToken } from './pages/EventRegistration/RegisterEventByToken';

const DashboardLayout = lazy(() =>
  import('./routes/DashboardRoutes').then((m) => ({ default: m.DashboardLayout }))
);

function App() {
  return (
    <CoreProviders>
      <Routes>
        <Route path="/" element={<Header />}>
          <Route index element={<Landing />} />
          <Route
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-gray-500">Loading…</div>
                  </div>
                }
              >
                <DashboardLayout />
              </Suspense>
            }
          >
            <Route
              path="dashboard"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <Dashboard />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/participants"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <Participants />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/barrels"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <Barrels />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/consumption"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <ConsumptionDetail />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/kpi"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <KpiList />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/kpi/:metric"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <KpiDetail />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/barrel/:id"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <BarrelDetail />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/top-users"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <TopUsersDetail />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/system"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <SystemLayout />
                </RoleRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route
                path="overview"
                element={
                  <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                    <SystemPage />
                  </RoleRoute>
                }
              />
              <Route
                path="users"
                element={
                  <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                    <UsersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="statistics"
                element={
                  <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                    <StatisticsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="operations"
                element={
                  <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                    <OperationsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                    <SettingsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="jobs"
                element={
                  <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                    <JobsPage />
                  </RoleRoute>
                }
              />
            </Route>
            <Route
              path="dashboard/activity"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                  <Activity />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/events"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <Events />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/events/:id"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <EventDetail />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/events/:id/results"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <EventResults />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/events/:id/registration"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <EventRegistrationReview />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/beer-pong"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <BeerPongList />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/beer-pong/:id"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <BeerPongDetail />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/docs"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                  <Docs />
                </RoleRoute>
              }
            />
            <Route
              path="u/:userId/profile"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <ProfilePage />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/feedback"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <FeedbackPage />
                </RoleRoute>
              }
            />
            <Route
              path="u/:username/settings"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <UserSettingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="u/:userId/settings"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <LegacyUserSettingsRedirect />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/leaderboard"
              element={<Leaderboard />}
            />
            <Route
              path="u/:username/dashboard"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <UserDashboardLayout />
                </RoleRoute>
              }
            >
              <Route index element={<UserDashboardOverview />} />
              <Route path="events" element={<UserDashboardEvents />} />
              <Route path="events/:id" element={<UserDashboardEventLayout />}>
                <Route index element={<UserDashboardEventDetail />} />
                <Route path="beer-pong" element={<UserDashboardEventBeerPong />} />
                <Route path="gallery" element={<UserDashboardEventGallery />} />
              </Route>
            </Route>
            <Route
              path=":userId/dashboard"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <LegacyUserDashboardRedirect />
                </RoleRoute>
              }
            />
            <Route
              path="u/:username/achievements"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <AchievementsPage />
                </RoleRoute>
              }
            />
            <Route
              path="u/:username/gallery"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <GalleryPage />
                </RoleRoute>
              }
            />
          </Route>
        </Route>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/complete-registration"
          element={
            <GuestRoute>
              <CompleteRegistration />
            </GuestRoute>
          }
        />
        <Route
          path="/enter-token"
          element={
            <GuestRoute>
              <EnterToken />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/auth/google/callback"
          element={
            <GuestRoute>
              <GoogleCallback />
            </GuestRoute>
          }
        />
        <Route
          path="/register/event/:token"
          element={<RegisterEventByToken />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CoreProviders>
  );
}

export default App;
