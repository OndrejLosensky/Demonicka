import Foundation

class ParticipantService {
    static let shared = ParticipantService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    func fetchParticipants() async throws -> [Participant] {
        // First get the active event
        let event: Event = try await apiClient.fetch("events/active")
        // Then get the users for that event
        return try await apiClient.fetch("events/\(event.id)/users")
    }
    
    func addBeer(userId: String) async throws {
        let event: Event = try await apiClient.fetch("events/active")
        try await apiClient.requestWithoutResponse("events/\(event.id)/users/\(userId)/beers", method: .post)
    }
    
    func removeBeer(userId: String) async throws {
        let event: Event = try await apiClient.fetch("events/active")
        try await apiClient.requestWithoutResponse("events/\(event.id)/users/\(userId)/beers", method: .delete)
    }
}

// Helper model for active event
private struct Event: Codable {
    let id: String
} 