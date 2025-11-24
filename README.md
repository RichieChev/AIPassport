# AI Passport Photo Assistant

A browser-based AI-powered passport photo assistant that provides **live pose coaching** and **compliance checking** for passport/visa photos. Built with React, TypeScript, and TensorFlow.js for in-browser face detection and image processing.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-38bdf8)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.15.0-orange)

## ✨ Features

- **Live Webcam Capture** - Real-time video preview with face detection
- **AI Pose Coaching** - Get instant feedback on your positioning:
  - "Move closer" / "Step back"
  - "Center your face"
  - "Tilt your head slightly"
  - "Perfect! Hold still"
- **Face Detection** - Uses MediaPipe FaceMesh for accurate facial landmark detection
- **Background Replacement** - Automatically replaces background with compliant white
- **Lighting Adjustment** - Enhances brightness and contrast for optimal photo quality
- **Compliance Checking** - Validates photos against US passport requirements:
  - Head height (50-69% of image)
  - Eye position (56-69% from bottom)
  - Face centering
  - Eye level (no tilt)
  - Uniform background
- **Export Ready** - Download compliant 600×600px JPEG at 300 DPI

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd /Users/jwetman/Downloads/Finallesson
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   This will install:
   - React & React DOM
   - TypeScript
   - TensorFlow.js & Face Landmarks Detection
   - MediaPipe Face Mesh
   - Tailwind CSS
   - Lucide React (icons)
   - Vite (build tool)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   The application will automatically open at `http://localhost:3000`

5. **Allow camera access:**
   When prompted, allow the browser to access your webcam

## 📦 Build for Production

To create a production-ready build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, consistent icons

### AI/Computer Vision
- **TensorFlow.js** - In-browser machine learning
- **MediaPipe Face Mesh** - 468-point facial landmark detection
- **Face Landmarks Detection** - TensorFlow.js model wrapper

### Image Processing
- **Canvas API** - Native browser image manipulation
- **Background segmentation** - Custom algorithm for background replacement
- **Lighting adjustment** - Brightness and contrast enhancement

## 📱 How It Works

### 1. **Capture Phase**
- Webcam activates and displays live video feed
- AI model loads (MediaPipe Face Mesh)
- Face detection runs at 10 FPS
- Guide box overlay shows ideal positioning
- Real-time pose guidance appears:
  - Distance feedback (too close/far)
  - Horizontal positioning
  - Vertical positioning
  - Head tilt detection
- Capture button enables when face is detected
- Click to freeze frame and move to review

### 2. **Review Phase**
- Captured photo is analyzed against compliance rules
- Five key checks are performed:
  1. **Head Height** - Must be 50-69% of image height
  2. **Eye Position** - Must be 56-69% from bottom
  3. **Face Centered** - Horizontal centering within 15%
  4. **Eyes Level** - Tilt angle less than 10%
  5. **Uniform Background** - Low color variance
- Compliance score calculated (0-100%)
- Pass/fail result displayed with specific reasons
- Options to retake or accept photo

### 3. **Export Phase**
- Background replaced with solid white
- Lighting adjusted (brightness +15%, contrast +10%)
- Image cropped to center on face
- Resized to 600×600px (2×2 inches at 300 DPI)
- JPEG export at 95% quality
- One-click download

## 🎨 Design Philosophy

- **Real-time Feedback** - Instant pose coaching eliminates guesswork
- **AI-Powered** - Browser-based ML, no server required
- **Privacy First** - All processing happens locally, no data uploaded
- **User-Friendly** - Clear visual guidance and step-by-step flow
- **Professional Output** - Compliant photos ready for official use

## 🔧 Technical Architecture

### Component Structure
```
App.tsx                    # Main state management & workflow
├── WebcamCapture.tsx     # Video preview + capture
│   ├── useWebcam         # Webcam access hook
│   ├── useFaceDetection  # AI detection hook
│   └── usePoseGuidance   # Guidance logic hook
├── ComplianceResult.tsx  # Validation display
└── PhotoExport.tsx       # Final output & download
```

### Utility Modules
- **faceDetection.ts** - MediaPipe integration, landmark extraction
- **poseGuidance.ts** - Real-time coaching logic
- **complianceRules.ts** - Passport requirement validation
- **imageProcessing.ts** - Background removal, lighting, cropping

## 📂 Project Structure

