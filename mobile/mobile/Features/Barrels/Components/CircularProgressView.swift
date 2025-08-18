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
                .stroke(lineWidth: 16)
                .opacity(0.15)
                .foregroundColor(AppColors.success)
            
            // Progress circle
            Circle()
                .trim(from: 0.0, to: min(CGFloat(progress), 1.0))
                .stroke(style: StrokeStyle(
                    lineWidth: 16,
                    lineCap: .round
                ))
                .foregroundColor(AppColors.success)
                .rotationEffect(Angle(degrees: -90))
            
            // Central content
            VStack(spacing: UIDevice.current.userInterfaceIdiom == .pad ? 8 : 6) {
               
                // Current beer count (large and prominent)
                Text("\(current)")
                    .font(.system(size: UIDevice.current.userInterfaceIdiom == .pad ? 36 : 32, weight: .heavy, design: .rounded))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                
                // Progress text
                Text("z \(total) piv")
                    .font(.system(size: UIDevice.current.userInterfaceIdiom == .pad ? 15 : 13, weight: .medium))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.9)
                
               
            }
            .frame(maxWidth: UIDevice.current.userInterfaceIdiom == .pad ? 130 : 120)
        }
        .frame(width: UIDevice.current.userInterfaceIdiom == .pad ? 160 : 140, height: UIDevice.current.userInterfaceIdiom == .pad ? 160 : 140)
        .padding(UIDevice.current.userInterfaceIdiom == .pad ? 16 : 12)
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
