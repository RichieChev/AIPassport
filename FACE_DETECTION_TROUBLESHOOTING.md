# Face Detection Troubleshooting Guide

## Issue: "Face Not Detected" Message

If you're seeing "Face not detected" in the AI Passport Photo Assistant, follow these steps:

## Quick Fixes

### 1. **Test Face Detection Independently**
Open the test page to verify face detection works:
```bash
open face-detection-test.html
```
This will help determine if the issue is with:
- The camera
- The TensorFlow.js model
- The face detection algorithm
- Your lighting/positioning

### 2. **Check Browser Console**
Open Developer Tools (F12 or Cmd+Option+I) and look for:
- ✓ "Face detection model loaded successfully"
- ✓ "Video dimensions: 1280x720" (or similar)
- ✓ "Face detected: {boundingBox: ...}"

If you see errors, they will help diagnose the issue.

### 3. **Verify Video is Playing**
In the main app, check the debug info at the bottom:
- Stream: ✓ Active
- Model: ✓ Ready
- Face: ✗ Not detected ← This is your issue
- Video: 1280x720 ← Should show actual dimensions
- Ready State: 4 ← Should be 4 (HAVE_ENOUGH_DATA)

## Common Causes & Solutions

### Cause 1: Poor Lighting
**Symptoms:** Camera works but no face detected
**Solution:**
- Move to a well-lit area
- Face a window or bright light source
- Avoid backlighting (light behind you)
- Turn on room lights

### Cause 2: Face Too Far/Close
**Symptoms:** Face detection intermittent
**Solution:**
- Position your face within the guide box
- Sit 2-3 feet from the camera
- Make sure your whole face is visible
- Center your face in the frame

### Cause 3: Video Not Ready
**Symptoms:** Model loads but detection never starts
**Solution:**
- Wait 2-3 seconds after camera starts
- Refresh the page and try again
- Check that video dimensions show actual numbers (not 0x0)

### Cause 4: Model Loading Issues
**Symptoms:** "Loading AI model..." never completes
**Solution:**
- Check internet connection (model downloads ~10MB)
- Clear browser cache
- Try a different browser (Chrome/Edge recommended)
- Check browser console for errors

### Cause 5: Browser Compatibility
**Symptoms:** Various errors or no detection
**Solution:**
- Use latest Chrome, Edge, or Safari
- Enable hardware acceleration in browser settings
- Update your browser to the latest version

### Cause 6: Glasses/Accessories
**Symptoms:** Detection works sometimes but not always
**Solution:**
- Remove sunglasses or tinted glasses
- Remove hats or head coverings
- Ensure face is fully visible
- Try without face masks

## Technical Details

### What Changed
I've improved the face detection system with:

1. **Video Readiness Check** - Detection only runs when video has actual frames
2. **Better Logging** - Console shows exactly what's happening
3. **Dimension Validation** - Ensures video has proper dimensions before detection
4. **Error Handling** - More informative error messages

### Files Modified
- `src/hooks/useFaceDetection.ts` - Added video readiness checks
- `src/utils/faceDetection.ts` - Enhanced logging and validation
- `face-detection-test.html` - New standalone test page

### Detection Requirements
For face detection to work:
1. ✓ Camera must be active and streaming
2. ✓ Video element must have dimensions (width/height > 0)
3. ✓ Video readyState must be ≥ 2 (HAVE_CURRENT_DATA)
4. ✓ TensorFlow.js model must be loaded
5. ✓ Face must be visible and well-lit
6. ✓ Face must be within reasonable distance

## Testing Steps

### Step 1: Test Basic Camera
```bash
open camera-test.html
```
- Click "Start Camera"
- Verify you see yourself
- Check that camera count shows ≥ 1

### Step 2: Test Face Detection
```bash
open face-detection-test.html
```
- Click "Start Camera & Detection"
- Watch the console log
- You should see green box around your face
- Red dots on facial landmarks

### Step 3: Test Full App
```bash
npm run dev
```
- Open http://localhost:3000
- Wait for "Model: ✓ Ready"
- Position face in guide box
- Watch for "Face: ✓ Detected"

## Still Not Working?

### Check Console Logs
Look for these specific messages:

**Good Signs:**
```
✓ Face detection model loaded successfully
✓ Video dimensions: 1280x720
✓ Face detected: {x: 320, y: 180, width: 400, height: 500}
```

**Bad Signs:**
```
✗ Failed to load face detection model
✗ Input has no dimensions: {width: 0, height: 0}
✗ Video not ready yet: {readyState: 0, width: 0, height: 0}
```

### Browser Console Commands
Open console (F12) and try:
```javascript
// Check if video is playing
document.querySelector('video').readyState
// Should return 4

// Check video dimensions
document.querySelector('video').videoWidth
// Should return > 0

// Check if stream is active
document.querySelector('video').srcObject?.active
// Should return true
```

## Advanced Debugging

### Enable Verbose Logging
The app now logs detailed information:
- Model initialization status
- Video readiness checks
- Detection attempts and results
- Frame dimensions

### Performance Tips
If detection is slow:
- Close other browser tabs
- Close other apps using GPU
- Reduce video quality in `useWebcam.ts`
- Increase `detectionInterval` in `WebcamCapture.tsx`

## Contact/Support

If none of these solutions work:
1. Take a screenshot of the browser console
2. Note your browser version and OS
3. Describe exactly what you see
4. Check if the test pages work

## Quick Reference

| Issue | Most Likely Cause | Quick Fix |
|-------|------------------|-----------|
| Camera not starting | Permissions | Check System Preferences → Camera |
| Model loading forever | Network | Check internet connection |
| Face not detected | Lighting | Move to brighter area |
| Intermittent detection | Distance | Move closer/further |
| No video dimensions | Timing | Wait 2-3 seconds |
| Console errors | Browser | Try Chrome/Edge latest |

---

**Remember:** The face detection test page (`face-detection-test.html`) is your best diagnostic tool!
