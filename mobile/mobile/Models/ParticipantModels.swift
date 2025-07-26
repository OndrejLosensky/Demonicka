import Foundation

struct Participant: Codable, Identifiable {
    let id: String
    let username: String
    let beerCount: Int          // Total beers across all events
    let eventBeerCount: Int     // Beers for current event
    let lastBeerTime: Date?
    let isRegistrationComplete: Bool
} 