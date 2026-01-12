import SwiftUI

class SplashCoordinator: ObservableObject {
    @Published var isShowingSplash = true
    @Published var isLoadingComplete = false
    
    func startSplash() {
        isShowingSplash = true
        isLoadingComplete = false
        
        // Simulate app initialization
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            withAnimation(.easeInOut(duration: 0.5)) {
                self.isLoadingComplete = true
            }
            
            // Hide splash after a short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                withAnimation(.easeInOut(duration: 0.3)) {
                    self.isShowingSplash = false
                }
            }
        }
    }
    
    func resetSplash() {
        isShowingSplash = true
        isLoadingComplete = false
    }
}
