import SwiftUI
import UIKit

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Přehled", systemImage: "chart.bar")
                }
                .tag(0)
            
            ParticipantsView()
                .tabItem {
                    Label("Účastníci", systemImage: "person.2")
                }
                .tag(1)
            
            BarrelsView()
                .tabItem {
                    Label("Sudy", systemImage: "cylinder")
                }
                .tag(2)
            
            SystemView()
                .tabItem {
                    Label("Systém", systemImage: "gear")
                }
                .tag(3)
        }
        // Force iPhone-style tab bar appearance
        .onAppear {
            if UIDevice.current.userInterfaceIdiom == .pad {
                UITabBar.appearance().backgroundColor = .systemBackground
            }
            // Set tab bar tint color to app primary
            UITabBar.appearance().tintColor = UIColor(AppColors.primary)
        }
        .onChange(of: selectedTab) { newValue in
            print("📱 Tab changed to \(newValue)")
        }
    }
}

#Preview {
    MainTabView()
} 
