import SwiftUI

struct UserView: View {
    @EnvironmentObject private var authViewModel: LoginViewModel
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    if let user = authViewModel.currentUser {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(user.username)
                                    .font(.headline)
                                Text(user.role)
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            Spacer()
                            Image(systemName: "person.circle.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.blue)
                        }
                        .padding(.vertical, 8)
                    }
                }
                
                Section(header: Text("Settings")) {
                    NavigationLink {
                        Text("Account Settings")
                    } label: {
                        Label("Account Settings", systemImage: "gear")
                    }
                    
                    NavigationLink {
                        Text("Notifications")
                    } label: {
                        Label("Notifications", systemImage: "bell")
                    }
                }
                
                Section {
                    Button(role: .destructive) {
                        authViewModel.logout()
                    } label: {
                        Label("Logout", systemImage: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

struct UserView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // iPad Air 2 Landscape
            UserView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Landscape")
                .previewInterfaceOrientation(.landscapeRight)
                .environment(\.horizontalSizeClass, .regular)
            
            // iPad Air 2 Portrait
            UserView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Portrait")
                .previewInterfaceOrientation(.portrait)
                .environment(\.horizontalSizeClass, .regular)
        }
    }
} 