```
Finallesson/
├── src/
│   ├── components/
│   │   ├── WebcamCapture.tsx        # Webcam preview + capture
│   │   ├── PoseGuidanceOverlay.tsx  # Real-time guidance display
│   │   ├── ComplianceResult.tsx     # Validation results
│   │   └── PhotoExport.tsx          # Final photo + download
│   ├── hooks/
│   │   ├── useWebcam.ts             # Webcam access management
│   │   ├── useFaceDetection.ts      # Face detection loop
│   │   └── usePoseGuidance.ts       # Pose guidance calculation
│   ├── utils/
│   │   ├── faceDetection.ts         # MediaPipe integration
│   │   ├── poseGuidance.ts          # Guidance logic
│   │   ├── complianceRules.ts       # Passport requirements
│   │   └── imageProcessing.ts       # Background/lighting/crop
│   ├── types/
│   │   └── index.ts                 # TypeScript definitions
│   ├── App.tsx                      # Main application
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎯 Usage Tips

1. **Good Lighting** - Use natural light or bright indoor lighting for best results
2. **Plain Background** - Start with a light-colored wall for easier background removal
3. **Follow Guidance** - Wait for the "Perfect!" message before capturing
4. **Multiple Attempts** - Don't hesitate to retake if compliance check fails
5. **Browser Compatibility** - Works best in Chrome, Edge, or Safari (latest versions)

## 🔧 Customization

### Changing Compliance Rules

Edit `src/utils/complianceRules.ts` to modify requirements:

```typescript
export const US_PASSPORT_CONFIG: PassportPhotoConfig = {
  country: 'United States',
  headHeightMinPercent: 50,  // Adjust these values
  headHeightMaxPercent: 69,
  // ... other settings
};
```

### Adjusting Output Dimensions

Modify the output size in the same config:

```typescript
outputWidth: 600,   // Change to desired width
outputHeight: 600,  // Change to desired height
outputDPI: 300,     // Adjust DPI
```

### Adding New Country Rules

Create a new config object and add corresponding compliance rules in the `complianceRules` array.

## 🐛 Troubleshooting

**Issue: Camera not working**
- Ensure browser has camera permissions
- Check if another app is using the camera
- Try refreshing the page
- Use HTTPS (required for camera access)

**Issue: Face not detected**
- Ensure adequate lighting
- Move closer to the camera
- Remove glasses or hats if possible
- Wait for the AI model to fully load

**Issue: Compliance check fails**
- Follow the specific reasons listed
- Common issues: head too small/large, not centered, background not uniform
- Retake with better positioning

**Issue: Model loading slowly**
- First load downloads ~10MB of AI models
- Subsequent loads use browser cache
- Check internet connection speed

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Built with ❤️ using modern web technologies and AI.

## 🚀 Future Enhancements

Potential features for future versions:
- Multiple country passport standards
- Batch processing for multiple photos
- Advanced background removal using ML segmentation
- Photo editing tools (crop, rotate, adjust)
- Print layout generator (4×6 sheet with multiple photos)
- Mobile app version (React Native)
- Cloud storage integration

## 📚 Key Code Snippets

### Face Detection Integration
```typescript
// src/utils/faceDetection.ts
const detector = await faceLandmarksDetection.createDetector(
  faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
  { runtime: 'mediapipe', refineLandmarks: true }
);
```

### Pose Guidance Logic
```typescript
// src/utils/poseGuidance.ts
if (faceBox.height < idealFaceHeightMin * 0.8) {
  return { message: '📏 Move closer to the camera', type: 'warning' };
}
```

### Compliance Checking
```typescript
// src/utils/complianceRules.ts
const headHeightPercent = (faceBox.height / height) * 100;
return headHeightPercent >= 50 && headHeightPercent <= 69;
```

## 🌐 Deployment to Netlify

### Quick Deploy Steps:

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy on Netlify:**
- Go to https://app.netlify.com
- Click "Add new site" → "Import an existing project"
- Connect your GitHub repository
- Netlify will auto-detect settings from `netlify.toml`
- Click "Deploy site"

### Configuration:
✅ Build command: `npm run build` (configured in netlify.toml)  
✅ Publish directory: `dist` (configured in netlify.toml)  
✅ Camera permissions enabled  
✅ TensorFlow.js CDN allowed  
✅ HTTPS enabled automatically  

### Important Notes:
- Camera access requires HTTPS (Netlify provides this)
- All processing happens client-side (no backend needed)
- First load downloads ~10MB of AI models (cached after)

---

**Create compliant passport photos in seconds!** 📸✨
