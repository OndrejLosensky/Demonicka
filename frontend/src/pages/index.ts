// Auth Pages
export { default as Login } from './Auth/Login';
export { default as Register } from './Auth/Register';
export { CompleteRegistration, EnterToken } from './Auth/Token';

// Dashboard Pages
export { Dashboard } from './Dashboard/Dashboard';

// Admin Pages
export { default as Participants } from './Dashboard/Admin/Participants';
export { default as Barrels } from './Dashboard/Admin/Barrels';
export { default as BeerPong } from './Dashboard/Admin/BeerPong';
export { SystemPage } from './Dashboard/Admin/System';
export { Logs } from './Dashboard/Admin/System/Logs';
export { Events } from './Dashboard/Admin/Events';
export { EventDetail } from './Dashboard/Admin/Events/EventDetail';
export { EventResults } from './Dashboard/Admin/Events/EventResults';
export { Docs } from './Dashboard/Admin/System/Docs';
export { default as Users } from './Dashboard/Admin/System/Users';
export { default as Leaderboard } from './Dashboard/Admin/Leaderboard';

// User Pages
export { PersonalStatsView } from './Dashboard/User/PersonalStats/PersonalStatsView';
export { AchievementsPage } from './Dashboard/User/Achievements';
export { default as ProfilePage } from './Dashboard/User/Profile';

// Public Pages
export { default as ArrivalRegistration } from './Public/Arrival';

// Other Pages
export { default as Landing } from './Landing';
