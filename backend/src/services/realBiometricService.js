/**
 * Real Biometric Payment Service
 * Integrates real facial recognition with real Yellow Network transactions
 */

const googleVisionService = require('./googleVisionService');
const yellowNetworkService = require('./yellowNetworkService');
const crypto = require('crypto');

class RealBiometricService {
  constructor() {
    this.enrolledFaces = new Map(); // Store enrolled face hashes
    this.faceThreshold = 0.7; // Minimum confidence threshold for face recognition
    
    console.log('🔐 Real Biometric Service initialized');
  }

  /**
   * Enroll a user's face for biometric payments
   * @param {Buffer} faceImage - Face image buffer
   * @param {Object} userInfo - User information
   * @returns {Promise<Object>} - Enrollment result
   */
  async enrollFace(faceImage, userInfo) {
    try {
      console.log('🔐 Enrolling face for real biometric payments...');
      
      // Use Google Vision API to assess face quality
      const qualityResult = await googleVisionService.assessFaceQuality(faceImage);
      
      if (!qualityResult.success || !qualityResult.hasFace) {
        throw new Error(`Face enrollment failed: ${qualityResult.message}`);
      }

      if (qualityResult.quality === 'poor') {
        throw new Error('Face quality is too poor for enrollment. Please use a clearer image.');
      }

      // Generate face hash
      const hashResult = await googleVisionService.generateFaceHash(faceImage);
      
      // Store enrollment data
      const enrollmentId = crypto.randomUUID();
      const enrollmentData = {
        id: enrollmentId,
        userInfo: userInfo,
        faceHash: hashResult.faceHash,
        quality: qualityResult.quality,
        confidence: qualityResult.confidence,
        enrolledAt: new Date().toISOString(),
        isActive: true
      };

      this.enrolledFaces.set(userInfo.walletAddress, enrollmentData);
      
      console.log(`✅ Face enrolled successfully for ${userInfo.walletAddress}`);
      
      return {
        success: true,
        enrollmentId: enrollmentId,
        faceHash: hashResult.faceHash,
        quality: qualityResult.quality,
        confidence: qualityResult.confidence,
        message: 'Face enrolled successfully for real biometric payments'
      };

    } catch (error) {
      console.error('❌ Real face enrollment failed:', error);
      throw error;
    }
  }

  /**
   * Recognize a face and verify for payment
   * @param {Buffer} faceImage - Face image buffer
   * @param {string} expectedWalletAddress - Expected wallet address
   * @returns {Promise<Object>} - Recognition result
   */
  async recognizeFace(faceImage, expectedWalletAddress) {
    try {
      console.log('🔐 Recognizing face for real biometric payment...');
      
      // Use Google Vision API to assess face quality
      const qualityResult = await googleVisionService.assessFaceQuality(faceImage);
      
      if (!qualityResult.success || !qualityResult.hasFace) {
        throw new Error(`Face recognition failed: ${qualityResult.message}`);
      }

      // Generate face hash for comparison
      const hashResult = await googleVisionService.generateFaceHash(faceImage);
      
      // Check if user is enrolled
      const enrollmentData = this.enrolledFaces.get(expectedWalletAddress);
      
      if (!enrollmentData) {
        throw new Error('User not enrolled for biometric payments');
      }

      if (!enrollmentData.isActive) {
        throw new Error('User enrollment is inactive');
      }

      // Compare face hashes (simplified - in production use more sophisticated matching)
      const hashSimilarity = this.calculateHashSimilarity(hashResult.faceHash, enrollmentData.faceHash);
      
      if (hashSimilarity < this.faceThreshold) {
        throw new Error('Face does not match enrolled user');
      }

      console.log(`✅ Face recognized successfully for ${expectedWalletAddress}`);
      
      return {
        success: true,
        recognized: true,
        confidence: qualityResult.confidence,
        hashSimilarity: hashSimilarity,
        userInfo: enrollmentData.userInfo,
        message: 'Face recognized successfully'
      };

    } catch (error) {
      console.error('❌ Real face recognition failed:', error);
      throw error;
    }
  }

