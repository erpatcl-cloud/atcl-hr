// Mock Firebase Integration Layer for Company Information Module
// Simulates Firebase SDK v10 (Firestore and Cloud Storage)

export const firebaseConfig = {
  apiKey: "mock-api-key-atcl-hrms-12345",
  authDomain: "atcl-hr-erp.firebaseapp.com",
  projectId: "atcl-hr-erp",
  storageBucket: "atcl-hr-erp.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:mockappid123"
};

console.log("[Firebase] Initialized App with config:", firebaseConfig);

// Simulates Firebase Storage file upload with progress callbacks
export const uploadFileToStorage = (file, path, onProgress = () => {}) => {
  return new Promise((resolve, reject) => {
    console.log(`[Firebase Storage] Starting upload of ${file.name} (${(file.size / 1024).toFixed(1)} KB) to storage path: /${path}`);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      onProgress(progress);
      console.log(`[Firebase Storage] Upload progress to /${path}: ${progress}%`);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Return a mock download URL. If it's an image, read it as Base64 so it can actually display!
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log(`[Firebase Storage] Upload complete. Generated data URI for local display.`);
            resolve(reader.result); // Resolves to base64 url
          };
          reader.onerror = () => {
            reject(new Error("Failed to read file contents"));
          };
          reader.readAsDataURL(file);
        } else {
          // For PDFs/docs, resolve to a mock document url
          const mockUrl = `https://firebasestorage.googleapis.com/v0/b/atcl-hr-erp.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=mock-token-${Date.now()}`;
          console.log(`[Firebase Storage] Upload complete. Download URL: ${mockUrl}`);
          resolve(mockUrl);
        }
      }
    }, 200); // uploads in 1 second
  });
};

// Simulates Firestore Write
export const saveToFirestore = (collectionName, docId, data) => {
  return new Promise((resolve) => {
    console.group(`[Firebase Firestore] db.collection("${collectionName}").doc("${docId}").set()`);
    console.log("Payload:", data);
    console.groupEnd();
    
    // Simulate latency
    setTimeout(() => {
      resolve({ success: true, ref: `${collectionName}/${docId}`, timestamp: new Date().toISOString() });
    }, 300);
  });
};

// Simulates Firestore Read
export const fetchFromFirestore = (collectionName, docId) => {
  return new Promise((resolve) => {
    console.log(`[Firebase Firestore] db.collection("${collectionName}").doc("${docId}").get() requested`);
    setTimeout(() => {
      resolve({ exists: true, id: docId, ref: `${collectionName}/${docId}` });
    }, 150);
  });
};
