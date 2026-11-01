import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { USER_SEEDS } from "./userSeeds";

export const firebaseConfig = {
  apiKey: "AIzaSyDQZfAyfYx-8deecf1lm6yCXirGbd0PJcA",
  authDomain: "erpatcl.firebaseapp.com",
  projectId: "erpatcl",
  storageBucket: "erpatcl.firebasestorage.app",
  messagingSenderId: "98356728046",
  appId: "1:98356728046:web:3a0791008401375531e3ff",
  measurementId: "G-HG4623SP1F"
};

let app = null;
let db = null;
let storage = null;
let auth = null;
let analytics = null;
let isMock = false;

export const BACKEND_URL = 'http://localhost:5000/api';


const initFirebase = () => {
  if (isMock) return false;
  if (app) return true;
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
    console.log("[Firebase] Successfully initialized with project ID:", firebaseConfig.projectId);
    return true;
  } catch (error) {
    console.warn("[Firebase] Failed to initialize Firebase SDK. Falling back to local offline mock mode.", error);
    isMock = true;
    return false;
  }
};

// Auth SDK wrappers
let authListeners = [];
const notifyAuthListeners = (user) => {
  authListeners.forEach(cb => {
    try { cb(user); } catch (e) { console.error(e); }
  });
};

// Helper to initialize user credentials database in localStorage and Firestore
export const initUserCredentials = async () => {
  // 1. Initialize local storage copy first
  const storedCreds = localStorage.getItem("atcl_user_creds");
  let credsArray = storedCreds ? JSON.parse(storedCreds) : [];
  
  if (credsArray.length === 0) {
    // Populate from seeds
    credsArray = USER_SEEDS.map(seed => ({
      username: seed.id.trim().toLowerCase(),
      fullName: seed.name,
      email: seed.email.trim().toLowerCase(),
      employeeCode: seed.employeeCode,
      password: seed.otp, // Initial OTP is password
      mustChangePassword: true
    }));
    localStorage.setItem("atcl_user_creds", JSON.stringify(credsArray));
  }

  // 2. If Firebase is active and not in mock mode, seed Firestore users collection
  if (!isMock && db) {
    try {
      const isFirestoreSeeded = localStorage.getItem("firestore_users_seeded");
      if (!isFirestoreSeeded) {
        console.log("[Firebase] Seeding users collection in Firestore...");
        for (const cred of credsArray) {
          const userDocRef = doc(db, "users", cred.employeeCode);
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            await setDoc(userDocRef, cred, { merge: true });
          }
        }
        localStorage.setItem("firestore_users_seeded", "true");
        console.log("[Firebase] Firestore users collection seeded successfully.");
      }
    } catch (e) {
      console.warn("[Firebase] Failed to seed Firestore users collection:", e);
    }
  }
};

