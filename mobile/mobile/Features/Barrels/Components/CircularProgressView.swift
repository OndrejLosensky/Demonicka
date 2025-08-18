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
            VStack(spacing: 6) {
                // Beer icon at the top
                Image(systemName: "mug.fill")
                    .font(.system(size: 20))
                    .foregroundColor(AppColors.success)
                    .padding(.bottom, 2)
                
                // Current beer count (large and prominent)
                Text("\(current)")
                    .font(.system(size: 32, weight: .heavy, design: .rounded))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                
                // Progress text
                Text("z \(total) piv")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.9)
                
                // Barrel size
                Text("\(size)L")
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundColor(AppColors.success)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(AppColors.success.opacity(0.15))
                    )
            }
            .frame(maxWidth: 120)
        }
        .frame(width: 140, height: 140)
        .padding(12)
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