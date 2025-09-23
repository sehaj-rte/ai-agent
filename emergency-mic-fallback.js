// EMERGENCY FALLBACK - USE ONLY TEMPORARILY
// This uses deprecated getUserMedia API - not recommended for production

const requestMicrophonePermissionFallback = async () => {
  try {
    // Modern API (preferred)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    }
    
    // Fallback to deprecated API (works on HTTP)
    const getUserMedia = navigator.getUserMedia || 
                        navigator.webkitGetUserMedia || 
                        navigator.mozGetUserMedia || 
                        navigator.msGetUserMedia;
    
    if (getUserMedia) {
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, { audio: true }, 
          () => resolve(true), 
          (error) => reject(error)
        );
      });
    }
    
    throw new Error("No microphone API available");
  } catch (error) {
    console.error("Microphone access failed:", error);
    return false;
  }
};
