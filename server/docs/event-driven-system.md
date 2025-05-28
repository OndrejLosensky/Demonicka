# Event-Driven System Documentation

## Overview

The **Event-Driven System** is a core architectural feature of the Démonická beer tracking application that allows users to organize and analyze data based on specific events (parties, gatherings, etc.). This system provides event-scoped data views across all major application components including dashboard analytics, leaderboards, participant management, and barrel tracking.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Features](#core-features)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Event Management](#event-management)
6. [Data Filtering](#data-filtering)
7. [Feature Flags](#feature-flags)
8. [API Endpoints](#api-endpoints)
9. [Usage Examples](#usage-examples)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

The event-driven system is built around the concept of **Events** as central organizing entities that group participants, barrels, and beer consumption data. The architecture supports both:

- **Event-scoped views**: Data filtered to show only information related to a specific event
- **Global views**: All-time data across all events (when no event is selected)

### Key Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Events      │    │  Participants   │    │     Barrels     │
│                 │    │                 │    │                 │
│ - id            │◄──►│ - id            │    │ - id            │
│ - name          │    │ - name          │    │ - size          │
│ - description   │    │ - gender        │    │ - orderNumber   │
│ - startDate     │    │ - beerCount     │    │ - remainingBeers│
│ - endDate       │    │                 │    │                 │
│ - isActive      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Beers      │
                    │                 │
                    │ - id            │
                    │ - participantId │
                    │ - timestamp     │
                    └─────────────────┘
```

## Core Features

### 1. Active Event Management
- **Single Active Event**: Only one event can be active at a time
- **Automatic Assignment**: New participants and barrels are automatically assigned to the active event
- **Event Switching**: Admins can force any event to become active
- **Event History**: Users can view historical events and their data

### 2. Event-Scoped Analytics
- **Dashboard**: Event-specific statistics and charts
- **Leaderboard**: Rankings filtered by event participants
- **Participant Management**: View participants for specific events
- **Barrel Tracking**: Monitor barrels assigned to events

### 3. Context Management
- **SelectedEventContext**: React context for managing currently viewed event
- **ActiveEventContext**: React context for managing the active event
- **Automatic Refresh**: Data updates when events change

## Implementation Details

### Backend Structure
- Event entity with relationships to participants and barrels
- Services for managing event lifecycle
- API endpoints for event operations
- Data filtering based on event context

### Frontend Implementation
- Context providers for event state management
- Event selector component
- Event-aware data fetching
- Automatic UI updates on event changes

## Backend Implementation

### Database Schema

#### Event Entity
```typescript
@Entity()
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'datetime' })
    startDate: Date;

    @Column({ type: 'datetime', nullable: true })
    endDate: Date | null;

    @Column({ default: true })
    isActive: boolean;

    @ManyToMany(() => Participant)
    @JoinTable({ name: 'event_participants' })
    participants: Participant[];

    @ManyToMany(() => Barrel)
    @JoinTable({ name: 'event_barrels' })
    barrels: Barrel[];
}
```

#### Junction Tables
- `event_participants`: Links events to participants
- `event_barrels`: Links events to barrels

### Service Layer

#### EventsService
```typescript
class EventsService {
    // Core CRUD operations
    async createEvent(data: CreateEventDto): Promise<Event>
    async getAllEvents(): Promise<Event[]>
    async getEvent(id: string): Promise<Event>
    async endEvent(id: string): Promise<Event>
    async makeEventActive(id: string): Promise<Event>
    
    // Participant/Barrel management
    async addParticipant(eventId: string, participantId: string): Promise<void>
    async addBarrel(eventId: string, barrelId: string): Promise<void>
    
    // Active event management
    async getActiveEvent(): Promise<Event | null>
}
```

#### DashboardService (Event-Enhanced)
```typescript
class DashboardService {
    // Event-aware analytics
    async getPublicStats(eventId?: string): Promise<PublicStatsDto>
    async getDashboardStats(eventId?: string): Promise<DashboardResponseDto>
    async getLeaderboard(eventId?: string): Promise<LeaderboardDto>
}
```

### Data Filtering Logic

When `eventId` is provided, the service:
1. Fetches the event with related participants and barrels
2. Extracts participant/barrel IDs for filtering
3. Queries beer data only for those participants
4. Returns event-scoped statistics

When no `eventId` is provided:
- Returns global statistics across all data

## Frontend Implementation

### Context Providers

#### SelectedEventContext
```typescript
interface SelectedEventContextType {
    selectedEvent: Event | null;
    setSelectedEvent: (event: Event | null) => void;
    events: Event[];
    isLoading: boolean;
}
```

#### ActiveEventContext
```typescript
interface ActiveEventContextType {
    activeEvent: Event | null;
    loadActiveEvent: () => Promise<void>;
}
```

### Key Components

#### EventSelector
```typescript
// Dropdown component for selecting events
<EventSelector />
```

#### Event-Driven Pages
- **Dashboard**: Shows analytics for selected event
- **Leaderboard**: Rankings for selected event participants
- **Participants**: Can show event-specific participants (feature flag controlled)
- **Barrels**: Can show event-specific barrels (feature flag controlled)

### Hooks

#### useSelectedEvent
```typescript
const { selectedEvent, setSelectedEvent, events } = useSelectedEvent();
```

#### useActiveEvent
```typescript
const { activeEvent, loadActiveEvent } = useActiveEvent();
```

## Event Management

### Creating Events
```typescript
// Automatically ends previous active event
const newEvent = await eventService.createEvent({
    name: "Summer Party 2024",
    description: "Annual summer gathering",
    startDate: new Date().toISOString()
});
```

### Managing Active Events
```typescript
// Force an event to become active
await eventService.makeEventActive(eventId);

// End the current active event
await eventService.endEvent(eventId);
```

### Adding Participants/Barrels
```typescript
// Add to specific event
await eventService.addParticipant(eventId, participantId);
await eventService.addBarrel(eventId, barrelId);

// New participants/barrels automatically added to active event
```

## Data Filtering

### Dashboard Analytics
```typescript
// Event-specific dashboard
const stats = await dashboardApi.getOverview(eventId);

// Global dashboard
const stats = await dashboardApi.getOverview();
```

### Leaderboard
```typescript
// Event-specific leaderboard
const leaderboard = await leaderboardApi.getLeaderboard(eventId);

// Global leaderboard
const leaderboard = await leaderboardApi.getLeaderboard();
```

## Feature Flags

The system uses feature flags to control event-related functionality:

```typescript
enum FeatureFlagKey {
    SHOW_EVENT_HISTORY = 'SHOW_EVENT_HISTORY',                    // Global event history
    SHOW_PARTICIPANTS_HISTORY = 'SHOW_PARTICIPANTS_HISTORY',      // Participants page event selector
    SHOW_BARRELS_HISTORY = 'SHOW_BARRELS_HISTORY',               // Barrels page event selector
    ACTIVE_EVENT_FUNCTIONALITY = 'ACTIVE_EVENT_FUNCTIONALITY'     // Force active event buttons
}
```

### Current Configuration
- `SHOW_EVENT_HISTORY`: `true` - Shows event selectors on Dashboard, Leaderboard, Participants, and Barrels pages
- `SHOW_PARTICIPANTS_HISTORY`: `false` - Additional control for participants page event selector (overrides SHOW_EVENT_HISTORY when false)
- `SHOW_BARRELS_HISTORY`: `false` - Additional control for barrels page event selector (overrides SHOW_EVENT_HISTORY when false)
- `ACTIVE_EVENT_FUNCTIONALITY`: `true` - Shows "Force Active Event" buttons

## API Endpoints

### Events
```
GET    /api/v1/events                    # Get all events
POST   /api/v1/events                    # Create new event
GET    /api/v1/events/:id                # Get specific event
PUT    /api/v1/events/:id/end            # End event
PUT    /api/v1/events/:id/activate       # Make event active
GET    /api/v1/events/active             # Get active event
POST   /api/v1/events/:id/participants   # Add participant to event
POST   /api/v1/events/:id/barrels        # Add barrel to event
```

### Event-Enhanced Analytics
```
GET    /api/v1/dashboard/overview?eventId=:id     # Event-specific dashboard
GET    /api/v1/dashboard/leaderboard?eventId=:id  # Event-specific leaderboard
GET    /api/v1/dashboard/public?eventId=:id       # Event-specific public stats
```

## Usage Examples

### 1. Creating and Managing Events

```typescript
// Create a new event (automatically becomes active)
const event = await eventService.createEvent({
    name: "New Year Party 2024",
    description: "Celebrating the new year",
    startDate: "2024-12-31T20:00:00Z"
});

// Add participants to the event
await eventService.addParticipant(event.id, participantId);

// Add barrels to the event
await eventService.addBarrel(event.id, barrelId);
```

### 2. Viewing Event-Specific Data

```typescript
// Select an event for viewing
setSelectedEvent(event);

// Dashboard will automatically show event-specific data
const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard', selectedEvent?.id],
    queryFn: () => dashboardApi.getOverview(selectedEvent?.id)
});

