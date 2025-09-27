const fetch = require('node-fetch');
const FormData = require('form-data');
const walrusService = require('./walrusService');
const mockFaceService = require('./mockFaceService');

/**
 * Face Enrollment Service using Luxand Cloud API
 * Handles face enrollment, recognition, and enrollment status management
 */
class FaceEnrollmentService {
  constructor() {
    this.apiToken = process.env.LUXAND_API_TOKEN || "6ba425b03f5041798c807fc4d8bfd4ac";
    this.baseUrl = "https://api.luxand.cloud";
    this.useMockService = false; // Flag to switch to mock service
    
    console.log('🎭 Face Enrollment Service initialized');
  }

  /**
   * Enable mock service for demo purposes
   */
  enableMockService() {
    this.useMockService = true;
    console.log('🎭 Face Enrollment Service: Mock service enabled');
  }

  /**
   * Disable mock service (use real Luxand API)
   */
  disableMockService() {
    this.useMockService = false;
    console.log('🎭 Face Enrollment Service: Mock service disabled');
  }

  /**
   * Check if a wallet address is already enrolled for face recognition
   * @param {string} walletAddress - Sui wallet address
   * @param {string} userName - User's name from Google OAuth
   * @returns {Promise<Object>} - Enrollment status
   */
  async checkEnrollmentStatus(walletAddress, userName) {
    // Use mock service if enabled
    if (this.useMockService) {
      console.log('🎭 Using mock service for enrollment check');
      return await mockFaceService.checkEnrollment({ walletAddress, userName });
    }
    try {
      console.log(`🔍 Checking enrollment status for wallet: ${walletAddress} (REAL-TIME)`);
      
      // Always fetch fresh data from Luxand - no caching
      const personsResponse = await fetch(`${this.baseUrl}/v2/person`, {
        method: 'GET',
        headers: {
          'token': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!personsResponse.ok) {
        throw new Error(`Luxand API error: ${personsResponse.status} ${personsResponse.statusText}`);
      }

      const personsData = await personsResponse.json();
      console.log(`📋 Found ${personsData.length} persons in Luxand database`);

      // Look for person with name format: walletAddress|userName
      const expectedPersonName = `${walletAddress}|${userName}`;
      const enrolledPerson = personsData.find(person => person.name === expectedPersonName);

      const enrollmentStatus = {
        isEnrolled: !!enrolledPerson,
        walletAddress,
        userName,
        luxandUuid: enrolledPerson?.uuid || null,
        luxandPersonName: expectedPersonName,
        enrolledAt: enrolledPerson?.created || null,
        lastChecked: new Date().toISOString()
      };

      console.log('✅ Real-time enrollment status:', {
        walletAddress,
        isEnrolled: enrollmentStatus.isEnrolled,
        luxandUuid: enrollmentStatus.luxandUuid,
        expectedName: expectedPersonName
      });

      return {
        success: true,
        data: enrollmentStatus
      };

    } catch (error) {
      console.error('❌ Failed to check enrollment status:', error);
      
      // Fallback to mock service if Luxand fails
      if (error.message.includes('Trial is ended') || error.message.includes('401')) {
        console.log('🎭 Luxand trial expired, falling back to mock service');
        try {
          const mockResult = await mockFaceService.checkEnrollment({ walletAddress, userName });
          return {
            success: true,
            data: {
              isEnrolled: mockResult.isEnrolled,
              walletAddress,
              userName,
              luxandUuid: mockResult.faceId,
              enrolledAt: mockResult.enrolledAt,
              lastChecked: new Date().toISOString()
            }
          };
        } catch (mockError) {
          console.error('❌ Mock service also failed:', mockError);
        }
      }
      
      return {
        success: false,
        error: error.message,
        data: {
          isEnrolled: false,
          walletAddress,
          userName,
          lastChecked: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Enroll a person's face using Luxand Cloud API
   * @param {Object} enrollmentData - Enrollment data
   * @param {string} enrollmentData.walletAddress - Sui wallet address
   * @param {string} enrollmentData.userName - User's name from Google OAuth
   * @param {string} enrollmentData.userEmail - User's email from Google OAuth
   * @param {Buffer} enrollmentData.photoBuffer - Photo buffer for face enrollment
   * @param {string} enrollmentData.photoMimeType - Photo MIME type
   * @returns {Promise<Object>} - Enrollment result
   */
  async enrollFace(enrollmentData) {
    try {
      const { walletAddress, userName, userEmail, photoBuffer, photoMimeType } = enrollmentData;
      const personName = `${walletAddress}|${userName}`;
      
      console.log(`🎭 Starting face enrollment for: ${personName}`);

      // First check if already enrolled
      const statusCheck = await this.checkEnrollmentStatus(walletAddress, userName);
      if (statusCheck.success && statusCheck.data.isEnrolled) {
        return {
          success: false,
          error: 'Person already enrolled',
          data: statusCheck.data
        };
      }

      // Prepare form data for Luxand API
      const formData = new FormData();
      formData.append('name', personName);
      formData.append('store', '1');
      formData.append('collections', '');
      formData.append('unique', '0');
      formData.append('photos', photoBuffer, {
        filename: 'enrollment_photo.jpg',
        contentType: photoMimeType || 'image/jpeg'
      });

      // Call Luxand API to enroll person
      const enrollResponse = await fetch(`${this.baseUrl}/v2/person`, {
        method: 'POST',
        headers: {
          'token': this.apiToken,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!enrollResponse.ok) {
        const errorData = await enrollResponse.json().catch(() => ({}));
        throw new Error(`Luxand enrollment failed: ${enrollResponse.status} ${errorData.message || enrollResponse.statusText}`);
      }

      const enrollResult = await enrollResponse.json();
      
      if (!enrollResult.uuid) {
        throw new Error('Luxand API did not return UUID');
      }

      console.log(`✅ Face enrolled successfully in Luxand:`, {
        uuid: enrollResult.uuid,
        personName
      });

      // Prepare enrollment data for Walrus storage
      const walrusEnrollmentData = {
        walletAddress,
        userName,
        userEmail,
        luxandUuid: enrollResult.uuid,
        enrolledAt: new Date().toISOString(),
        isEnrolled: true
      };

      // Store enrollment data on Walrus (but don't use it for now)
      let walrusResult = null;
      try {
        walrusResult = await walrusService.storeEnrollmentData(walrusEnrollmentData);
        console.log('✅ Enrollment data stored on Walrus:', walrusResult.blobId);
      } catch (walrusError) {
        console.warn('⚠️ Failed to store on Walrus (continuing anyway):', walrusError.message);
      }

      return {
        success: true,
        data: {
          luxandUuid: enrollResult.uuid,
          luxandPersonName: personName,
          walletAddress,
          userName,
          userEmail,
          enrolledAt: walrusEnrollmentData.enrolledAt,
          isEnrolled: true,
          walrusBlobId: walrusResult?.blobId || null,
          walrusStored: !!walrusResult?.success
        }
      };

    } catch (error) {
      console.error('❌ Face enrollment failed:', error);
      return {
        success: false,
        error: error.message,
        data: {
          walletAddress: enrollmentData.walletAddress,
          userName: enrollmentData.userName,
          isEnrolled: false
        }
      };
    }
  }

  /**
   * Recognize a face using Luxand Cloud API
   * @param {Buffer} photoBuffer - Photo buffer for recognition
   * @param {string} photoMimeType - Photo MIME type
   * @returns {Promise<Object>} - Recognition result
   */
  async recognizeFace(photoBuffer, photoMimeType) {
    try {
      console.log('🔍 Starting face recognition...');

      const formData = new FormData();
      // Use "photo" (singular) as field name, matching the working HTML demo
      formData.append('photo', photoBuffer, {
        filename: 'recognition_photo.jpg',
        contentType: photoMimeType || 'image/jpeg'
      });
      // Add collections parameter (empty string like in HTML demo)
      formData.append('collections', '');

      // Use the correct endpoint that works in HTML demo
      const recognizeResponse = await fetch(`${this.baseUrl}/photo/search/v2`, {
        method: 'POST',
        headers: {
          'token': this.apiToken,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!recognizeResponse.ok) {
        const errorData = await recognizeResponse.json().catch(() => ({}));
        throw new Error(`Luxand recognition failed: ${recognizeResponse.status} ${errorData.message || recognizeResponse.statusText}`);
      }

      const recognitionResult = await recognizeResponse.json();
      
      console.log('✅ Face recognition completed:', recognitionResult);

      // Parse the person name to extract wallet address and user name
      let walletAddress = null;
      let userName = null;
      
      if (recognitionResult.length > 0 && recognitionResult[0].name) {
        const [extractedWallet, extractedName] = recognitionResult[0].name.split('|');
        walletAddress = extractedWallet;
        userName = extractedName;
      }

      return {
        success: true,
        data: {
          recognized: recognitionResult.length > 0,
          confidence: recognitionResult[0]?.probability || 0, // Note: HTML demo uses "probability"
          luxandUuid: recognitionResult[0]?.uuid || null,
          luxandPersonName: recognitionResult[0]?.name || null,
          walletAddress,
          userName,
          recognizedAt: new Date().toISOString(),
          rawResult: recognitionResult
        }
      };

    } catch (error) {
      console.error('❌ Face recognition failed:', error);
      
      // Fallback to mock service if Luxand fails
      if (error.message.includes('Trial is ended') || error.message.includes('401')) {
        console.log('🎭 Luxand trial expired, falling back to mock service for recognition');
        try {
          const mockResult = await mockFaceService.recognizeFace(photoBuffer.toString('base64'), {});
          return {
            success: true,
            data: {
              recognized: mockResult.success,
              confidence: mockResult.confidence,
              luxandUuid: mockResult.faceId,
              luxandPersonName: mockResult.userInfo ? `${mockResult.userInfo.walletAddress}|${mockResult.userInfo.userName}` : null,
              walletAddress: mockResult.userInfo?.walletAddress || null,
              userName: mockResult.userInfo?.userName || null,
              recognizedAt: new Date().toISOString()
            }
          };
        } catch (mockError) {
          console.error('❌ Mock service also failed:', mockError);
        }
      }
      
      return {
        success: false,
        error: error.message,
        data: {
          recognized: false,
          recognizedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get all enrolled persons from Luxand database
   * @returns {Promise<Object>} - List of enrolled persons
   */
  async getEnrolledPersons() {
    try {
      console.log('📋 Fetching all enrolled persons...');

      const response = await fetch(`${this.baseUrl}/v2/person`, {
        method: 'GET',
        headers: {
          'token': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Luxand API error: ${response.status} ${response.statusText}`);
      }

      const persons = await response.json();
      
      // Filter and parse PayWiser enrolled persons
      const payWiserPersons = persons
        .filter(person => person.name && person.name.includes('|'))
        .map(person => {
          const [walletAddress, userName] = person.name.split('|');
          return {
            luxandUuid: person.uuid,
            luxandPersonName: person.name,
            walletAddress,
            userName,
            enrolledAt: person.created,
            isEnrolled: true
          };
        });

      console.log(`✅ Found ${payWiserPersons.length} PayWiser enrolled persons`);

      return {
        success: true,
        data: {
          totalPersons: persons.length,
          payWiserPersons: payWiserPersons.length,
          persons: payWiserPersons
        }
      };

    } catch (error) {
      console.error('❌ Failed to get enrolled persons:', error);
      return {
        success: false,
        error: error.message,
        data: {
          persons: []
        }
      };
    }
  }

  /**
   * Delete a person from Luxand database
   * @param {string} luxandUuid - Luxand person UUID
   * @returns {Promise<Object>} - Deletion result
   */
  async deletePerson(luxandUuid) {
    try {
      console.log(`🗑️ Deleting person from Luxand: ${luxandUuid}`);

      const response = await fetch(`${this.baseUrl}/v2/person/${luxandUuid}`, {
        method: 'DELETE',
        headers: {
          'token': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Luxand deletion failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Person deleted from Luxand successfully');

      return {
        success: true,
        data: {
          deletedUuid: luxandUuid,
          deletedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Failed to delete person:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

}

module.exports = new FaceEnrollmentService();
