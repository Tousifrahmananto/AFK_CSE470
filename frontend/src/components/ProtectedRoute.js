import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Minimal guard:
 * - If there's no token (context or localStorage), send to /login
 * - If we already have a user object and it's not Admin, send home
 * - Otherwise render children (even while user is still hydrating)
 */
export function RequireAdmin({ children }) {
    const ctx = useContext(AuthContext) || {};
    const location = useLocation();

    const tokenFromCtx = ctx.token;
    const tokenFromLS = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const hasToken = Boolean(tokenFromCtx || tokenFromLS);

    if (!hasToken) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // If user is loaded and it is definitively not Admin, block.
    if (ctx.user && ctx.user.role !== "Admin") {
        return <Navigate to="/" replace />;
    }

    return children;
}

/* Optional generic auth guard if you need it elsewhere */
export function RequireAuth({ children }) {
    const ctx = useContext(AuthContext) || {};
    const location = useLocation();

    const tokenFromCtx = ctx.token;
    const tokenFromLS = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const hasToken = Boolean(tokenFromCtx || tokenFromLS);

    if (!hasToken) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return children;
}
