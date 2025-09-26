// Luxand Cloud API configuration
const API_TOKEN = "20913b25e33641a9815c95a1f78948cf";
const BASE_URL = "https://api.luxand.cloud";

// Store enrolled persons locally for display
let enrolledPersons = JSON.parse(localStorage.getItem('enrolledPersons') || '[]');

// zkLogin configuration and state
const ZKLOGIN_CONFIG = {
    // OAuth Client IDs
    // Note: Client ID is safe to expose publicly, client secret is NOT included for security
    google: {
        clientId: "973332711614-hkcur3rlfuto87ta7qorjitvbnhiac7b.apps.googleusercontent.com",
        redirectUri: "http://localhost:5500/",
        scope: "openid email profile"
    },
    facebook: {
        clientId: "YOUR_FACEBOOK_CLIENT_ID", 
        redirectUri: window.location.origin + "/face-recognition/",
        scope: "openid email"
    },
    twitch: {
        clientId: "YOUR_TWITCH_CLIENT_ID",
        redirectUri: window.location.origin + "/face-recognition/",
        scope: "openid user:read:email"
    }
};

// zkLogin state
let zkLoginState = {
    isConnected: false,
    provider: null,
    suiAddress: null,
    jwt: null,
    ephemeralKeyPair: null,
    userSalt: null,
    zkProof: null
};

// This will be handled by the zkLogin initialization

/**
 * Enroll a new person
 */
