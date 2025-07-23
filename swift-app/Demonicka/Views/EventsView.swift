import SwiftUI

struct EventsView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Active Event Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Active Event")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            EventCard(
                                name: "Summer Beer Festival 2025",
                                date: "June 16-18, 2025",
                                participants: 24,
                                isActive: true,
                                color: .green
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Upcoming Events
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Upcoming Events")
                                .font(.headline)
                            Spacer()
                            Button("Create New") {
                                // TODO: Create new event
                            }
                            .font(.caption)
                            .foregroundColor(.blue)
                        }
                        .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            EventCard(
                                name: "Autumn Oktoberfest",
                                date: "September 15-17, 2025",
                                participants: 0,
                                isActive: false,
                                color: .orange
                            )
                            
                            EventCard(
                                name: "Winter Celebration",
                                date: "December 20-22, 2025",
                                participants: 0,
                                isActive: false,
                                color: .blue
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Past Events
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Past Events")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            EventCard(
                                name: "Spring Beer Tasting",
                                date: "March 10-12, 2025",
                                participants: 18,
                                isActive: false,
                                color: .gray
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                }
                .padding(.top)
            }
            .navigationTitle("Events")
            .background(Color(UIColor.systemGroupedBackground))
        }
    }
}

struct EventCard: View {
    let name: String
    let date: String
    let participants: Int
    let isActive: Bool
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text(date)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isActive {
                    Text("ACTIVE")
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(6)
                }
            }
            
            HStack(spacing: 20) {
                HStack(spacing: 4) {
                    Image(systemName: "person.3.fill")
                        .foregroundColor(color)
                    Text("\(participants) participants")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if isActive {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar.circle.fill")
                            .foregroundColor(.green)
                        Text("In Progress")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Button(isActive ? "Manage" : "View") {
                    // TODO: Navigate to event detail
                }
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(color.opacity(0.1))
                .foregroundColor(color)
                .cornerRadius(8)
            }
        }
        .padding(16)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: .gray.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

#Preview {
    EventsView()
} 