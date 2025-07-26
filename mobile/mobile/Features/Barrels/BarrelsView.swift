import SwiftUI

struct BarrelsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Barrels View")
                    .font(.title)
            }
            .navigationTitle("Barrels")
        }
    }
}

#Preview {
    BarrelsView()
} 