export const loginWithEmail = async (emailOrUsername, password) => {
  initFirebase();
  await initUserCredentials();

  const input = emailOrUsername.trim().toLowerCase();

  // Try MySQL backend authentication first
  try {
    const res = await fetch(`${BACKEND_URL}/user-credentials/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmailOrCode: input, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("mock_auth_user", JSON.stringify(data.user));
      notifyAuthListeners(data.user);
      return { user: data.user };
    } else if (res.status === 404 || res.status === 401 || res.status === 400) {
      const errData = await res.json();
      throw new Error(errData.errorCode);
    }
  } catch (error) {
    if (error.message && error.message.startsWith('auth/')) {
      throw error; // Credentials invalid or wrong password from DB: throw error immediately
    }
    console.warn("[Firebase] MySQL backend auth server is offline or unreachable. Falling back to local offline mode.", error);
  }

  // Bypasses live Auth for demo admin accounts to ensure they always work in development/testing
  if (input === "admin@atc.com.bd" && password === "admin123") {
    const user = { email: input, uid: "mock-admin-uid-1234", role: "Administrator" };
    localStorage.setItem("mock_auth_user", JSON.stringify(user));
    notifyAuthListeners(user);
    return { user };
  }
  if (input === "hmekram@gmail.com" && password === "123456") {
    const user = { email: input, uid: "mock-admin-uid-hmekram", role: "Administrator" };
    localStorage.setItem("mock_auth_user", JSON.stringify(user));
    notifyAuthListeners(user);
    return { user };
  }
  if (input === "atc@dhaka.net" && password === "123456") {
    const user = { email: input, uid: "mock-admin-uid-atcdhaka", role: "Administrator" };
    localStorage.setItem("mock_auth_user", JSON.stringify(user));
    notifyAuthListeners(user);
    return { user };
  }
  if (input === "erpatcl@gmail.com" && (password === "123456" || password === "admin123")) {
    const user = { email: input, uid: "mock-admin-uid-erpatcl", role: "Administrator" };
    localStorage.setItem("mock_auth_user", JSON.stringify(user));
    notifyAuthListeners(user);
    return { user };
  }

  // Fetch matched user from local storage
  const storedCreds = localStorage.getItem("atcl_user_creds");
  const creds = storedCreds ? JSON.parse(storedCreds) : [];
  
  // Find matches by username, email, or employeeCode
  const matches = creds.filter(c => 
    c.username === input || 
    c.email === input || 
    c.employeeCode.toLowerCase() === input
  );

  if (matches.length === 0) {
    throw new Error("auth/user-not-found");
  }

  // Handle duplicate usernames
  let targetUser = null;
  if (matches.length > 1) {
    // Try to disambiguate by checking password if it matches exactly one
    const matchingPassword = matches.filter(c => c.password === password);
    if (matchingPassword.length === 1) {
      targetUser = matchingPassword[0];
    } else {
      throw new Error("auth/ambiguous-username");
    }
  } else {
    targetUser = matches[0];
  }

  // Sync with Firestore if active
  if (!isMock && db) {
    try {
      const userDocRef = doc(db, "users", targetUser.employeeCode);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const firestoreUser = docSnap.data();
        if (firestoreUser.password !== targetUser.password || firestoreUser.mustChangePassword !== targetUser.mustChangePassword) {
          targetUser.password = firestoreUser.password;
          targetUser.mustChangePassword = firestoreUser.mustChangePassword;
          // Update local copy
          const updatedCreds = creds.map(c => c.employeeCode === targetUser.employeeCode ? targetUser : c);
          localStorage.setItem("atcl_user_creds", JSON.stringify(updatedCreds));
        }
      }
    } catch (e) {
      console.warn("[Firebase] Offline or failed to sync login state with Firestore:", e);
    }
  }

  // Verify password
  if (targetUser.password !== password) {
    throw new Error("auth/wrong-password");
  }

  const user = {
    email: targetUser.email,
    uid: targetUser.employeeCode,
    employeeCode: targetUser.employeeCode,
    mustChangePassword: targetUser.mustChangePassword,
    role: "Employee (ESS)"
  };

  localStorage.setItem("mock_auth_user", JSON.stringify(user));
  notifyAuthListeners(user);
  return { user };
};

// Update user password and set mustChangePassword = false
export const updateUserPassword = async (employeeCode, newPassword) => {
  initFirebase();
  await initUserCredentials();

  // 1. Update local storage credentials
  const storedCreds = localStorage.getItem("atcl_user_creds");
  if (storedCreds) {
    const creds = JSON.parse(storedCreds);
    const updated = creds.map(c => {
      if (c.employeeCode === employeeCode) {
        return { ...c, password: newPassword, mustChangePassword: false };
      }
      return c;
    });
    localStorage.setItem("atcl_user_creds", JSON.stringify(updated));
  }

  // 2. Update MySQL backend if reachable
  try {
    await fetch(`${BACKEND_URL}/user-credentials/${employeeCode}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword })
    });
    console.log("[MySQL] Password updated successfully in database.");
  } catch (error) {
    console.warn("[MySQL] Failed to update password in database:", error.message);
  }

  // 3. Update Firestore document if not mock
  // NOTE: This app uses localStorage-based mock auth for employee accounts.
  // Firestore writes will fail if there is no real Firebase Auth session (request.auth == null).
  // We do NOT throw here — localStorage is the persistent source of truth for password changes.
  if (!isMock && db) {
    try {
      const userDocRef = doc(db, "users", employeeCode);
      await setDoc(userDocRef, {
        password: newPassword,
        mustChangePassword: false
      }, { merge: true });
      console.log(`[Firebase Firestore] Password updated successfully for user ${employeeCode}`);
    } catch (error) {
      console.warn(
        `[Firebase Firestore] Could not persist password change to Firestore (mock auth session has no Firebase token). ` +
        `Password is saved in localStorage and will apply on next login.`,
        error
      );
      // Do NOT re-throw — the localStorage update above is sufficient for the mock auth flow.
    }
  }

  // 4. Update currently logged in session in localStorage if active
  const savedUser = localStorage.getItem("mock_auth_user");
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.employeeCode === employeeCode) {
      user.mustChangePassword = false;
      localStorage.setItem("mock_auth_user", JSON.stringify(user));
      notifyAuthListeners(user);
    }
  }

  return { success: true };
};

