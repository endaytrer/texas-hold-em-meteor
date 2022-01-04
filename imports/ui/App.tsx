import React from 'react';
import { renderRoutes } from 'react-router-config';
import { BrowserRouter } from 'react-router-dom';
import { routesConfig } from './router';
export const App = () => {
  return <BrowserRouter>{renderRoutes(routesConfig)}</BrowserRouter>;
};
