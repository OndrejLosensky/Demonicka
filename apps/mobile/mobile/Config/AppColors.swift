import SwiftUI

struct AppColors {
    // Primary colors - Red theme
    static let primary = Color(red: 1.0, green: 0.23, blue: 0.19) // #ff3b30
    static let primaryLight = Color(red: 1.0, green: 0.42, blue: 0.39) // #ff6a64
    static let primaryDark = Color(red: 0.76, green: 0.0, blue: 0.0) // #c30000
    
    // Secondary colors
    static let secondary = Color(red: 0.6, green: 0.6, blue: 0.6) // #999999
    
    // Status colors
    static let success = Color(red: 0.18, green: 0.49, blue: 0.20) // #2e7d32
    static let warning = Color(red: 0.93, green: 0.42, blue: 0.01) // #ed6c02
    static let error = Color(red: 0.90, green: 0.22, blue: 0.21) // #e53935
    
    // Background colors
    static let background = Color(UIColor.systemBackground)
    static let secondaryBackground = Color(UIColor.secondarySystemBackground)
    
    // Text colors
    static let textPrimary = Color(UIColor.label)
    static let textSecondary = Color(UIColor.secondaryLabel)
}
