//
//  mobileApp.swift
//  mobile
//
//  Created by Ondřej Losenský on 26.07.2025.
//

import SwiftUI

@main
struct mobileApp: App {
    @StateObject private var splashCoordinator = SplashCoordinator()
    @StateObject private var webSocketService = WebSocketService.shared
    
    var body: some Scene {
        WindowGroup {
            ZStack {
                if splashCoordinator.isShowingSplash {
                    SplashView {
                        splashCoordinator.isShowingSplash = false
                    }
                    .transition(.opacity)
                    .zIndex(1)
                } else {
                    MainTabView()
                        .accentColor(AppColors.primary)
                        .transition(.opacity)
                        .zIndex(0)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: splashCoordinator.isShowingSplash)
            .onAppear {
                splashCoordinator.startSplash()
            }
            .onReceive(NotificationCenter.default.publisher(for: .leaderboardUpdated)) { _ in
                // Handle leaderboard updates
                print("📊 Leaderboard updated via WebSocket")
            }
            .onReceive(NotificationCenter.default.publisher(for: .dashboardUpdated)) { _ in
                // Handle dashboard updates
                print("📈 Dashboard updated via WebSocket")
            }
        }
    }
}
