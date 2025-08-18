// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TournamentsPage from "./pages/TournamentsPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import ProfilePage from "./pages/ProfilePage";

import CreateTeamPage from "./pages/CreateTeamPage";       // ← import
import MyTeamPage from "./pages/MyTeamPage";           // ← import
import BracketPage from "./pages/BracketPage";

function AppWrapper() {
  const { pathname } = useLocation();
  const hideOn = ["/login", "/register"];
  return (
    <>
      {!hideOn.includes(pathname) && <Navbar />}
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Tournaments */}
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/admin/create-tournament" element={<CreateTournamentPage />} />

        {/* Profile */}
        <Route path="/profile/:id" element={<ProfilePage />} />

        {/* Team Management */}
        <Route path="/teams/create" element={<CreateTeamPage />} />
        <Route path="/teams/my" element={<MyTeamPage />} />
        {/* fallback or 404 could go here */}
        <Route path="/tournaments/:id/bracket" element={<BracketPage />} />

      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
