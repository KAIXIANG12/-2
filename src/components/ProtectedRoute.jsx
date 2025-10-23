// src/components/ProtectedRoute.jsx
import * as React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AT } from "../api/client";

export default function ProtectedRoute() {
    const location = useLocation();
    const token = AT.get();
    if (!token) {
        return <Navigate to="/auth/login" replace state={{ from: location }} />;
    }
    return <Outlet />;
}
