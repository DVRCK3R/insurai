/**
 * Firebase Client Config
 *
 * SETUP STEPS:
 * 1. Go to https://console.firebase.google.com
 * 2. Open your project → Project Settings → General
 * 3. Scroll to "Your apps" → Web app → Copy the firebaseConfig object
 * 4. Copy frontend/.env.example to frontend/.env and set the VITE_* values
 *    (these are client-side values, not server secrets)
 */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "YOUR_API_KEY",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "your-project.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "your-project-id",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:123456789:web:abcdef",
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const storage  = getStorage(app);

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

/**
 * Save a quote to Firestore.
 * @param {string} userId    — Firebase UID
 * @param {object} input     — form input data
 * @param {object} result    — prediction result from backend
 */
export async function saveQuoteToFirestore(userId, input, result) {
  if (!userId) return null;
  try {
    const docRef = await addDoc(collection(db, "quotes"), {
      userId,
      input,
      result,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, userId, input, result, createdAt: new Date() };
  } catch (err) {
    console.error("Failed to save quote to Firestore:", err);
    return null;
  }
}

/**
 * Fetch quote history for the current user directly from Firestore.
 * (Alternative to hitting the backend /api/quote/history endpoint)
 */
export async function fetchQuoteHistory(userId, maxResults = 10) {
  const q = query(
    collection(db, "quotes"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // Convert Firebase Timestamp to JS Date
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  });
}

/**
 * Delete a quote from Firestore for the given user.
 * Safety: verifies the quote belongs to the user before deleting.
 * @param {string} userId
 * @param {string} quoteId
 */
export async function deleteQuoteFromFirestore(userId, quoteId) {
  if (!userId || !quoteId) return false;

  const { doc, getDoc, deleteDoc } = await import("firebase/firestore");

  try {
    const ref = doc(db, "quotes", quoteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const data = snap.data();
    if (data.userId !== userId) return false;

    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error("Failed to delete quote from Firestore:", err);
    return false;
  }
}
