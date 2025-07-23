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
            if authViewModel.isAuthenticated {
                MainTabView()
                    .environmentObject(authViewModel)
                    .transition(.opacity)
                    .animation(.easeInOut, value: authViewModel.isAuthenticated)
            } else {
                LoginView()
                    .environmentObject(authViewModel)
                    .transition(.opacity)
                    .animation(.easeInOut, value: authViewModel.isAuthenticated)
            }
        }
    }
}

#if DEBUG
struct mobileApp_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Preview authenticated state
            MainTabView()
                .environmentObject({ () -> LoginViewModel in
                    let viewModel = LoginViewModel()
                    viewModel.isAuthenticated = true
                    return viewModel
                }())
                .previewDisplayName("Authenticated")
            
            // Preview login state
            LoginView()
                .environmentObject(LoginViewModel())
                .previewDisplayName("Login")
        }
    }
}
#endif
