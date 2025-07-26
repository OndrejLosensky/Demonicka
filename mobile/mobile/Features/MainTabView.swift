import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar")
                }
            
            ParticipantsView()
                .tabItem {
                    Label("Participants", systemImage: "person.2")
                }
            
            BarrelsView()
                .tabItem {
                    Label("Barrels", systemImage: "cylinder")
                }
            
            EventsView()
                .tabItem {
                    Label("Events", systemImage: "calendar")
                }
            
            SystemView()
                .tabItem {
                    Label("System", systemImage: "gear")
                }
        }
    }
}

#Preview {
    MainTabView()
} 