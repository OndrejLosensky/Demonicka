import SwiftUI

struct ParticipantsView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Stats
                    HStack(spacing: 20) {
                        StatCard(title: "Total", value: "24", color: .blue)
                        StatCard(title: "Active", value: "18", color: .green)
                        StatCard(title: "New Today", value: "3", color: .orange)
                    }
                    .padding(.horizontal)
                    
                    // Participants List Placeholder
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Participants")
                                .font(.headline)
                            Spacer()
                            Button("Add New") {
                                // TODO: Add new participant
                            }
                            .font(.caption)
                            .foregroundColor(.blue)
                        }
                        .padding(.horizontal)
                        
                        LazyVStack(spacing: 8) {
                            ParticipantRow(name: "Jan Novák", beerCount: 12, isActive: true)
                            ParticipantRow(name: "Anna Svobodová", beerCount: 8, isActive: true)
                            ParticipantRow(name: "Petr Dvořák", beerCount: 15, isActive: false)
                            ParticipantRow(name: "Marie Procházková", beerCount: 6, isActive: true)
                            ParticipantRow(name: "Tomáš Černý", beerCount: 11, isActive: true)
                        }
                        .background(Color(UIColor.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .gray.opacity(0.1), radius: 4, x: 0, y: 2)
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                }
                .padding(.top)
            }
            .navigationTitle("Participants")
            .background(Color(UIColor.systemGroupedBackground))
        }
    }
}

struct ParticipantRow: View {
    let name: String
    let beerCount: Int
    let isActive: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(isActive ? Color.green : Color.gray)
                .frame(width: 8, height: 8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.body)
                    .foregroundColor(.primary)
                Text("\(beerCount) beers")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if isActive {
                Button("+1") {
                    // TODO: Add beer
                }
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(6)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(10)
        .shadow(color: .gray.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

#Preview {
    ParticipantsView()
} 