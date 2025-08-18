import SwiftUI

struct SplashView: View {
    let onComplete: () -> Void
    
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0.0
    @State private var textOpacity: Double = 0.0
    @State private var loadingOpacity: Double = 0.0
    @State private var isLoading = true
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(.systemBackground),
                    AppColors.primary.opacity(0.1)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            // Background bubbles
            ForEach(0..<8, id: \.self) { index in
                Circle()
                    .fill(AppColors.primary.opacity(0.05))
                    .frame(width: CGFloat.random(in: 20...60))
                    .offset(
                        x: CGFloat.random(in: -200...200),
                        y: CGFloat.random(in: -400...400)
                    )
                    .animation(
                        .easeInOut(duration: Double.random(in: 3...6))
                        .repeatForever(autoreverses: true),
                        value: logoScale
                    )
            }
            
            VStack(spacing: 50) {
                Spacer()
                
                // App Logo
                VStack(spacing: 30) {
                    // App logo
                    Image("logo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: UIDevice.current.userInterfaceIdiom == .pad ? 400 : 280, 
                               maxHeight: UIDevice.current.userInterfaceIdiom == .pad ? 180 : 120)
                        .scaleEffect(logoScale)
                        .opacity(logoOpacity)
                        .offset(y: logoScale == 1.0 ? 0 : -20)
                        .shadow(color: AppColors.primary.opacity(0.3), radius: 10, x: 0, y: 5)
                    
                    // App subtitle
                    Text("Pivní aplikace nyní dostupná na IOS")
                        .font(UIDevice.current.userInterfaceIdiom == .pad ? .title2 : .title3)
                        .foregroundColor(.secondary)
                        .opacity(textOpacity)
                        .offset(y: textOpacity == 1.0 ? 0 : 20)
                }
                
                Spacer()
                
                // Loading indicator
                VStack(spacing: 16) {
                    if isLoading {
                        ProgressView()
                            .scaleEffect(1.2)
                            .progressViewStyle(CircularProgressViewStyle(tint: AppColors.primary))
                            .opacity(loadingOpacity)
                            .scaleEffect(loadingOpacity == 1.0 ? 1.0 : 0.8)
                            .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: loadingOpacity)
                        
                        Text("Načítání...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .opacity(loadingOpacity)
                    }
                }
                
                Spacer()
            }
            .padding()
        }
        .onAppear {
            startAnimation()
        }
    }
    
    private func startAnimation() {
        // Logo animation
        withAnimation(.easeOut(duration: 0.8)) {
            logoScale = 1.0
            logoOpacity = 1.0
        }
        
        // Text animation
        withAnimation(.easeOut(duration: 0.6).delay(0.3)) {
            textOpacity = 1.0
        }
        
        // Loading animation
        withAnimation(.easeOut(duration: 0.6).delay(0.6)) {
            loadingOpacity = 1.0
        }
        
        // Simulate loading time
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation(.easeInOut(duration: 0.5)) {
                isLoading = false
            }
            
            // Notify completion
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                onComplete()
            }
        }
    }
}

struct SplashView_Previews: PreviewProvider {
    static var previews: some View {
        SplashView {
            print("Splash completed")
        }
    }
}
