import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar")
                }
                .tag(0)
            
            ParticipantsView()
                .tabItem {
                    Label("Participants", systemImage: "person.2")
                }
                .tag(1)
            
            BarrelsView()
                .tabItem {
                    Label("Barrels", systemImage: "cylinder")
                }
                .tag(2)
            
            EventsView()
                .tabItem {
                    Label("Events", systemImage: "calendar")
                }
                .tag(3)
                .onChange(of: selectedTab) { oldValue, newValue in
                    print("📱 Tab changed from \(oldValue) to \(newValue)")
                    if newValue == 3 {
                        print("🎯 Events tab selected")
                    }
                }
            
            SystemView()
                .tabItem {
                    Label("System", systemImage: "gear")
                }
                .tag(4)
        }
    }
}

#Preview {
    MainTabView()
} 
