//
//  mobileApp.swift
//  mobile
//
//  Created by Ondřej Losenský on 23.07.2025.
//

import SwiftUI

@main
struct mobileApp: App {
    @StateObject private var authViewModel = LoginViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authViewModel: LoginViewModel
    
    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .onChange(of: authViewModel.isAuthenticated) { newValue in
            print("Root view detected auth change: \(newValue)")
        }
    }
}
