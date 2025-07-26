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
    
    func createParticipant(_ participant: CreateParticipant) async throws {
        print("🚀 Creating participant with username: \(participant.username), gender: \(participant.gender)")
        
        do {
            // First create the participant
            let newParticipant: Participant = try await apiClient.fetch(
                "users/participant",
                method: .post,
                body: participant
            )
            
            // Then get the active event and add the participant to it
            let event: Event = try await apiClient.fetch("events/active")
            try await apiClient.requestWithoutResponse(
                "events/\(event.id)/users/\(newParticipant.id)",
                method: .put
            )
            
            print("✅ Successfully created participant: \(participant.username)")
        } catch {
            print("❌ Failed to create participant: \(error)")
            throw error
        }
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