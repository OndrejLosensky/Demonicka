import SwiftUI

struct CircularProgressView: View {
    let progress: Double
    let total: Int
    let current: Int
    let size: Int
    
    var body: some View {
        ZStack {
            // Background circle
            Circle()
                .stroke(lineWidth: 20)
                .opacity(0.1)
                .foregroundColor(.green)
            
            // Progress circle
            Circle()
                .trim(from: 0.0, to: min(CGFloat(progress), 1.0))
                .stroke(style: StrokeStyle(
                    lineWidth: 20,
                    lineCap: .round
                ))
                .foregroundColor(.green)
                .rotationEffect(Angle(degrees: -90))
            
            // Central text
            VStack(spacing: 4) {
                Image(systemName: "mug.fill")
                    .font(.title)
                Text("\(current)")
                    .font(.title)
                    .bold()
                Text("z celkových \(total) piv")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("\(size)L")
                    .font(.subheadline)
                    .bold()
            }
        }
        .padding(20)
    }
}

#Preview {
    CircularProgressView(
        progress: 0.72,
        total: 100,
        current: 72,
        size: 50
    )
    .frame(width: 200, height: 200)
} 