// Leaderboard will show only participants from the selected event
const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', selectedEvent?.id],
    queryFn: () => leaderboardApi.getLeaderboard(selectedEvent?.id)
});
```

### 3. Switching Between Events

```typescript
// View historical event
setSelectedEvent(historicalEvent);

// Return to active event view
setSelectedEvent(activeEvent);

// View global data (all events)
setSelectedEvent(null);
```

### 4. Force Activating Events

```typescript
// Make a historical event active again
await eventService.makeEventActive(historicalEventId);

// This will:
// 1. End the current active event
// 2. Make the selected event active
// 3. New participants/barrels will be assigned to this event
```

## Troubleshooting

### Common Issues

#### 1. Data Not Refreshing After Event Switch
**Problem**: Dashboard/leaderboard shows old data after selecting different event
**Solution**: Check that React Query keys include `selectedEvent?.id`

```typescript
// Correct implementation
const { data } = useQuery({
    queryKey: ['dashboard', selectedEvent?.id],  // ✅ Includes event ID
    queryFn: () => dashboardApi.getOverview(selectedEvent?.id)
});
```

#### 2. Participants Not Appearing in Event
**Problem**: Added participants don't show in event detail
**Solution**: Ensure proper event-participant association and context refresh

```typescript
// After adding participant
await Promise.all([
    loadEventData(),      // Refresh event data
    loadParticipants(),   // Refresh participants list
    loadActiveEvent()     // Refresh active event if needed
]);
```

#### 3. Event Selector Not Showing
**Problem**: EventSelector component not visible
**Solution**: Check feature flags configuration

```typescript
// Check feature flag
const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
```

#### 4. Active Event Not Updating
**Problem**: Active event context not reflecting changes
**Solution**: Ensure manual selection tracking

```typescript
// Prevent auto-switching when viewing history
const manualSelectionRef = useRef(false);

// Only auto-update if no manual selection
if (!manualSelectionRef.current && newActiveEvent) {
    setSelectedEvent(newActiveEvent);
}
```

### Performance Considerations

1. **Query Caching**: React Query caches event-specific data separately
2. **Lazy Loading**: Event lists are loaded on demand
3. **Debounced Updates**: Event switching is debounced to prevent excessive API calls
4. **Selective Refreshing**: Only affected components refresh when events change

### Database Optimization

1. **Indexes**: Ensure indexes on `event_id` foreign keys
2. **Junction Tables**: Optimized for many-to-many relationships
3. **Query Optimization**: Use `IN` clauses for filtering by event participants/barrels

## Future Enhancements

1. **Event Templates**: Predefined event configurations
2. **Event Cloning**: Duplicate events with participants/barrels
3. **Event Statistics**: Advanced analytics per event
4. **Event Archiving**: Archive old events for performance
5. **Event Permissions**: Role-based access to events
6. **Event Notifications**: Real-time updates for event changes

---

*Last updated: January 2024*
*Version: 1.0* 