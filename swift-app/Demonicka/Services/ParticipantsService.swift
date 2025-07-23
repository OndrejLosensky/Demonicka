import Foundation

class ParticipantsService: ObservableObject {
    static let shared = ParticipantsService()
    
    @Published var participants: [User] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Public Methods
    
    func loadParticipants() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            Config.printDebug("Loading participants...")
            
            let response: PaginatedResponse<User> = try await apiClient.get(
                endpoint: "/users",
                responseType: PaginatedResponse<User>.self
            )
            
            await MainActor.run {
                self.participants = response.data.filter { $0.isActive }
                self.isLoading = false
            }
            
            Config.printDebug("Loaded \(response.data.count) participants")
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load participants: \(error.localizedDescription)"
                self.isLoading = false
            }
            Config.printDebug("Failed to load participants: \(error)")
        }
    }
    
    func createParticipant(name: String, gender: String) async throws -> User {
        Config.printDebug("Creating participant: \(name)")
        
        let request = CreateParticipantRequest(name: name, gender: gender)
        
        let newParticipant: User = try await apiClient.post(
            endpoint: "/users/participant",
            body: request,
            responseType: User.self,
            requiresAuth: false // This endpoint is public
        )
        
        await MainActor.run {
            self.participants.append(newParticipant)
        }
        
        Config.printDebug("Created participant: \(newParticipant.displayName)")
        return newParticipant
    }
    
    func addBeer(to participantId: String, eventId: String? = nil) async throws {
        let endpoint: String
        if let eventId = eventId {
            endpoint = "/events/\(eventId)/users/\(participantId)/beers"
        } else {
            endpoint = "/users/\(participantId)/beers"
        }
        
        Config.printDebug("Adding beer for participant: \(participantId)")
        
        try await apiClient.post(
            endpoint: endpoint,
            body: EmptyResponse(),
            responseType: EmptyResponse.self
        )
        
        // Update local participant beer count
        await MainActor.run {
            if let index = participants.firstIndex(where: { $0.id == participantId }) {
                // Create updated participant (since User is immutable)
                let oldParticipant = participants[index]
                let updatedParticipant = User(
                    id: oldParticipant.id,
                    username: oldParticipant.username,
                    name: oldParticipant.name,
                    firstName: oldParticipant.firstName,
                    lastName: oldParticipant.lastName,
                    gender: oldParticipant.gender,
                    role: oldParticipant.role,
                    beerCount: oldParticipant.beerCount + 1,
                    lastBeerTime: ISO8601DateFormatter().string(from: Date()),
                    isRegistrationComplete: oldParticipant.isRegistrationComplete,
                    createdAt: oldParticipant.createdAt,
                    updatedAt: oldParticipant.updatedAt,
                    deletedAt: oldParticipant.deletedAt
                )
                participants[index] = updatedParticipant
            }
        }
        
        Config.printDebug("Added beer for participant: \(participantId)")
    }
    
    func removeBeer(from participantId: String, eventId: String? = nil) async throws {
        let endpoint: String
        if let eventId = eventId {
            endpoint = "/events/\(eventId)/users/\(participantId)/beers"
        } else {
            endpoint = "/users/\(participantId)/beers"
        }
        
        Config.printDebug("Removing beer for participant: \(participantId)")
        
        try await apiClient.delete(endpoint: endpoint)
        
        // Update local participant beer count
        await MainActor.run {
            if let index = participants.firstIndex(where: { $0.id == participantId }) {
                let oldParticipant = participants[index]
                let updatedParticipant = User(
                    id: oldParticipant.id,
                    username: oldParticipant.username,
                    name: oldParticipant.name,
                    firstName: oldParticipant.firstName,
                    lastName: oldParticipant.lastName,
                    gender: oldParticipant.gender,
                    role: oldParticipant.role,
                    beerCount: max(0, oldParticipant.beerCount - 1),
                    lastBeerTime: oldParticipant.lastBeerTime,
                    isRegistrationComplete: oldParticipant.isRegistrationComplete,
                    createdAt: oldParticipant.createdAt,
                    updatedAt: oldParticipant.updatedAt,
                    deletedAt: oldParticipant.deletedAt
                )
                participants[index] = updatedParticipant
            }
        }
        
        Config.printDebug("Removed beer for participant: \(participantId)")
    }
    
    func deleteParticipant(_ participantId: String) async throws {
        Config.printDebug("Deleting participant: \(participantId)")
        
        try await apiClient.delete(endpoint: "/users/\(participantId)")
        
        await MainActor.run {
            participants.removeAll { $0.id == participantId }
        }
        
        Config.printDebug("Deleted participant: \(participantId)")
    }
    
    // MARK: - Utility Methods
    
    func getParticipantById(_ id: String) -> User? {
        return participants.first { $0.id == id }
    }
    
    func getActiveParticipants() -> [User] {
        return participants.filter { $0.isActive }
    }
    
    func getMaleParticipants() -> [User] {
        return participants.filter { $0.gender == "MALE" }
    }
    
    func getFemaleParticipants() -> [User] {
        return participants.filter { $0.gender == "FEMALE" }
    }
    
    func getTotalBeerCount() -> Int {
        return participants.reduce(0) { $0 + $1.beerCount }
    }
    
    func clearError() {
        errorMessage = nil
    }
} 