export const loginWithGoogle = async () => {
  initFirebase();
  if (isMock) {
    console.log("[Firebase Auth Mock] Simulating Google login.");
    const user = { email: "erpatcl@gmail.com", uid: "mock-admin-uid-erpatcl" };
    localStorage.setItem("mock_auth_user", JSON.stringify(user));
    notifyAuthListeners(user);
    return { user };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ login_hint: "erpatcl@gmail.com" });
    const result = await signInWithPopup(auth, provider);
    console.log("[Firebase Auth] Google login successful:", result.user.email);
    localStorage.removeItem("mock_auth_user");
    return result;
  } catch (error) {
    console.error("[Firebase Auth] Google sign in failed:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  initFirebase();
  localStorage.removeItem("mock_auth_user");
  notifyAuthListeners(null);

  if (isMock) {
    console.log("[Firebase Auth Mock] Logged out.");
    return { success: true };
  }

  try {
    await signOut(auth);
    console.log("[Firebase Auth] Logged out successfully.");
    return { success: true };
  } catch (error) {
    console.error("[Firebase Auth] Sign out failed:", error);
    throw error;
  }
};

export const resetUserPassword = async (email) => {
  initFirebase();
  if (isMock) {
    console.log("[Firebase Auth Mock] Sent password reset link to:", email);
    return { success: true };
  }

  try {
    await sendPasswordResetEmail(auth, email);
    console.log("[Firebase Auth] Password reset email sent.");
    return { success: true };
  } catch (error) {
    console.error("[Firebase Auth] Password reset request failed:", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback) => {
  initFirebase();
  
  // Register custom listener
  authListeners.push(callback);
  
  // Emit mock user if present
  const savedUser = localStorage.getItem("mock_auth_user");
  if (savedUser) {
    setTimeout(() => callback(JSON.parse(savedUser)), 100);
  } else if (isMock) {
    setTimeout(() => callback(null), 100);
  }

  let unsubscribeLive = null;
  if (!isMock && auth) {
    unsubscribeLive = onAuthStateChanged(auth, (user) => {
      if (!user) {
        const savedMock = localStorage.getItem("mock_auth_user");
        if (savedMock) {
          callback(JSON.parse(savedMock));
          return;
        }
      }
      callback(user);
    });
  }

  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
    if (unsubscribeLive) unsubscribeLive();
  };
};

// Real Firestore Write (with local storage mock fallback)
export const saveToFirestore = async (collectionName, docId, data) => {
  initFirebase();
  if (isMock) {
    console.log(`[Firebase Mock] Saving to local storage for ${collectionName}/${docId}`);
    const key = `mock_firestore_${collectionName}_${docId}`;
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true, ref: `${collectionName}/${docId}`, timestamp: new Date().toISOString(), mock: true };
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    console.log(`[Firebase Firestore] Saved to ${collectionName}/${docId} successfully.`);
    return { success: true, ref: `${collectionName}/${docId}`, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(`[Firebase Firestore] Error saving to ${collectionName}/${docId}:`, error);
    const key = `mock_firestore_${collectionName}_${docId}`;
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true, ref: `${collectionName}/${docId}`, timestamp: new Date().toISOString(), mock: true, error: error.message };
  }
};

// Real Firestore Read (with local storage mock fallback)
export const fetchFromFirestore = async (collectionName, docId) => {
  initFirebase();
  if (isMock) {
    const key = `mock_firestore_${collectionName}_${docId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return { exists: true, id: docId, data: JSON.parse(saved), ref: `${collectionName}/${docId}`, mock: true };
    }
    return { exists: false, id: docId, mock: true };
  }

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log(`[Firebase Firestore] Read from ${collectionName}/${docId} successfully.`);
      return { exists: true, id: docId, data: docSnap.data(), ref: `${collectionName}/${docId}` };
    } else {
      const key = `mock_firestore_${collectionName}_${docId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return { exists: true, id: docId, data: JSON.parse(saved), ref: `${collectionName}/${docId}`, mock: true };
      }
      console.log(`[Firebase Firestore] Document ${collectionName}/${docId} does not exist.`);
      return { exists: false, id: docId };
    }
  } catch (error) {
    console.error(`[Firebase Firestore] Error reading from ${collectionName}/${docId}:`, error);
    const key = `mock_firestore_${collectionName}_${docId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return { exists: true, id: docId, data: JSON.parse(saved), ref: `${collectionName}/${docId}`, mock: true };
    }
    return { exists: false, id: docId, error: error.message };
  }
};

// Real Firebase Storage file upload with progress callbacks (with local storage mock fallback)
export const uploadFileToStorage = (file, path, onProgress = () => {}) => {
  initFirebase();
  if (isMock) {
    return mockUpload(file, path, onProgress);
  }

  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
          console.log(`[Firebase Storage] Upload progress to /${path}: ${Math.round(progress)}%`);
        },
        (error) => {
          console.warn(`[Firebase Storage] Upload failed for /${path}, falling back to mock upload.`, error);
          mockUpload(file, path, onProgress).then(resolve).catch(reject);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[Firebase Storage] Upload complete. Download URL: ${downloadURL}`);
            resolve(downloadURL);
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (err) {
      console.warn("[Firebase Storage] Error starting task, falling back to mock upload.", err);
      mockUpload(file, path, onProgress).then(resolve).catch(reject);
    }
  });
};

const mockUpload = (file, path, onProgress) => {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        } else {
          resolve(`https://firebasestorage.googleapis.com/v0/b/erpatcl.firebasestorage.app/o/${encodeURIComponent(path)}?alt=media&token=mock-token-${Date.now()}`);
        }
      }
    }, 150);
  });
};

export { auth, isMock };
