import Foundation

class DashboardService: ObservableObject {
    static let shared = DashboardService()
    
    @Published var stats: DashboardStats?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient.shared
    private let participantsService = ParticipantsService.shared
    private let eventsService = EventsService.shared
    private let barrelsService = BarrelsService.shared
    
    private init() {}
    
    // MARK: - Public Methods
    
    func loadDashboardStats() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            Config.printDebug("Loading dashboard stats...")
            
            // Get stats from API
            let dashboardStats: DashboardStats = try await apiClient.get(
                endpoint: "/dashboard/overview",
                responseType: DashboardStats.self
            )
            
            await MainActor.run {
                self.stats = dashboardStats
                self.isLoading = false
            }
            
            Config.printDebug("Loaded dashboard stats")
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load dashboard stats: \(error.localizedDescription)"
                self.isLoading = false
            }
            Config.printDebug("Failed to load dashboard stats: \(error)")
        }
    }
    
    func loadAllData() async {
        await MainActor.run {
            isLoading = true
        }
        
        // Load all data in parallel for better performance
        async let participantsTask = participantsService.loadParticipants()
        async let eventsTask = eventsService.loadEvents()
        async let barrelsTask = barrelsService.loadBarrels()
        async let statsTask = loadDashboardStats()
        
        // Wait for all to complete
        await participantsTask
        await eventsTask
        await barrelsTask
        await statsTask
        
        await MainActor.run {
            self.isLoading = false
        }
        
        Config.printDebug("Loaded all dashboard data")
    }
    
    func refreshData() async {
        Config.printDebug("Refreshing dashboard data...")
        await loadAllData()
    }
    
    // MARK: - Computed Statistics
    
    func getComputedStats() -> ComputedDashboardStats {
        let participants = participantsService.participants
        let activeEvent = eventsService.activeEvent
        let barrels = barrelsService.barrels
        
        let totalParticipants = participants.count
        let activeParticipants = participants.filter { $0.beerCount > 0 }.count
        let totalBeers = participants.reduce(0) { $0 + $1.beerCount }
        
        let barrelStats = barrelsService.getBarrelStats()
        let totalRemainingBeers = barrelsService.getTotalRemainingBeers()
        
        let topParticipant = participants.max(by: { $0.beerCount < $1.beerCount })
        let beerTimes: [Date] = participants.compactMap { participant in
            guard let timeString = participant.lastBeerTime else { return nil }
            return ISO8601DateFormatter().date(from: timeString)
        }
        let lastBeerTime = beerTimes.max()
        
        // Calculate average beers per hour if we have an active event
        var averageBeersPerHour: Double = 0
        if let activeEvent = activeEvent,
           let startDate = ISO8601DateFormatter().date(from: activeEvent.startDate) {
            let hoursSinceStart = max(1, Date().timeIntervalSince(startDate) / 3600)
            averageBeersPerHour = Double(totalBeers) / hoursSinceStart
        }
        
        return ComputedDashboardStats(
            totalParticipants: totalParticipants,
            activeParticipants: activeParticipants,
            totalBeers: totalBeers,
            totalBarrels: barrelStats.total,
            activeBarrels: barrelStats.active,
            emptyBarrels: barrelStats.empty,
            standbyBarrels: barrelStats.standby,
            totalRemainingBeers: totalRemainingBeers,
            topParticipant: topParticipant,
            lastBeerTime: lastBeerTime,
            averageBeersPerHour: averageBeersPerHour,
            activeEvent: activeEvent,
            hasActivity: totalBeers > 0 || totalParticipants > 0
        )
    }
    
    func getRecentActivity() -> [ActivityItem] {
        var activities: [ActivityItem] = []
        
        // Recent participants with beer activity
        let recentParticipants = participantsService.participants
            .filter { $0.lastBeerTime != nil }
            .sorted { participant1, participant2 in
                guard let time1 = participant1.lastBeerTime,
                      let time2 = participant2.lastBeerTime,
                      let date1 = ISO8601DateFormatter().date(from: time1),
                      let date2 = ISO8601DateFormatter().date(from: time2) else {
                    return false
                }
                return date1 > date2
            }
            .prefix(5)
        
        for participant in recentParticipants {
            guard let timeString = participant.lastBeerTime,
                  let time = ISO8601DateFormatter().date(from: timeString) else { continue }
            
            activities.append(ActivityItem(
                type: .beerAdded,
                description: "\(participant.displayName) had a beer",
                timestamp: time,
                participant: participant
            ))
        }
        
        return activities.sorted { $0.timestamp > $1.timestamp }
    }
    
    func clearError() {
        errorMessage = nil
    }
}

// MARK: - Supporting Models

struct ComputedDashboardStats {
    let totalParticipants: Int
    let activeParticipants: Int
    let totalBeers: Int
    let totalBarrels: Int
    let activeBarrels: Int
    let emptyBarrels: Int
    let standbyBarrels: Int
    let totalRemainingBeers: Int
    let topParticipant: User?
    let lastBeerTime: Date?
    let averageBeersPerHour: Double
    let activeEvent: Event?
    let hasActivity: Bool
}

struct ActivityItem: Identifiable {
    let id = UUID()
    let type: ActivityType
    let description: String
    let timestamp: Date
    let participant: User?
    
    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: timestamp, relativeTo: Date())
    }
}

enum ActivityType {
    case beerAdded
    case participantAdded
    case eventStarted
    case barrelActivated
} 