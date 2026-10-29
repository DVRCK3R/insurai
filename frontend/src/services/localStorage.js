/**
 * Local Storage Service — persists quotes locally as fallback
 * This ensures users can see their quote history even if Firebase is down
 */

const QUOTES_KEY = "insurai_quotes";

/**
 * Save a quote to local storage.
 * @param {string} userId    — Firebase UID
 * @param {object} input     — form input data
 * @param {object} result    — prediction result from backend
 */
export function saveQuoteLocally(userId, input, result) {
  try {
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || "{}");
    if (!quotes[userId]) quotes[userId] = [];
    
    const quote = {
      id: Date.now().toString(), // Simple ID based on timestamp
      userId,
      input,
      result,
      createdAt: new Date().toISOString(),
    };
    
    quotes[userId].unshift(quote); // Add to front
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    return quote;
  } catch (err) {
    console.error("Failed to save quote locally:", err);
    return null;
  }
}

/**
 * Fetch quotes from local storage for a user.
 * @param {string} userId    — Firebase UID
 * @param {number} maxResults — max quotes to return
 */
export function getQuotesLocally(userId, maxResults = 10) {
  try {
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || "{}");
    const userQuotes = quotes[userId] || [];
    return userQuotes.slice(0, maxResults).map(q => ({
      ...q,
      createdAt: new Date(q.createdAt),
      _source: "local", // Mark as local storage source
    }));
  } catch (err) {
    console.error("Failed to retrieve quotes from local storage:", err);
    return [];
  }
}

/**
 * Merge Firestore and local storage quotes, removing duplicates.
 * Prefers Firestore (server) over local if timestamps match.
 */
export function mergeQuotes(firestoreQuotes, localQuotes) {
  const merged = {};
  
  // Add local quotes first
  localQuotes.forEach(q => {
    const key = `${q.createdAt.getTime()}`;
    merged[key] = q;
  });
  
  // Add/override with Firestore quotes
  firestoreQuotes.forEach(q => {
    const key = `${q.createdAt.getTime()}`;
    merged[key] = { ...q, _source: "firestore" };
  });
  
  // Sort by date descending and return
  return Object.values(merged).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Clear local storage (e.g., after successful Firestore sync)
 */
export function clearLocalQuotes(userId) {
  try {
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || "{}");
    delete quotes[userId];
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to clear local quotes:", err);
  }
}

/**
 * Delete a single local quote for a user.
 * @param {string} userId
 * @param {string} quoteId
 */
export function deleteQuoteLocally(userId, quoteId) {
  if (!userId || !quoteId) return false;
  try {
    const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || "{}");
    const userQuotes = quotes[userId] || [];
    const nextQuotes = userQuotes.filter(q => q.id !== quoteId);
    quotes[userId] = nextQuotes;
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    return nextQuotes.length !== userQuotes.length;
  } catch (err) {
    console.error("Failed to delete local quote:", err);
    return false;
  }
}