  /**
   * Process a real biometric payment
   * @param {Object} paymentData - Payment data
   * @param {Buffer} faceImage - Face image for verification
   * @returns {Promise<Object>} - Payment result
   */
  async processRealBiometricPayment(paymentData, faceImage) {
    try {
      console.log('🔐 Processing real biometric payment...');
      
      // Step 1: Verify face
      const recognitionResult = await this.recognizeFace(faceImage, paymentData.customerAddress);
      
      if (!recognitionResult.success) {
        throw new Error(`Biometric verification failed: ${recognitionResult.message}`);
      }

      // Step 2: Process real Yellow Network transaction
      console.log('🟡 Processing real Yellow Network transaction...');
      
      const realPaymentResult = await yellowNetworkService.processRealPayment({
        customerAddress: paymentData.customerAddress,
        merchantAddress: paymentData.merchantAddress,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USDC',
        biometricVerified: true,
        faceConfidence: recognitionResult.confidence,
        faceHash: recognitionResult.faceHash
      });

      console.log('✅ Real biometric payment processed successfully');
      
      return {
        success: true,
        payment: {
          transactionId: realPaymentResult.transactionId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'USDC',
          from: paymentData.customerAddress,
          to: paymentData.merchantAddress,
          status: 'completed',
          network: 'Yellow Network',
          biometricVerified: true,
          faceConfidence: recognitionResult.confidence,
          processingTime: realPaymentResult.processingTime,
          blockExplorerUrl: realPaymentResult.blockExplorerUrl,
          gasUsed: realPaymentResult.gasUsed,
          timestamp: new Date().toISOString()
        },
        biometric: {
          verified: true,
          confidence: recognitionResult.confidence,
          method: 'real_facial_recognition',
          userInfo: recognitionResult.userInfo
        }
      };

    } catch (error) {
      console.error('❌ Real biometric payment failed:', error);
      throw error;
    }
  }

  /**
   * Check if a user is enrolled for real biometric payments
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object>} - Enrollment status
   */
  async checkEnrollmentStatus(walletAddress) {
    try {
      const enrollmentData = this.enrolledFaces.get(walletAddress);
      
      if (!enrollmentData) {
        return {
          isEnrolled: false,
          walletAddress: walletAddress,
          message: 'Not enrolled for real biometric payments'
        };
      }

      return {
        isEnrolled: enrollmentData.isActive,
        walletAddress: walletAddress,
        enrollmentId: enrollmentData.id,
        enrolledAt: enrollmentData.enrolledAt,
        quality: enrollmentData.quality,
        confidence: enrollmentData.confidence,
        userInfo: enrollmentData.userInfo,
        message: enrollmentData.isActive ? 'Enrolled for real biometric payments' : 'Enrollment inactive'
      };

    } catch (error) {
      console.error('❌ Failed to check enrollment status:', error);
      throw error;
    }
  }

  /**
   * Calculate similarity between two face hashes
   * @param {string} hash1 - First hash
   * @param {string} hash2 - Second hash
   * @returns {number} - Similarity score (0-1)
   */
  calculateHashSimilarity(hash1, hash2) {
    // Simple similarity calculation - in production use more sophisticated methods
    let matches = 0;
    const minLength = Math.min(hash1.length, hash2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (hash1[i] === hash2[i]) {
        matches++;
      }
    }
    
    return matches / minLength;
  }

  /**
   * Get all enrolled users (for debugging)
   * @returns {Array} - List of enrolled users
   */
  getAllEnrolledUsers() {
    return Array.from(this.enrolledFaces.values());
  }

  /**
   * Clear all enrollments (for testing)
   */
  clearAllEnrollments() {
    this.enrolledFaces.clear();
    console.log('🧹 All real biometric enrollments cleared');
  }
}

module.exports = new RealBiometricService();
