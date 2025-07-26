import SwiftUI
import UIKit

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationView {
                DashboardView()
                    .navigationBarTitleDisplayMode(.large)
            }
            .navigationViewStyle(.stack)
            .tabItem {
                Label("Dashboard", systemImage: "chart.bar")
            }
            .tag(0)
            
            NavigationView {
                ParticipantsView()
                    .navigationBarTitleDisplayMode(.large)
            }
            .navigationViewStyle(.stack)
            .tabItem {
                Label("Participants", systemImage: "person.2")
            }
            .tag(1)
            
            NavigationView {
                BarrelsView()
                    .navigationBarTitleDisplayMode(.large)
            }
            .navigationViewStyle(.stack)
            .tabItem {
                Label("Barrels", systemImage: "cylinder")
            }
            .tag(2)
            
            NavigationView {
                EventsView()
                    .navigationBarTitleDisplayMode(.large)
            }
            .navigationViewStyle(.stack)
            .tabItem {
                Label("Events", systemImage: "calendar")
            }
            .tag(3)
            
            NavigationView {
                SystemView()
                    .navigationBarTitleDisplayMode(.large)
            }
            .navigationViewStyle(.stack)
            .tabItem {
                Label("System", systemImage: "gear")
            }
            .tag(4)
        }
        // Force iPhone-style tab bar appearance
        .onAppear {
            if UIDevice.current.userInterfaceIdiom == .pad {
                UITabBar.appearance().backgroundColor = .systemBackground
            }
        }
        .onChange(of: selectedTab) { newValue in
            print("📱 Tab changed to \(newValue)")
            if newValue == 3 {
                print("🎯 Events tab selected")
            }
        }
    }
}

#Preview {
    MainTabView()
} 
