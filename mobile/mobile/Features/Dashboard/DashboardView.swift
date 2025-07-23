import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var authViewModel: LoginViewModel
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    private let columns: [GridItem] = [
        GridItem(.adaptive(minimum: 300, maximum: 400), spacing: 16)
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome to Dashboard")
                            .font(horizontalSizeClass == .regular ? .largeTitle : .title)
                            .fontWeight(.bold)
                        
                        if let user = authViewModel.currentUser {
                            Text("Logged in as \(user.username)")
                                .font(horizontalSizeClass == .regular ? .title3 : .subheadline)
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    
                    // Stats Overview
                    LazyVGrid(columns: columns, spacing: 16) {
                        StatCard(title: "Active Barrels", value: "5", icon: "cylinder.fill")
                        StatCard(title: "Total Users", value: "24", icon: "person.2.fill")
                        StatCard(title: "Active Events", value: "2", icon: "calendar")
                        StatCard(title: "Today's Beers", value: "42", icon: "mug.fill")
                    }
                    .padding(.horizontal)
                    
                    // Recent Activity
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Activity")
                            .font(horizontalSizeClass == .regular ? .title2 : .headline)
                            .padding(.horizontal)
                        
                        ForEach(1...5, id: \.self) { _ in
                            ActivityRow()
                        }
                    }
                    .frame(maxWidth: horizontalSizeClass == .regular ? 800 : nil)
                }
                .frame(maxWidth: .infinity)
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(horizontalSizeClass == .regular ? .system(size: 30) : .title2)
                    .foregroundColor(.blue)
                Spacer()
            }
            
            Text(value)
                .font(horizontalSizeClass == .regular ? .system(size: 40, weight: .bold) : .title)
                .fontWeight(.bold)
            
            Text(title)
                .font(horizontalSizeClass == .regular ? .title3 : .subheadline)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ActivityRow: View {
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    var body: some View {
        HStack {
            Circle()
                .fill(Color.blue)
                .frame(width: horizontalSizeClass == .regular ? 12 : 8, height: horizontalSizeClass == .regular ? 12 : 8)
            
            Text("New barrel added")
                .font(horizontalSizeClass == .regular ? .title3 : .subheadline)
            
            Spacer()
            
            Text("2m ago")
                .font(horizontalSizeClass == .regular ? .subheadline : .caption)
                .foregroundColor(.gray)
        }
        .padding(.horizontal)
        .padding(.vertical, horizontalSizeClass == .regular ? 12 : 8)
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // iPad Air 2 Landscape
            DashboardView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Landscape")
                .previewInterfaceOrientation(.landscapeRight)
                .environment(\.horizontalSizeClass, .regular)
            
            // iPad Air 2 Portrait
            DashboardView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Portrait")
                .previewInterfaceOrientation(.portrait)
                .environment(\.horizontalSizeClass, .regular)
        }
    }
} 