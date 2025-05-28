# Systém událostí

## Architektura

Systém událostí je základním stavebním kamenem aplikace Démonická. Umožňuje organizovat a analyzovat data na základě konkrétních událostí (párty, setkání, atd.).

### Klíčové komponenty

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Události     │    │    Účastníci    │    │      Sudy       │
│                 │    │                 │    │                 │
│ - id            │◄──►│ - id            │    │ - id            │
│ - název         │    │ - jméno         │    │ - velikost      │
│ - popis        │    │ - pohlaví       │    │ - číslo         │
│ - začátek      │    │ - počet piv     │    │ - zbývající piva│
│ - konec        │    │                 │    │                 │
│ - aktivní      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                               │
                   ┌─────────────────┐
                   │      Piva       │
                   │                 │
                   │ - id            │
                   │ - účastník_id   │
                   │ - čas           │
                   └─────────────────┘
```

## Funkce systému

### 1. Správa aktivní události
- **Jedna aktivní událost**: V jeden moment může být aktivní pouze jedna událost
- **Automatické přiřazení**: Noví účastníci a sudy jsou automaticky přiřazeni k aktivní události
- **Přepínání událostí**: Administrátoři mohou aktivovat libovolnou událost
- **Historie událostí**: Přístup k historickým událostem a jejich datům

### 2. Statistiky události
- **Dashboard**: Statistiky specifické pro událost
- **Žebříček**: Pořadí filtrované podle účastníků události
- **Správa účastníků**: Zobrazení účastníků pro konkrétní události
- **Sledování sudů**: Monitoring sudů přiřazených k událostem

### 3. Správa kontextu
- **SelectedEventContext**: React kontext pro správu aktuálně zobrazené události
- **ActiveEventContext**: React kontext pro správu aktivní události
- **Automatická aktualizace**: Aktualizace dat při změně události

## Implementační detaily

### Backend struktura
- Entita události s vazbami na účastníky a sudy
- Služby pro správu životního cyklu události
- API endpointy pro manipulaci s událostmi

### Frontend implementace
- Kontextové providery pro správu stavu události
- Komponenty pro zobrazení a manipulaci s událostmi
- Automatická synchronizace dat

## API endpointy

### Správa událostí
```
POST   /api/v1/events           # Vytvoření nové události
GET    /api/v1/events          # Seznam událostí
GET    /api/v1/events/:id      # Detail události
PUT    /api/v1/events/:id      # Úprava události
DELETE /api/v1/events/:id      # Smazání události
```

### Účastníci a sudy
```
POST   /api/v1/events/:id/participants   # Přidání účastníka
POST   /api/v1/events/:id/barrels       # Přidání sudu
```

### Statistiky události
```
GET    /api/v1/dashboard/overview?eventId=:id     # Dashboard události
GET    /api/v1/dashboard/leaderboard?eventId=:id  # Žebříček události
GET    /api/v1/dashboard/public?eventId=:id       # Veřejné statistiky
```

## Příklady použití

### 1. Vytvoření a správa událostí

```typescript
// Vytvoření nové události (automaticky se stane aktivní)
const event = await eventService.createEvent({
    name: "Silvestr 2024",
    description: "Silvestrovská párty",
    startDate: "2024-12-31T20:00:00Z"
});

// Přidání účastníků k události
await eventService.addParticipant(event.id, participantId);

// Přidání sudů k události
await eventService.addBarrel(event.id, barrelId);
```

### 2. Zobrazení dat události

```typescript
// Výběr události pro zobrazení
setSelectedEvent(event);

// Dashboard automaticky zobrazí data události
const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard', selectedEvent?.id],
    queryFn: () => dashboardApi.getOverview(selectedEvent?.id)
});

// Žebříček zobrazí pouze účastníky vybrané události
const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', selectedEvent?.id],
    queryFn: () => leaderboardApi.getLeaderboard(selectedEvent?.id)
});
```

### 3. Přepínání mezi událostmi

```typescript
// Zobrazení historické události
setSelectedEvent(historicalEvent);

// Návrat na aktivní událost
setSelectedEvent(activeEvent);

// Zobrazení globálních dat (všechny události)
setSelectedEvent(null);
```

### 4. Aktivace události

```typescript
// Aktivace historické události
await eventService.makeEventActive(historicalEventId);

// Toto:
// 1. Ukončí aktuální aktivní událost
// 2. Aktivuje vybranou událost
// 3. Noví účastníci/sudy budou přiřazeni k této události
``` 