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

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // iPad Air 2 Landscape
            MainTabView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Landscape")
                .previewInterfaceOrientation(.landscapeRight)
                .environment(\.horizontalSizeClass, .regular)
            
            // iPad Air 2 Portrait
            MainTabView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Portrait")
                .previewInterfaceOrientation(.portrait)
                .environment(\.horizontalSizeClass, .regular)
        }
    }
} 