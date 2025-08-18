import SwiftUI

extension Color {
    // Primary colors - Red theme
    static let appPrimary = Color(red: 1.0, green: 0.23, blue: 0.19) // #ff3b30
    static let appPrimaryLight = Color(red: 1.0, green: 0.42, blue: 0.39) // #ff6a64
    static let appPrimaryDark = Color(red: 0.76, green: 0.0, blue: 0.0) // #c30000
    
    // Secondary colors
    static let appSecondary = Color(red: 0.6, green: 0.6, blue: 0.6) // #999999
    
    // Status colors
    static let appSuccess = Color(red: 0.18, green: 0.49, blue: 0.20) // #2e7d32
    static let appWarning = Color(red: 0.93, green: 0.42, blue: 0.01) // #ed6c02
    static let appError = Color(red: 0.90, green: 0.22, blue: 0.21) // #e53935
    
    // Background colors
    static let appBackground = Color(UIColor.systemBackground)
    static let appSecondaryBackground = Color(UIColor.secondarySystemBackground)
    
    // Text colors
    static let appTextPrimary = Color(UIColor.label)
    static let appTextSecondary = Color(UIColor.secondaryLabel)
}
