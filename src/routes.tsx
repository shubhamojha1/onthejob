import type { RouteRecord } from 'vite-react-ssg'
import incidentsIndex from './generated/incidents-index.json'
import { FAILURE_CLASS_KEYS } from '../content/taxonomy'

export const routes: RouteRecord[] = [
  {
    path: '/',
    lazy: () => import('./pages/index'),
  },
  {
    path: '/interview',
    lazy: () => import('./pages/interview'),
  },
  {
    path: '/class/:key',
    lazy: () => import('./pages/class/[key]'),
    getStaticPaths: () => FAILURE_CLASS_KEYS.map(key => `class/${key}`),
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
