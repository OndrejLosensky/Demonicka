import SwiftUI

struct DashboardView: View {
    @State private var dashboardData: DashboardData?
    @State private var isLoading = false
    @State private var error: Error?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    loadingView
                } else if let error = error {
                    errorView(error: error)
                } else if let data = dashboardData {
                    dashboardContent(data: data)
                } else {
                    Text("No data available")
                }
            }
            .navigationTitle("Dashboard")
        }
        .onAppear {
            Task {
                await loadDashboardData()
            }
        }
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading...")
                .foregroundColor(.secondary)
                .padding(.top)
        }
    }
    
    // MARK: - Error View
    private func errorView(error: Error) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.red)
            
            Text("Error loading dashboard")
                .font(.headline)
            
            Text(error.localizedDescription)
                .font(.subheadline)
                .foregroundColor(.red)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            if let apiError = error as? APIError {
                Text(apiError.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Button(action: {
                Task {
                    await loadDashboardData()
                }
            }) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                    Text("Retry")
                }
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
        .padding()
    }
    
    // MARK: - Dashboard Content
    private func dashboardContent(data: DashboardData) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                overviewSection(data: data)
                topUsersSection(users: data.topUsers)
                barrelStatsSection(stats: data.barrelStats)
            }
            .padding(.vertical)
            .frame(maxWidth: UIDevice.current.userInterfaceIdiom == .pad ? 800 : nil)
            .padding(.horizontal, UIDevice.current.userInterfaceIdiom == .pad ? 20 : 0)
        }
    }
    
    // MARK: - Overview Section
    private func overviewSection(data: DashboardData) -> some View {
        VStack(spacing: 16) {
            sectionHeader(title: "Overview", icon: "chart.bar.fill")
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                UIDevice.current.userInterfaceIdiom == .pad ? GridItem(.flexible()) : nil
            ].compactMap { $0 }, spacing: 16) {
                StatCard(title: "Total Users", value: "\(data.totalUsers)", icon: "person.2.fill")
                StatCard(title: "Total Beers", value: "\(data.totalBeers)", icon: "mug.fill")
                StatCard(title: "Total Barrels", value: "\(data.totalBarrels)", icon: "cylinder.fill")
                StatCard(title: "Avg. Beers/User", 
                        value: String(format: "%.1f", data.averageBeersPerUser),
                        icon: "chart.bar.fill")
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Top Users Section
    private func topUsersSection(users: [UserStats]) -> some View {
        VStack(spacing: 12) {
            sectionHeader(title: "Top Users", icon: "trophy.fill")
            
            ForEach(users, id: \.id) { user in
                HStack {
                    Image(systemName: "person.fill")
                        .foregroundColor(.blue)
                    Text(user.username)
                    Spacer()
                    Text("\(user.beerCount)")
                        .fontWeight(.semibold)
                    Text("beers")
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(10)
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Barrel Stats Section
    private func barrelStatsSection(stats: [BarrelStats]) -> some View {
        VStack(spacing: 12) {
            sectionHeader(title: "Barrel Statistics", icon: "cylinder.split.1x2.fill")
            
            ForEach(stats, id: \.size) { stat in
                HStack {
                    Image(systemName: "cylinder.fill")
                        .foregroundColor(.blue)
                    Text("\(stat.size)L")
                        .fontWeight(.medium)
                    Spacer()
                    Text("\(stat.count)")
                        .fontWeight(.semibold)
                    Text("active")
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(10)
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Helper Views
    private func sectionHeader(title: String, icon: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .imageScale(UIDevice.current.userInterfaceIdiom == .pad ? .large : .medium)
            Text(title)
                .font(UIDevice.current.userInterfaceIdiom == .pad ? .title : .title2)
                .fontWeight(.bold)
            Spacer()
        }
        .padding(.horizontal)
    }
    
    // MARK: - Data Loading
    private func loadDashboardData() async {
        isLoading = true
        error = nil
        
        do {
            print("🔄 Loading dashboard data...")
            dashboardData = try await DashboardService.shared.fetchDashboardData()
            print("✅ Dashboard data loaded successfully")
        } catch {
            print("❌ Error loading dashboard data: \(error)")
            self.error = error
        }
        
        isLoading = false
    }
}

// MARK: - Supporting Views
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                    .imageScale(UIDevice.current.userInterfaceIdiom == .pad ? .large : .medium)
                Text(title)
                    .font(UIDevice.current.userInterfaceIdiom == .pad ? .title3 : .subheadline)
                    .foregroundColor(.secondary)
            }
            Text(value)
                .font(UIDevice.current.userInterfaceIdiom == .pad ? .title : .title2)
                .fontWeight(.bold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(UIDevice.current.userInterfaceIdiom == .pad ? 20 : 16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }
}

// MARK: - Preview
struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
} 