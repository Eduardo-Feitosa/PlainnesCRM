import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
  const { autenticado, carregando } = useAuth();
  const location = useLocation();

  if (carregando)
  {
    return null;
  }

  if (!autenticado)
  {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
