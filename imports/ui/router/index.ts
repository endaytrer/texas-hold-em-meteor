import { RouteConfig } from 'react-router-config';
import { GamePlay } from '../GamePlay';
import { Login } from '../Login';

export const routesConfig: RouteConfig[] = [
  {
    path: '/',
    exact: true,
    component: Login,
  },
  {
    path: '/game',
    exact: true,
    component: GamePlay,
  },
];
