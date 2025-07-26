import Foundation

enum Gender: String, Codable, CaseIterable {
    case MALE
    case FEMALE
    
    var displayName: String {
        switch self {
        case .MALE: return "Male"
        case .FEMALE: return "Female"
        }
    }
}

struct CreateParticipant: Codable {
    let username: String
    let gender: Gender
}

struct Participant: Codable, Identifiable {
    let id: String
    let username: String
    let beerCount: Int
    let eventBeerCount: Int
    let lastBeerTime: Date?
    let isRegistrationComplete: Bool
    let gender: Gender
    let registrationToken: String?
    let role: String
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
    
    private enum CodingKeys: String, CodingKey {
        case id, username, beerCount, eventBeerCount, lastBeerTime, isRegistrationComplete, gender, registrationToken, role, createdAt, updatedAt, deletedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        username = try container.decode(String.self, forKey: .username)
        beerCount = try container.decode(Int.self, forKey: .beerCount)
        eventBeerCount = try container.decodeIfPresent(Int.self, forKey: .eventBeerCount) ?? 0
        lastBeerTime = try container.decodeIfPresent(Date.self, forKey: .lastBeerTime)
        isRegistrationComplete = try container.decode(Bool.self, forKey: .isRegistrationComplete)
        gender = try container.decode(Gender.self, forKey: .gender)
        registrationToken = try container.decodeIfPresent(String.self, forKey: .registrationToken)
        role = try container.decode(String.self, forKey: .role)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        updatedAt = try container.decode(Date.self, forKey: .updatedAt)
        deletedAt = try container.decodeIfPresent(Date.self, forKey: .deletedAt)
    }
} 