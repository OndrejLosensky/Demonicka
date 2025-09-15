import type { DocCategory } from './types';

export const DOCUMENTATION_STRUCTURE: DocCategory[] = [
  {
    name: 'getting-started',
    title: 'Začínáme',
    description: 'Základní informace a průvodce aplikace',
    files: [
      {
        name: 'intro',
        title: 'Úvod do aplikace',
        description: 'Základní přehled a koncept aplikace',
        path: 'getting-started/intro.md'
      },
      {
        name: 'create-event',
        title: 'Vytvoření události',
        description: 'Jak vytvořit novou událost',
        path: 'getting-started/create-event.md'
      },
      {
        name: 'add-users',
        title: 'Přidání uživatelů',
        description: 'Jak přidat účastníky a aktivovat je',
        path: 'getting-started/add-users.md'
      }
    ]
  },
  {
    name: 'user-guide',
    title: 'Uživatelská příručka',
    description: 'Detailní návody pro používání aplikace',
    files: [
      {
        name: 'dashboard',
        title: 'Dashboard',
        description: 'Přehled a používání dashboardu',
        path: 'user-guide/dashboard.md'
      },
      {
        name: 'participants',
        title: 'Účastníci',
        description: 'Správa účastníků a jejich role',
        path: 'user-guide/participants.md'
      },
      {
        name: 'barrels',
        title: 'Sudy',
        description: 'Jak funguje správa sudů',
        path: 'user-guide/barrels.md'
      },
      {
        name: 'achievements',
        title: 'Úspěchy',
        description: 'Systém úspěchů a odměn',
        path: 'user-guide/achievements.md'
      },
      {
        name: 'events',
        title: 'Události',
        description: 'Správa a konfigurace událostí',
        path: 'user-guide/events.md'
      },
      {
        name: 'leaderboard',
        title: 'Žebříček',
        description: 'Žebříček a statistiky',
        path: 'user-guide/leaderboard.md'
      }
    ]
  },
  {
    name: 'api',
    title: 'API Dokumentace',
    description: 'Kompletní dokumentace API endpointů',
    files: [
      {
        name: 'overview',
        title: 'Přehled API',
        description: 'Základní informace o API',
        path: 'api/API.md'
      }
    ]
  }
];