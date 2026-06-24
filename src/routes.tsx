import type { RouteRecord } from 'vite-react-ssg'
import incidentsIndex from './generated/incidents-index.json'

export const routes: RouteRecord[] = [
  {
    path: '/',
    lazy: () => import('./pages/index'),
  },
  {
    path: '/incident/:id',
    lazy: () => import('./pages/incident/[id]'),
    getStaticPaths: () => incidentsIndex.map(i => `incident/${i.id}`),
  },
  {
    path: '*',
    lazy: () => import('./pages/404'),
  },
]
