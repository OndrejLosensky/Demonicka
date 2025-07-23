import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var viewModel: LoginViewModel
    @Environment(\.horizontalSizeClass) var horizontalSizeClass
    
    var body: some View {
        NavigationView {
            GeometryReader { geometry in
                ScrollView {
                    VStack(spacing: 25) {
                        // Logo and Title
                        VStack(spacing: 15) {
                            Image(systemName: "lock.shield")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 60, height: 60)
                                .foregroundColor(.blue)
                            
                            Text("Admin Login")
                                .font(.title)
                                .fontWeight(.bold)
                        }
                        .padding(.top, 50)
                        
                        // Login Form
                        VStack(spacing: 15) {
                            CustomTextField("Username", text: $viewModel.username, icon: "person")
                                .textContentType(.username)
                                .autocapitalization(.none)
                            
                            CustomTextField("Password", text: $viewModel.password, isSecure: true, icon: "lock")
                                .textContentType(.password)
                            
                            if let errorMessage = viewModel.errorMessage {
                                Text(errorMessage)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                    .multilineTextAlignment(.center)
                            }
                            
                            PrimaryButton(
                                title: "Login",
                                isLoading: viewModel.isLoading
                            ) {
                                Task {
                                    await viewModel.login()
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .frame(minHeight: geometry.size.height)
                    .frame(maxWidth: horizontalSizeClass == .regular ? 400 : nil)
                }
                .frame(maxWidth: .infinity)
            }
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
}

#Preview {
    LoginView()
        .environmentObject(LoginViewModel())
} 