async function enrollPerson() {
    const nameInput = document.getElementById('personName');
    const photoInput = document.getElementById('enrollPhoto');
    const resultDiv = document.getElementById('enrollResult');
    
    // Validation
    if (!nameInput.value.trim()) {
        showResult(resultDiv, 'Please enter a person name.', 'error');
        return;
    }
    
    if (!photoInput.files[0]) {
        showResult(resultDiv, 'Please select a photo.', 'error');
        return;
    }
    
    showResult(resultDiv, 'Enrolling person...', 'loading');
    
    try {
        const data = {
            "name": nameInput.value.trim(),
            "store": "1",
            "collections": "",
            "unique": "0",
        };
        
        const files = {
            "photos": photoInput.files[0],
        };
        
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        Object.keys(files).forEach(key => formData.append(key, files[key]));
        
        const response = await fetch(`${BASE_URL}/v2/person`, {
            method: "POST",
            headers: {
                "token": API_TOKEN,
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.uuid) {
            // Success
            const personInfo = {
                uuid: result.uuid,
                name: nameInput.value.trim(),
                enrolledAt: new Date().toISOString()
            };
            
            enrolledPersons.push(personInfo);
            localStorage.setItem('enrolledPersons', JSON.stringify(enrolledPersons));
            
            showResult(resultDiv, `✅ Successfully enrolled "${nameInput.value}" with UUID: ${result.uuid}`, 'success');
            
            // Clear form
            nameInput.value = '';
            photoInput.value = '';
            
            // Update enrolled persons list
            updateEnrolledPersonsDisplay();
        } else {
            // Error
            showResult(resultDiv, `❌ Error: ${result.message || 'Failed to enroll person'}`, 'error');
        }
        
    } catch (error) {
        console.error('Enrollment error:', error);
        showResult(resultDiv, `❌ Network error: ${error.message}`, 'error');
    }
}

/**
 * Recognize a person from photo
 */
async function recognizePerson() {
    const photoInput = document.getElementById('recognizePhoto');
    const resultDiv = document.getElementById('recognizeResult');
    
    // Validation
    if (!photoInput.files[0]) {
        showResult(resultDiv, 'Please select a photo to recognize.', 'error');
        return;
    }
    
    showResult(resultDiv, 'Recognizing person...', 'loading');
    
    try {
        const data = {
            "collections": "",
        };
        
        const files = {
            "photo": photoInput.files[0],
        };
        
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));
        Object.keys(files).forEach(key => formData.append(key, files[key]));
        
        const response = await fetch(`${BASE_URL}/photo/search/v2`, {
            method: "POST",
            headers: {
                "token": API_TOKEN,
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            if (result.length > 0 && result[0].uuid) {
                // Person recognized
                const recognizedPerson = result[0];
                const confidence = (recognizedPerson.probability * 100).toFixed(1);
                
                // The API already returns the person name, no need to fetch separately
                const personName = recognizedPerson.name || 'Unknown';
                
                showResult(resultDiv, 
                    `✅ Person recognized: <strong>${personName}</strong><br>
                     UUID: ${recognizedPerson.uuid}<br>
                     Confidence: ${confidence}%<br>
                     Face location: (${recognizedPerson.rectangle.left}, ${recognizedPerson.rectangle.top})`, 
                    'success'
                );
            } else {
                // No person recognized
                showResult(resultDiv, '❓ No matching person found in the database.', 'warning');
            }
        } else {
            // Error
            showResult(resultDiv, `❌ Error: ${result.message || 'Failed to recognize person'}`, 'error');
        }
        
    } catch (error) {
        console.error('Recognition error:', error);
        showResult(resultDiv, `❌ Network error: ${error.message}`, 'error');
    }
}

/**
 * Get person details by UUID
 */
async function getPersonDetails(uuid) {
    try {
        const response = await fetch(`${BASE_URL}/v2/person/${uuid}`, {
            method: "GET",
            headers: {
                "token": API_TOKEN,
            }
        });
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error getting person details:', error);
        return null;
    }
}

/**
 * Update the enrolled persons display
 */
function updateEnrolledPersonsDisplay() {
    const container = document.getElementById('enrolledPersons');
    
    if (enrolledPersons.length === 0) {
        container.innerHTML = '<p>No persons enrolled yet.</p>';
        return;
    }
    
    const personsList = enrolledPersons.map((person, index) => {
        const enrolledDate = new Date(person.enrolledAt).toLocaleDateString();
        return `
            <div class="person-item">
                <div class="person-info">
                    <strong>${person.name}</strong>
                    <small>UUID: ${person.uuid}</small>
                    <small>Enrolled: ${enrolledDate}</small>
                </div>
                <button onclick="removePerson(${index})" class="btn-remove">Remove</button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = personsList;
}

/**
 * Remove a person from local storage
 */
function removePerson(index) {
    if (confirm('Are you sure you want to remove this person from the local list?')) {
        enrolledPersons.splice(index, 1);
        localStorage.setItem('enrolledPersons', JSON.stringify(enrolledPersons));
        updateEnrolledPersonsDisplay();
    }
}

/**
 * Refresh enrolled persons list
 */
function refreshEnrolledList() {
    updateEnrolledPersonsDisplay();
    showResult(document.getElementById('enrolledPersons'), 'List refreshed!', 'success', 2000);
}

/**
 * Load all persons from Luxand Cloud database
 */
async function loadDatabasePersons() {
    const container = document.getElementById('databasePersons');
    showResult(container, 'Loading persons from database...', 'loading');
    
    try {
        const response = await fetch(`${BASE_URL}/v2/person`, {
            method: "GET",
            headers: {
                "token": API_TOKEN,
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayDatabasePersons(result);
        } else {
            showResult(container, `❌ Error loading persons: ${result.message || 'Failed to load'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error loading database persons:', error);
        showResult(container, `❌ Network error: ${error.message}`, 'error');
    }
}

/**
 * Display database persons
 */
function displayDatabasePersons(persons) {
    const container = document.getElementById('databasePersons');
    
    if (!persons || persons.length === 0) {
        container.innerHTML = '<p>No persons found in database.</p>';
        return;
    }
    
    const personsList = persons.map(person => {
        const faceCount = person.faces ? person.faces.length : 0;
        const collectionsCount = person.collections ? person.collections.length : 0;
        
        return `
            <div class="person-item">
                <div class="person-info">
                    <strong>${person.name}</strong>
                    <small>UUID: ${person.uuid}</small>
                    <small>Faces: ${faceCount}</small>
                    <small>Collections: ${collectionsCount}</small>
                </div>
                <div class="person-actions">
                    <button onclick="deletePerson('${person.uuid}', '${person.name}')" class="btn-remove">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = personsList;
}

/**
 * Delete a person from Luxand Cloud database
 */
async function deletePerson(uuid, name) {
    if (!confirm(`Are you sure you want to delete "${name}" from the database? This action cannot be undone.`)) {
        return;
    }
    
    const container = document.getElementById('databasePersons');
    showResult(container, `Deleting ${name}...`, 'loading');
    
    try {
        const response = await fetch(`${BASE_URL}/person/${uuid}`, {
            method: "DELETE",
            headers: {
                "token": API_TOKEN,
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showResult(container, `✅ Successfully deleted "${name}"`, 'success', 3000);
            
            // Remove from local storage if it exists there too
            const localIndex = enrolledPersons.findIndex(p => p.uuid === uuid);
            if (localIndex !== -1) {
                enrolledPersons.splice(localIndex, 1);
                localStorage.setItem('enrolledPersons', JSON.stringify(enrolledPersons));
                updateEnrolledPersonsDisplay();
            }
            
            // Reload database list after a short delay
            setTimeout(() => {
                loadDatabasePersons();
            }, 1000);
        } else {
            showResult(container, `❌ Error deleting person: ${result.message || 'Failed to delete'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting person:', error);
        showResult(container, `❌ Network error: ${error.message}`, 'error');
    }
}

/**
 * Show result message
 */
function showResult(element, message, type, timeout = 5000) {
    element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    if (type !== 'loading' && timeout > 0) {
        setTimeout(() => {
            element.innerHTML = '';
        }, timeout);
    }
}

/**
 * Utility function to handle file preview (optional enhancement)
 */
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================================================
// zkLogin Functions
// ============================================================================

/**
 * Initialize zkLogin on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    updateEnrolledPersonsDisplay();
    initializeZkLogin();
    checkForOAuthCallback();
});

/**
 * Initialize zkLogin state and UI
 */
function initializeZkLogin() {
    // Load saved zkLogin state
    const savedState = localStorage.getItem('zkLoginState');
    if (savedState) {
        zkLoginState = { ...zkLoginState, ...JSON.parse(savedState) };
        updateAuthStatus();
    }
}

/**
 * Check if we're returning from OAuth callback
 */
function checkForOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const idToken = urlParams.get('id_token');
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    console.log('OAuth callback check:', { idToken: !!idToken, code: !!code, state, error });
    console.log('Current URL:', window.location.href);
    
    if (error) {
        showResult(document.getElementById('zkloginResult'), `❌ OAuth Error: ${error}`, 'error');
        return;
    }
    
    if (idToken || code) {
        console.log('Processing OAuth callback...');
        handleOAuthCallback(idToken, code, state);
        // Clean up URL after a short delay to see the callback
        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 1000);
    }
}

/**
 * Login with Google OAuth
 */
function loginWithGoogle() {
    initiateOAuthFlow('google');
}

/**
 * Login with Facebook OAuth
 */
function loginWithFacebook() {
    initiateOAuthFlow('facebook');
}

/**
 * Login with Twitch OAuth
 */
function loginWithTwitch() {
    initiateOAuthFlow('twitch');
}

/**
 * Initiate OAuth flow for specified provider
 */
function initiateOAuthFlow(provider) {
    showResult(document.getElementById('zkloginResult'), `Initiating ${provider} login...`, 'loading');
    
    // Generate ephemeral key pair (simplified for demo)
    const ephemeralKeyPair = generateEphemeralKeyPair();
    const nonce = generateNonce(ephemeralKeyPair.publicKey);
    
    // Store ephemeral key pair
    zkLoginState.ephemeralKeyPair = ephemeralKeyPair;
    localStorage.setItem('zkLoginState', JSON.stringify(zkLoginState));
    
    const config = ZKLOGIN_CONFIG[provider];
    let authUrl;
    
    switch (provider) {
        case 'google':
            authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${config.clientId}&` +
                `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
                `response_type=code&` +
                `scope=${encodeURIComponent(config.scope)}&` +
                `nonce=${nonce}&` +
                `state=${provider}`;
            break;
        case 'facebook':
            authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
                `client_id=${config.clientId}&` +
                `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
                `response_type=id_token&` +
                `scope=${encodeURIComponent(config.scope)}&` +
                `nonce=${nonce}&` +
                `state=${provider}`;
            break;
        case 'twitch':
            authUrl = `https://id.twitch.tv/oauth2/authorize?` +
                `client_id=${config.clientId}&` +
                `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
                `response_type=id_token&` +
                `scope=${encodeURIComponent(config.scope)}&` +
                `nonce=${nonce}&` +
                `state=${provider}`;
            break;
        default:
            showResult(document.getElementById('zkloginResult'), `❌ Unsupported provider: ${provider}`, 'error');
            return;
    }
    
    // Redirect to OAuth provider
    window.location.href = authUrl;
}

/**
 * Handle OAuth callback
 */
async function handleOAuthCallback(idToken, code, state) {
    const provider = state;
    showResult(document.getElementById('zkloginResult'), `Processing ${provider} authentication...`, 'loading');
    
    try {
        if (idToken) {
            // Direct ID token (implicit flow)
            await processJWT(idToken, provider);
        } else if (code) {
            // For demo purposes, simulate successful authentication
            // In production, this would exchange code for tokens server-side
            await simulateSuccessfulAuth(code, provider);
        }
    } catch (error) {
        console.error('OAuth callback error:', error);
        showResult(document.getElementById('zkloginResult'), `❌ Authentication failed: ${error.message}`, 'error');
    }
}

/**
 * Simulate successful authentication for demo (when we get authorization code)
 */
async function simulateSuccessfulAuth(code, provider) {
    try {
        // Create a mock JWT payload for demo purposes
        const mockJWT = {
            sub: "demo_user_" + Math.random().toString(36).substring(2, 15),
            iss: "https://accounts.google.com",
            aud: ZKLOGIN_CONFIG.google.clientId,
            email: "demo@example.com",
            name: "Demo User",
            exp: Math.floor(Date.now() / 1000) + 3600
        };
        
        // Get user salt
        const userSalt = await getUserSalt(mockJWT.sub, mockJWT.iss, mockJWT.aud);
        
        // Generate Sui address
        const suiAddress = generateSuiAddress(mockJWT.sub, mockJWT.iss, mockJWT.aud, userSalt);
        
        // Generate ZK proof (simplified for demo)
        const zkProof = await generateZKProof(JSON.stringify(mockJWT), zkLoginState.ephemeralKeyPair, userSalt);
        
        // Update state
        zkLoginState = {
            ...zkLoginState,
            isConnected: true,
            provider: provider,
            suiAddress: suiAddress,
            jwt: JSON.stringify(mockJWT),
            userSalt: userSalt,
            zkProof: zkProof
        };
        
        // Save state
        localStorage.setItem('zkLoginState', JSON.stringify(zkLoginState));
        
        // Update UI
        updateAuthStatus();
        showResult(document.getElementById('zkloginResult'), 
            `✅ Successfully connected with ${provider}!<br>
             <strong>Demo Mode:</strong> Using simulated authentication<br>
             Address: ${suiAddress}`, 'success');
        
    } catch (error) {
        console.error('Simulated auth error:', error);
        showResult(document.getElementById('zkloginResult'), `❌ Failed to simulate authentication: ${error.message}`, 'error');
    }
}

/**
 * Process JWT and complete zkLogin flow
 */
async function processJWT(jwt, provider) {
    try {
        // Decode JWT to get user info
        const decoded = decodeJWT(jwt);
        console.log('Decoded JWT:', decoded);
        
        // Get user salt
        const userSalt = await getUserSalt(decoded.sub, decoded.iss, decoded.aud);
        
        // Generate Sui address
        const suiAddress = generateSuiAddress(decoded.sub, decoded.iss, decoded.aud, userSalt);
        
        // Generate ZK proof (simplified for demo)
        const zkProof = await generateZKProof(jwt, zkLoginState.ephemeralKeyPair, userSalt);
        
        // Update state
        zkLoginState = {
            ...zkLoginState,
            isConnected: true,
            provider: provider,
            suiAddress: suiAddress,
            jwt: jwt,
            userSalt: userSalt,
            zkProof: zkProof
        };
        
        // Save state
        localStorage.setItem('zkLoginState', JSON.stringify(zkLoginState));
        
        // Update UI
        updateAuthStatus();
        showResult(document.getElementById('zkloginResult'), 
            `✅ Successfully connected with ${provider}!<br>Address: ${suiAddress}`, 'success');
        
    } catch (error) {
        console.error('JWT processing error:', error);
        showResult(document.getElementById('zkloginResult'), `❌ Failed to process authentication: ${error.message}`, 'error');
    }
}

/**
 * Update authentication status UI
 */
function updateAuthStatus() {
    const authStatus = document.getElementById('authStatus');
    const walletInfo = document.getElementById('walletInfo');
    const zkloginFeatures = document.getElementById('zkloginFeatures');
    
    if (zkLoginState.isConnected) {
        authStatus.innerHTML = `
            <div class="status-connected">
                <span class="status-indicator">🟢</span>
                <span>Connected to Sui via ${zkLoginState.provider}</span>
            </div>
        `;
        
        document.getElementById('suiAddress').textContent = zkLoginState.suiAddress || 'Not available';
        document.getElementById('authProvider').textContent = zkLoginState.provider || 'None';
        document.getElementById('connectionStatus').textContent = 'Connected';
        
        walletInfo.style.display = 'block';
        zkloginFeatures.style.display = 'block';
    } else {
        authStatus.innerHTML = `
            <div class="status-disconnected">
                <span class="status-indicator">🔴</span>
                <span>Not connected to Sui</span>
            </div>
        `;
        
        walletInfo.style.display = 'none';
        zkloginFeatures.style.display = 'none';
    }
}

/**
 * Copy Sui address to clipboard
 */
async function copyAddress() {
    try {
        await navigator.clipboard.writeText(zkLoginState.suiAddress);
        showResult(document.getElementById('zkloginResult'), '📋 Address copied to clipboard!', 'success', 2000);
    } catch (error) {
        console.error('Copy failed:', error);
        showResult(document.getElementById('zkloginResult'), '❌ Failed to copy address', 'error', 2000);
    }
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
    if (confirm('Are you sure you want to disconnect your zkLogin wallet?')) {
        zkLoginState = {
            isConnected: false,
            provider: null,
            suiAddress: null,
            jwt: null,
            ephemeralKeyPair: null,
            userSalt: null,
            zkProof: null
        };
        
        localStorage.removeItem('zkLoginState');
        updateAuthStatus();
        showResult(document.getElementById('zkloginResult'), '✅ Successfully disconnected', 'success', 3000);
    }
}

/**
 * Refresh wallet connection
 */
function refreshWallet() {
    if (zkLoginState.isConnected) {
        updateAuthStatus();
        showResult(document.getElementById('zkloginResult'), '🔄 Wallet status refreshed', 'success', 2000);
    } else {
        showResult(document.getElementById('zkloginResult'), '❌ No wallet connected to refresh', 'warning', 2000);
    }
}

// ============================================================================
// zkLogin Helper Functions (Simplified for Demo)
// ============================================================================

/**
 * Generate ephemeral key pair (simplified)
 */
function generateEphemeralKeyPair() {
    // In a real implementation, you'd use proper cryptographic libraries
    const privateKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const publicKey = 'ephemeral_' + privateKey.substring(0, 16);
    
    return { privateKey, publicKey };
}

/**
 * Generate nonce for JWT
 */
function generateNonce(ephemeralPublicKey) {
    // Simplified nonce generation
    const randomness = Math.random().toString(36).substring(2, 15);
    const maxEpoch = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    return btoa(`${ephemeralPublicKey}_${maxEpoch}_${randomness}`).substring(0, 43);
}

/**
 * Decode JWT (simplified)
 */
function decodeJWT(jwt) {
    try {
        const parts = jwt.split('.');
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (error) {
        throw new Error('Invalid JWT format');
    }
}

/**
 * Get user salt (mock implementation)
 */
async function getUserSalt(sub, iss, aud) {
    // In a real implementation, this would call a salt service
    // For demo, we'll generate a deterministic salt
    const saltInput = `${sub}_${iss}_${aud}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(saltInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

/**
 * Generate Sui address (simplified)
 */
function generateSuiAddress(sub, iss, aud, userSalt) {
    // Simplified address generation for demo
    const addressInput = `${sub}_${iss}_${aud}_${userSalt}`;
    const hash = btoa(addressInput).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
    return `0x${hash.toLowerCase()}`;
}

/**
 * Generate ZK proof (mock implementation)
 */
async function generateZKProof(jwt, ephemeralKeyPair, userSalt) {
    // In a real implementation, this would call the ZK proving service
    // For demo, we'll return a mock proof
    return {
        proof: 'mock_zk_proof_' + Math.random().toString(36).substring(2, 15),
        publicInputs: ['mock_input_1', 'mock_input_2'],
        timestamp: Date.now()
    };
}

/**
 * Exchange authorization code for tokens (simplified)
 */
async function exchangeCodeForTokens(code, provider) {
    // This would normally be done server-side to protect client secrets
    // For demo purposes, we'll simulate the response
    throw new Error('Authorization code flow not implemented in demo. Please use implicit flow.');
}
