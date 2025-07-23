import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var authViewModel: LoginViewModel
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome to Dashboard")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        if let user = authViewModel.currentUser {
                            Text("Logged in as \(user.username)")
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    
                    // Stats Overview
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        StatCard(title: "Active Barrels", value: "5", icon: "cylinder.fill")
                        StatCard(title: "Total Users", value: "24", icon: "person.2.fill")
                        StatCard(title: "Active Events", value: "2", icon: "calendar.fill")
                        StatCard(title: "Today's Beers", value: "42", icon: "mug.fill")
                    }
                    .padding(.horizontal)
                    
                    // Recent Activity
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Activity")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ForEach(1...5, id: \.self) { _ in
                            ActivityRow()
                        }
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ActivityRow: View {
    var body: some View {
        HStack {
            Circle()
                .fill(Color.blue)
                .frame(width: 8, height: 8)
            
            Text("New barrel added")
                .font(.subheadline)
            
            Spacer()
            
            Text("2m ago")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

#Preview {
    DashboardView()
        .environmentObject(LoginViewModel())
} 