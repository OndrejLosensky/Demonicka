import SwiftUI
import UIKit

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        // Use TabView for both iPhone and iPad, but with iPad-optimized styling
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
        .navigationViewStyle(StackNavigationViewStyle()) // Force stack navigation style
        .onAppear {
            // Set tab bar tint color to app primary
            UITabBar.appearance().tintColor = UIColor(AppColors.primary)
            
            // Force mobile layout on iPad - prevent sidebar behavior
            if UIDevice.current.userInterfaceIdiom == .pad {
                UITabBar.appearance().backgroundColor = .systemBackground
                UITabBar.appearance().barTintColor = .systemBackground
                
                // Force compact navigation style to prevent sidebars
                UINavigationBar.appearance().prefersLargeTitles = false
                UINavigationBar.appearance().compactAppearance = UINavigationBarAppearance()
                
                // Force compact navigation bar style
                UINavigationBar.appearance().barStyle = .default
                UINavigationBar.appearance().isTranslucent = false
            }
        }
        .onChange(of: selectedTab) { newValue in
            print("📱 Tab changed to \(newValue)")
        }
    }
}

#Preview {
    MainTabView()
} 
