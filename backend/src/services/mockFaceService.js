/**
 * Mock Face Recognition Service
 * Replaces Luxand API for demo purposes
 */

class MockFaceService {
  constructor() {
    this.enrolledFaces = new Map(); // Store enrolled face data
    this.recognitionThreshold = 0.85; // Mock confidence threshold
  }

  /**
   * Mock face enrollment - simulates enrolling a face
   */
  async enrollFace(faceData, userInfo) {
    console.log('🎭 Mock Face Service: Enrolling face...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock face ID
    const faceId = `mock_face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store mock face data
    this.enrolledFaces.set(faceId, {
      id: faceId,
      userInfo: userInfo,
      enrolledAt: new Date().toISOString(),
      confidence: 0.95, // Mock high confidence
      faceData: faceData.substring(0, 100) + '...' // Truncate for storage
    });
    
    console.log(`✅ Mock Face Service: Face enrolled successfully with ID: ${faceId}`);
    
    return {
      success: true,
      faceId: faceId,
      confidence: 0.95,
      message: 'Face enrolled successfully (Mock)'
    };
  }

  /**
   * Mock face recognition - simulates recognizing a face
   */
  async recognizeFace(faceData, userInfo) {
    console.log('🎭 Mock Face Service: Recognizing face...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if we have any enrolled faces
    if (this.enrolledFaces.size === 0) {
      console.log('❌ Mock Face Service: No enrolled faces found');
      return {
        success: false,
        confidence: 0,
        message: 'No enrolled faces found'
      };
    }
    
    // Mock recognition logic - randomly match with enrolled faces
    const enrolledFaces = Array.from(this.enrolledFaces.values());
    const randomFace = enrolledFaces[Math.floor(Math.random() * enrolledFaces.length)];
    
    // Simulate confidence score
    const confidence = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
    
    if (confidence >= this.recognitionThreshold) {
      console.log(`✅ Mock Face Service: Face recognized with confidence: ${confidence.toFixed(2)}`);
      return {
        success: true,
        faceId: randomFace.id,
        confidence: confidence,
        userInfo: randomFace.userInfo,
        message: 'Face recognized successfully (Mock)'
      };
    } else {
      console.log(`❌ Mock Face Service: Face not recognized, confidence: ${confidence.toFixed(2)}`);
      return {
        success: false,
        confidence: confidence,
        message: 'Face not recognized (Mock)'
      };
    }
  }

  /**
   * Check if a user has enrolled faces
   */
  async checkEnrollment(userInfo) {
    console.log('🎭 Mock Face Service: Checking enrollment...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if user has any enrolled faces
    const hasEnrolledFaces = this.enrolledFaces.size > 0;
    
    if (hasEnrolledFaces) {
      const enrolledFaces = Array.from(this.enrolledFaces.values());
      const userFace = enrolledFaces.find(face => 
        face.userInfo.walletAddress === userInfo.walletAddress
      );
      
      if (userFace) {
        console.log(`✅ Mock Face Service: User has enrolled face: ${userFace.id}`);
        return {
          isEnrolled: true,
          faceId: userFace.id,
          enrolledAt: userFace.enrolledAt,
          confidence: userFace.confidence
        };
      }
    }
    
    console.log('❌ Mock Face Service: User not enrolled');
    return {
      isEnrolled: false,
      faceId: null,
      enrolledAt: null,
      confidence: 0
    };
  }

  /**
   * Get all enrolled faces (for debugging)
   */
  getAllEnrolledFaces() {
    return Array.from(this.enrolledFaces.values());
  }

  /**
   * Clear all enrolled faces (for testing)
   */
  clearAllFaces() {
    this.enrolledFaces.clear();
    console.log('🧹 Mock Face Service: All faces cleared');
  }
}

// Export singleton instance
module.exports = new MockFaceService();
