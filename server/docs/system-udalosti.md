# Dokumentace systému událostí

## Přehled

**Systém událostí** je klíčovou architektonickou funkcí aplikace Démonická pro sledování piva, která umožňuje uživatelům organizovat a analyzovat data na základě konkrétních událostí (párty, setkání atd.). Tento systém poskytuje pohledy na data v rámci událostí napříč všemi hlavními komponenty aplikace včetně analytiky dashboardu, žebříčků, správy účastníků a sledování sudů.

## Obsah

1. [Přehled architektury](#prehled-architektury)
2. [Základní funkce](#zakladni-funkce)
3. [Backend implementace](#backend-implementace)
4. [Frontend implementace](#frontend-implementace)
5. [Správa událostí](#sprava-udalosti)
6. [Filtrování dat](#filtrovani-dat)
7. [Feature flags](#feature-flags)
8. [API endpointy](#api-endpointy)
9. [Příklady použití](#priklady-pouziti)
10. [Řešení problémů](#reseni-problemu)

## Přehled architektury

Systém událostí je postaven kolem konceptu **Událostí** jako centrálních organizačních entit, které seskupují účastníky, sudy a data o konzumaci piva. Architektura podporuje:

- **Pohledy v rámci události**: Data filtrovaná pro zobrazení pouze informací souvisejících s konkrétní událostí
- **Globální pohledy**: Celoživotní data napříč všemi událostmi (když není vybrána žádná událost)

### Klíčové komponenty

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Události     │    │    Účastníci    │    │      Sudy       │
│                 │    │                 │    │                 │
│ - id            │◄──►│ - id            │    │ - id            │
│ - název         │    │ - jméno         │    │ - velikost      │
│ - popis         │    │ - pohlaví       │    │ - čísloObjedn.  │
│ - datumZačátku  │    │ - početPiv      │    │ - zbývajícíPiva │
│ - datumKonce    │    │                 │    │                 │
│ - jeAktivní     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Piva       │
                    │                 │
                    │ - id            │
                    │ - účastníkId    │
                    │ - časováZnačka  │
                    └─────────────────┘
```

## Základní funkce

### 1. Správa aktivní události
- **Jedna aktivní událost**: V jednu chvíli může být aktivní pouze jedna událost
- **Automatické přiřazení**: Noví účastníci a sudy jsou automaticky přiřazeni k aktivní události
- **Přepínání událostí**: Administrátoři mohou vynutit aktivaci libovolné události
- **Historie událostí**: Uživatelé mohou prohlížet historické události a jejich data

### 2. Analytika v rámci události
- **Dashboard**: Statistiky a grafy specifické pro událost
- **Žebříček**: Pořadí filtrované podle účastníků události
- **Správa účastníků**: Zobrazení účastníků pro konkrétní události
- **Sledování sudů**: Monitoring sudů přiřazených k událostem

### 3. Správa kontextu
- **KontextVybranéUdálosti**: React kontext pro správu aktuálně zobrazené události
- **KontextAktivníUdálosti**: React kontext pro správu aktivní události
- **Automatická aktualizace**: Aktualizace dat při změně událostí

## Implementační detaily

### Struktura backendu
- Entita události se vztahy k účastníkům a sudům
- Služby pro správu životního cyklu události
- API endpointy pro operace s událostmi
- Filtrování dat na základě kontextu události

### Implementace frontendu
- Poskytovatelé kontextu pro správu stavu události
- Komponenta pro výběr události
- Načítání dat s ohledem na událost
- Automatické aktualizace UI při změnách události

## Backend implementace

### Databázové schéma

#### Entita události
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

#### Spojovací tabulky
- `event_participants`: Propojuje události s účastníky
- `event_barrels`: Propojuje události se sudy

### Servisní vrstva

#### EventsService
```typescript
class EventsService {
    // Základní CRUD operace
    async createEvent(data: CreateEventDto): Promise<Event>
    async getAllEvents(): Promise<Event[]>
    async getEvent(id: string): Promise<Event>
    async endEvent(id: string): Promise<Event>
    async makeEventActive(id: string): Promise<Event>
    
    // Správa účastníků/sudů
    async addParticipant(eventId: string, participantId: string): Promise<void>
    async addBarrel(eventId: string, barrelId: string): Promise<void>
    
    // Správa aktivní události
    async getActiveEvent(): Promise<Event | null>
}
```

#### DashboardService (s podporou událostí)
```typescript
class DashboardService {
    // Analytika s ohledem na události
    async getPublicStats(eventId?: string): Promise<PublicStatsDto>
    async getDashboardStats(eventId?: string): Promise<DashboardResponseDto>
    async getLeaderboard(eventId?: string): Promise<LeaderboardDto>
}
```

### Logika filtrování dat

Když je poskytnut `eventId`:
1. Načte událost s přidruženými účastníky a sudy
2. Extrahuje ID účastníků/sudů pro filtrování
3. Dotazuje data o pivu pouze pro tyto účastníky
4. Vrací statistiky v rámci události

Když není poskytnut `eventId`:
- Vrací globální statistiky napříč všemi daty

## Frontend implementace

### Poskytovatelé kontextu

#### KontextVybranéUdálosti
```typescript
interface SelectedEventContextType {
    selectedEvent: Event | null;
    setSelectedEvent: (event: Event | null) => void;
    events: Event[];
    isLoading: boolean;
}
```

#### KontextAktivníUdálosti
```typescript
interface ActiveEventContextType {
    activeEvent: Event | null;
    loadActiveEvent: () => Promise<void>;
}
```

### Klíčové komponenty

#### VýběrUdálosti
```typescript
// Dropdown komponenta pro výběr událostí
<EventSelector />
```

#### Stránky řízené událostmi
- **Dashboard**: Zobrazuje analytiku pro vybranou událost
- **Žebříček**: Pořadí pro účastníky vybrané události
- **Účastníci**: Může zobrazovat účastníky specifické pro událost (řízeno feature flagem) 