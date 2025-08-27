// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { RequireAdmin } from "./components/ProtectedRoute";
import AdminMatchMediaPage from "./pages/AdminMatchMediaPage";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import ToastHost from "./components/ToastHost";
import AdminMatchStatsPage from "./pages/AdminMatchStatsPage";

import MediaGalleryPage from "./pages/MediaGalleryPage";
import AdminMediaPage from "./pages/AdminMediaPage";
import MyAdsPage from "./pages/MyAdsPage" // when you add it

// Auth pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
// Public / core pages
import TournamentsPage from "./pages/TournamentsPage";
import BracketPage from "./pages/BracketPage";
import ProfilePage from "./pages/ProfilePage";

// Team management
import CreateTeamPage from "./pages/CreateTeamPage";
import MyTeamPage from "./pages/MyTeamPage";
import TournamentsBrowsePage from "./pages/TournamentsBrowsePage";
import LeaderboardPage from "./pages/LeaderboardPage";

// Admin
import CreateTournamentPage from "./pages/CreateTournamentPage";

function AppFrame() {
  const { pathname } = useLocation();

  // Hide the navbar on auth screens and the landing (dashboard)
  const hideOn = new Set(["/login", "/register", "/dashboard", "/"]);
  const showNavbar = !hideOn.has(pathname);

  return (
    <div style={{ background: "#0b0d12", color: "#E6F0FF", minHeight: "100vh" }}>
      {showNavbar && <Navbar />}

      <Routes>
        {/* Default → Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public */}
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id/bracket" element={<BracketPage />} />

        {/* Admin */}
        <Route path="/admin/create-tournament" element={<CreateTournamentPage />} />

        {/* Team Manager (support both old and new paths) */}
        <Route path="/create-team" element={<CreateTeamPage />} />
        <Route path="/my-team" element={<MyTeamPage />} />
        <Route path="/teams/create" element={<CreateTeamPage />} />
        <Route path="/teams/my" element={<MyTeamPage />} />

        {/* Profile (me and by id) */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/tournaments" element={<TournamentsBrowsePage />} />

        {/* Media Gallery and Admin Media */}
        <Route path="/gallery" element={<MediaGalleryPage />} />
        <Route path="/admin/media" element={<AdminMediaPage />} />
        <Route path="/ads/mine" element={<MyAdsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/admin/match-stats/:tournamentId"
          element={
            <RequireAdmin>
              <AdminMatchStatsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/match-media/:id"
          element={
            <RequireAdmin>
              <AdminMatchMediaPage />
            </RequireAdmin>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ToastHost>
      <Router>
        <AppFrame />
      </Router>
    </ToastHost>
  );
}
