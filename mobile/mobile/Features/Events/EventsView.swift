import SwiftUI

struct EventsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Events View")
                    .font(.title)
            }
            .navigationTitle("Events")
        }
    }
}

#Preview {
    EventsView()
} 