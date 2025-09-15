import React from 'react';
import { Box, List, Divider } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { NavigationSection } from './NavigationSection';
import { ActiveEventInfo } from './ActiveEventInfo';
import { USER_ROLE } from '../../types/user';

export const SidebarContent: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { activeEvent } = useActiveEvent();

  const getNavigationItems = () => {
    if (!user) return [];
    
    const items = [];
    
    // Admin navigation
    if (hasRole([USER_ROLE.ADMIN])) {
      items.push({
        title: 'Administrace',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
          { to: '/events', label: 'Události', icon: 'event' },
        ]
      });
      
      if (activeEvent) {
        items.push({
          title: 'Aktivní událost',
          items: [
            { to: '/dashboard/participants', label: 'Účastníci', icon: 'people' },
            { to: '/dashboard/barrels', label: 'Sudy', icon: 'local_drink' },
            { to: '/dashboard/leaderboard', label: 'Žebříček', icon: 'leaderboard' },
          ]
        });
      }
    }
    
    // User navigation
    if (user?.role === USER_ROLE.USER) {
      items.push({
        title: 'Můj účet',
        items: [
          { to: `/${user?.id}/dashboard`, label: 'Moje statistiky', icon: 'analytics' },
          { to: '/achievements', label: 'Úspěchy', icon: 'emoji_events' },
        ]
      });
    }
    
    return items;
  };

  const navigationSections = getNavigationItems();

  return (
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Active Event Info */}
      {activeEvent && (
        <>
          <ActiveEventInfo />
          <Divider sx={{ mx: 2, opacity: 0.6 }} />
        </>
      )}

      {/* Navigation Sections */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {navigationSections.map((section, index) => (
          <NavigationSection
            key={section.title}
            title={section.title}
            items={section.items}
            isLast={index === navigationSections.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
};
