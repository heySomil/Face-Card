/**
 * Google Vision API Service for Face Detection
 * Free tier: 1,000 requests/month
 */

const fetch = require('node-fetch');

class GoogleVisionService {
  constructor() {
    this.apiKey = process.env.GOOGLE_VISION_API_KEY;
    this.baseUrl = 'https://vision.googleapis.com/v1/images:annotate';
    
    if (!this.apiKey) {
      console.log('⚠️ Google Vision API key not configured. Set GOOGLE_VISION_API_KEY environment variable.');
    } else {
      console.log('👁️ Google Vision Service initialized');
    }
  }

  /**
   * Detect faces in an image using Google Vision API
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} mimeType - Image MIME type
   * @returns {Promise<Object>} - Face detection result
   */
  async detectFaces(imageBuffer, mimeType = 'image/jpeg') {
    if (!this.apiKey) {
      throw new Error('Google Vision API key not configured');
    }

    try {
      console.log('👁️ Detecting faces with Google Vision API...');
      
      const base64Image = imageBuffer.toString('base64');
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'FACE_DETECTION',
                maxResults: 10
              }
            ]
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Vision API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Google Vision face detection completed');
      
      // Process the results
      const faceAnnotations = result.responses?.[0]?.faceAnnotations || [];
      
      return {
        success: true,
        facesDetected: faceAnnotations.length,
        faces: faceAnnotations.map(face => ({
          confidence: face.detectionConfidence || 0,
          joy: face.joyLikelihood,
          sorrow: face.sorrowLikelihood,
          anger: face.angerLikelihood,
          surprise: face.surpriseLikelihood,
          boundingBox: face.boundingPoly
        })),
        rawResult: result
      };

    } catch (error) {
      console.error('❌ Google Vision face detection failed:', error);
      throw error;
    }
  }

  /**
   * Check if a face is present and has good quality
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} mimeType - Image MIME type
   * @returns {Promise<Object>} - Face quality assessment
   */
  async assessFaceQuality(imageBuffer, mimeType = 'image/jpeg') {
    try {
      const detectionResult = await this.detectFaces(imageBuffer, mimeType);
      
      if (detectionResult.facesDetected === 0) {
        return {
          success: false,
          hasFace: false,
          quality: 'no_face',
          message: 'No face detected in the image'
        };
      }

      if (detectionResult.facesDetected > 1) {
        return {
          success: false,
          hasFace: true,
          quality: 'multiple_faces',
          message: 'Multiple faces detected. Please use an image with only one face.'
        };
      }

      const face = detectionResult.faces[0];
      const confidence = face.confidence;

      // Assess quality based on confidence
      let quality = 'poor';
      if (confidence >= 0.8) quality = 'excellent';
      else if (confidence >= 0.6) quality = 'good';
      else if (confidence >= 0.4) quality = 'fair';

      return {
        success: true,
        hasFace: true,
        quality: quality,
        confidence: confidence,
        message: `Face detected with ${quality} quality (confidence: ${(confidence * 100).toFixed(1)}%)`
      };

    } catch (error) {
      console.error('❌ Face quality assessment failed:', error);
      return {
        success: false,
        hasFace: false,
        quality: 'error',
        message: error.message
      };
    }
  }

  /**
   * Generate a face hash for enrollment/recognition
   * This is a simplified approach - in production you'd use more sophisticated methods
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} mimeType - Image MIME type
   * @returns {Promise<Object>} - Face hash result
   */
  async generateFaceHash(imageBuffer, mimeType = 'image/jpeg') {
    try {
      const qualityResult = await this.assessFaceQuality(imageBuffer, mimeType);
      
      if (!qualityResult.success || !qualityResult.hasFace) {
        throw new Error(qualityResult.message);
      }

      // Generate a hash based on image content and face features
      // In a real implementation, you'd use more sophisticated face encoding
      const imageHash = require('crypto')
        .createHash('sha256')
        .update(imageBuffer)
        .digest('hex');

      const faceHash = imageHash.substring(0, 32); // Use first 32 characters

      return {
        success: true,
        faceHash: faceHash,
        quality: qualityResult.quality,
        confidence: qualityResult.confidence,
        message: 'Face hash generated successfully'
      };

    } catch (error) {
      console.error('❌ Face hash generation failed:', error);
      throw error;
    }
  }
}

module.exports = new GoogleVisionService();
