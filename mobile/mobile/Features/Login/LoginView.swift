import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var viewModel: LoginViewModel
    
    var body: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView("Logging in...")
                    .progressViewStyle(CircularProgressViewStyle())
            } else if let error = viewModel.errorMessage {
                VStack {
                    Image(systemName: "exclamationmark.triangle")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 60, height: 60)
                        .foregroundColor(.red)
                    
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // iPad Air 2 Landscape
            LoginView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Landscape")
                .previewInterfaceOrientation(.landscapeRight)
                .environment(\.horizontalSizeClass, .regular)
            
            // iPad Air 2 Portrait
            LoginView()
                .environmentObject(LoginViewModel())
                .previewDevice(PreviewDevice(rawValue: "iPad Air 2"))
                .previewDisplayName("iPad Air 2 Portrait")
                .previewInterfaceOrientation(.portrait)
                .environment(\.horizontalSizeClass, .regular)
        }
    }
} 