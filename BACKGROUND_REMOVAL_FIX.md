# Background Removal Fix

## ⚠️ Issue Found

The AI-powered background removal (BodyPix) was causing **severe color artifacts** in the exported photos:
- Black background instead of white
- Extreme yellow/green colors
- Distorted edges
- Unusable output

## ✅ Fix Applied

**Temporarily disabled AI background removal** and reverted to the simple geometric method.

### Files Modified:

1. **`src/utils/imageProcessing.ts`**
   - Commented out `removeBackground()` call
   - Using `replaceBackgroundSimple()` instead
   - Added TODO to debug AI method later

2. **`src/App.tsx`**
   - Commented out `initializeSegmentation()` call
   - No longer loads BodyPix model
   - Saves ~5MB download and startup time

### Current Behavior:

✅ **Simple background replacement:**
- Expands face bounding box to include shoulders
- Creates elliptical mask around person
- Replaces everything outside mask with white
- Works reliably, no artifacts

### Trade-offs:

**Pros:**
- ✅ Works correctly - no color artifacts
- ✅ Faster processing (no AI model)
- ✅ Smaller app size (no BodyPix download)
- ✅ Reliable results

**Cons:**
- ⚠️ Less accurate edge detection
- ⚠️ May include some background if close to wall
- ⚠️ Not as sophisticated as AI method

### Next Steps:

To re-enable AI background removal (when debugged):

1. Uncomment in `src/App.tsx`:
```typescript
useEffect(() => {
  const loadSegmentationModel = async () => {
    try {
      await initializeSegmentation();
    } catch (error) {
      console.warn('Failed to load background segmentation model:', error);
    }
  };
  loadSegmentationModel();
}, []);
```

2. Uncomment in `src/utils/imageProcessing.ts`:
```typescript
import { removeBackground } from './backgroundSegmentation';

// In processCapturedImage:
await removeBackground(canvas, '#FFFFFF');
```

### Debugging the AI Method:

The color artifacts suggest:
- BodyPix segmentation mask might be inverted
- Color space conversion issue
- Canvas pixel manipulation error
- Model configuration problem

**Potential fixes to try:**
1. Check if mask is inverted (person vs background)
2. Verify pixel manipulation logic
3. Try different BodyPix model settings
4. Test with simpler background first
5. Add visualization of segmentation mask

### Current Status:

✅ **App works correctly with simple background removal**
- Photos export properly
- White background applied
- No color artifacts
- All features functional

The AI background removal can be debugged and re-enabled later as an enhancement, but the app is fully functional now with the simple method.
