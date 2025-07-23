import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar.fill")
                }
                .tag(0)
            
            ParticipantsView()
                .tabItem {
                    Label("Participants", systemImage: "person.2.fill")
                }
                .tag(1)
            
            BarrelsView()
                .tabItem {
                    Label("Barrels", systemImage: "cylinder.fill")
                }
                .tag(2)
            
            EventsView()
                .tabItem {
                    Label("Events", systemImage: "calendar")
                }
                .tag(3)
            
            UserView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle.fill")
                }
                .tag(4)
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(LoginViewModel())
} 