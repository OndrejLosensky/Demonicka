import Foundation

class EventService {
    static let shared = EventService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func fetchEvents() async throws -> [EventModel] {
        print("🔍 Starting to fetch events...")
        do {
            let events = try await apiClient.fetch("events") as [EventModel]
            print("✅ Successfully fetched \(events.count) events:")
            events.forEach { event in
                print("""
                      📅 Event:
                         ID: \(event.id)
                         Name: \(event.name)
                         Active: \(event.isActive)
                         Start: \(event.startDate.formatted())
                         End: \(event.endDate?.formatted() ?? "Ongoing")
                         Description: \(event.description ?? "No description")
                      """)
            }
            return events
        } catch {
            print("❌ Error fetching events: \(error)")
            if let apiError = error as? APIError {
                print("📝 API Error details: \(apiError.description)")
            }
            throw error
        }
    }
    
    func fetchActiveEvent() async throws -> EventModel {
        print("🎯 Fetching active event...")
        do {
            let event = try await apiClient.fetch("events/active") as EventModel
            print("""
                  ⭐️ Active Event:
                     ID: \(event.id)
                     Name: \(event.name)
                     Start: \(event.startDate.formatted())
                     End: \(event.endDate?.formatted() ?? "Ongoing")
                  """)
            return event
        } catch {
            print("❌ Error fetching active event: \(error)")
            if let apiError = error as? APIError {
                print("📝 API Error details: \(apiError.description)")
            }
            throw error
        }
    }
    
    func fetchEvent(id: String) async throws -> EventModel {
        print("🔍 Fetching event with ID: \(id)")
        do {
            let event = try await apiClient.fetch("events/\(id)") as EventModel
            print("""
                  📅 Event details:
                     ID: \(event.id)
                     Name: \(event.name)
                     Active: \(event.isActive)
                     Start: \(event.startDate.formatted())
                     End: \(event.endDate?.formatted() ?? "Ongoing")
                     Description: \(event.description ?? "No description")
                  """)
            return event
        } catch {
            print("❌ Error fetching event \(id): \(error)")
            if let apiError = error as? APIError {
                print("📝 API Error details: \(apiError.description)")
            }
            throw error
        }
    }
} 