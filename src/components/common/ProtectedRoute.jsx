import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const role = localStorage.getItem("role")?.toLowerCase().trim();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
}