import SwiftUI

struct ParticipantsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Participants View")
                    .font(.title)
            }
            .navigationTitle("Participants")
        }
    }
}

#Preview {
    ParticipantsView()
} 