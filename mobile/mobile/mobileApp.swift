//
//  mobileApp.swift
//  mobile
//
//  Created by Ondřej Losenský on 26.07.2025.
//

import SwiftUI

@main
struct mobileApp: App {
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .accentColor(AppColors.primary)
        }
    }
}
