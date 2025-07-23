import Foundation

class EventsService: ObservableObject {
    static let shared = EventsService()
    
    @Published var events: [Event] = []
    @Published var activeEvent: Event?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Public Methods
    
    func loadEvents() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            Config.printDebug("Loading events...")
            
            let loadedEvents: [Event] = try await apiClient.get(
                endpoint: "/events",
                responseType: [Event].self
            )
            
            await MainActor.run {
                self.events = loadedEvents.filter { $0.deletedAt == nil }
                self.activeEvent = loadedEvents.first { $0.isActive }
                self.isLoading = false
            }
            
            Config.printDebug("Loaded \(loadedEvents.count) events")
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load events: \(error.localizedDescription)"
                self.isLoading = false
            }
            Config.printDebug("Failed to load events: \(error)")
        }
    }
    
    func loadActiveEvent() async {
        do {
            Config.printDebug("Loading active event...")
            
            let active: Event? = try await apiClient.get(
                endpoint: "/events/active",
                responseType: Event?.self
            )
            
            await MainActor.run {
                self.activeEvent = active
            }
            
            Config.printDebug("Loaded active event: \(active?.name ?? "none")")
            
        } catch {
            Config.printDebug("Failed to load active event: \(error)")
        }
    }
    
    func createEvent(name: String, description: String?, startDate: Date, endDate: Date? = nil) async throws -> Event {
        Config.printDebug("Creating event: \(name)")
        
        let formatter = ISO8601DateFormatter()
        
        let request = CreateEventRequest(
            name: name,
            description: description,
            startDate: formatter.string(from: startDate),
            endDate: endDate != nil ? formatter.string(from: endDate!) : nil
        )
        
        let newEvent: Event = try await apiClient.post(
            endpoint: "/events",
            body: request,
            responseType: Event.self
        )
        
        await MainActor.run {
            self.events.append(newEvent)
        }
        
        Config.printDebug("Created event: \(newEvent.name)")
        return newEvent
    }
    
    func setActiveEvent(_ eventId: String) async throws {
        Config.printDebug("Setting active event: \(eventId)")
        
        let updatedEvent: Event = try await apiClient.put(
            endpoint: "/events/\(eventId)/active",
            body: EmptyResponse(),
            responseType: Event.self
        )
        
        await MainActor.run {
            // Update the events list
            if let index = events.firstIndex(where: { $0.id == eventId }) {
                events[index] = updatedEvent
            }
            
            // Set as active and deactivate others
            self.activeEvent = updatedEvent
            for i in 0..<events.count {
                if events[i].id != eventId && events[i].isActive {
                    events[i] = Event(
                        id: events[i].id,
                        name: events[i].name,
                        description: events[i].description,
                        startDate: events[i].startDate,
                        endDate: events[i].endDate,
                        isActive: false,
                        createdAt: events[i].createdAt,
                        updatedAt: events[i].updatedAt,
                        deletedAt: events[i].deletedAt
                    )
                }
            }
        }
        
        Config.printDebug("Set active event: \(updatedEvent.name)")
    }
    
    func addParticipantToEvent(_ eventId: String, participantId: String) async throws {
        Config.printDebug("Adding participant \(participantId) to event \(eventId)")
        
        let _: Event = try await apiClient.put(
            endpoint: "/events/\(eventId)/users/\(participantId)",
            body: EmptyResponse(),
            responseType: Event.self
        )
        
        Config.printDebug("Added participant to event")
    }
    
    func deleteEvent(_ eventId: String) async throws {
        Config.printDebug("Deleting event: \(eventId)")
        
        try await apiClient.delete(endpoint: "/events/\(eventId)")
        
        await MainActor.run {
            events.removeAll { $0.id == eventId }
            if activeEvent?.id == eventId {
                activeEvent = nil
            }
        }
        
        Config.printDebug("Deleted event: \(eventId)")
    }
    
    // MARK: - Utility Methods
    
    func getEventById(_ id: String) -> Event? {
        return events.first { $0.id == id }
    }
    
    func getActiveEvents() -> [Event] {
        return events.filter { $0.isActive }
    }
    
    func getUpcomingEvents() -> [Event] {
        let now = Date()
        let formatter = ISO8601DateFormatter()
        
        return events.filter { event in
            guard let startDate = formatter.date(from: event.startDate) else { return false }
            return startDate > now && !event.isActive
        }.sorted { event1, event2 in
            guard let date1 = formatter.date(from: event1.startDate),
                  let date2 = formatter.date(from: event2.startDate) else { return false }
            return date1 < date2
        }
    }
    
    func getPastEvents() -> [Event] {
        let now = Date()
        let formatter = ISO8601DateFormatter()
        
        return events.filter { event in
            if let endDate = event.endDate,
               let end = formatter.date(from: endDate) {
                return end < now && !event.isActive
            } else if let startDate = formatter.date(from: event.startDate) {
                // If no end date, consider it past if it started more than 7 days ago
                let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: now) ?? now
                return startDate < weekAgo && !event.isActive
            }
            return false
        }.sorted { event1, event2 in
            guard let date1 = formatter.date(from: event1.startDate),
                  let date2 = formatter.date(from: event2.startDate) else { return false }
            return date1 > date2 // Most recent first
        }
    }
    
    func hasActiveEvent() -> Bool {
        return activeEvent != nil
    }
    
    func clearError() {
        errorMessage = nil
    }
} 