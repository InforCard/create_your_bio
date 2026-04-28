import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { defaultBio } from "./data.js";

const placeholderValues = Object.values(firebaseConfig).some((value) => String(value).includes("YOUR_"));

let app = null;
let auth = null;
let db = null;

if (!placeholderValues) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export const isFirebaseConfigured = !placeholderValues;

export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail({ email, password, displayName, username }) {
  ensureConfigured();
  const usernameLower = normalizeUsername(username);
  if (!usernameLower) {
    throw new Error("Username chỉ được gồm chữ thường, số, gạch ngang hoặc gạch dưới.");
  }

  const isTaken = await isUsernameTaken(usernameLower);

  if (isTaken) {
    throw new Error("Username này đã tồn tại.");
  }

  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credentials.user, { displayName });

  const userPayload = {
    uid: credentials.user.uid,
    email,
    displayName,
    username,
    usernameLower,
    bioId: credentials.user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const bioPayload = {
    ...defaultBio,
    uid: credentials.user.uid,
    username,
    usernameLower,
    displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await Promise.all([
    setDoc(doc(db, "users", credentials.user.uid), userPayload),
    setDoc(doc(db, "bios", credentials.user.uid), bioPayload),
    setDoc(doc(db, "usernames", usernameLower), {
      uid: credentials.user.uid,
      username: usernameLower,
      visibility: bioPayload.visibility,
      updatedAt: serverTimestamp()
    })
  ]);

  return credentials.user;
}

export async function loginWithEmail({ email, password }) {
  ensureConfigured();
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return credentials.user;
}

export async function logoutUser() {
  ensureConfigured();
  await signOut(auth);
}

export async function ensureUserScaffold(user) {
  ensureConfigured();
  const userRef = doc(db, "users", user.uid);
  const bioRef = doc(db, "bios", user.uid);
  const [userSnap, bioSnap] = await Promise.all([getDoc(userRef), getDoc(bioRef)]);
  const normalizedDisplayName = user.displayName || user.email?.split("@")[0] || "New User";

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      displayName: normalizedDisplayName,
      username: "",
      usernameLower: "",
      bioId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  if (!bioSnap.exists()) {
    await setDoc(bioRef, {
      ...defaultBio,
      uid: user.uid,
      displayName: normalizedDisplayName,
      username: "",
      usernameLower: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

export async function getAccountBundle(uid) {
  ensureConfigured();
  const userRef = doc(db, "users", uid);
  const bioRef = doc(db, "bios", uid);
  const [userSnap, bioSnap] = await Promise.all([getDoc(userRef), getDoc(bioRef)]);

  return {
    userDoc: userSnap.exists() ? userSnap.data() : null,
    bioDoc: bioSnap.exists() ? bioSnap.data() : null
  };
}

export async function saveBio(uid, payload) {
  ensureConfigured();
  const bioRef = doc(db, "bios", uid);
  const currentBioSnap = await getDoc(bioRef);
  const currentBio = currentBioSnap.exists() ? currentBioSnap.data() : {};
  const nextBioPayload = {
    ...payload,
    updatedAt: serverTimestamp()
  };
  let nextUsername = currentBio.usernameLower || currentBio.username || "";

  if (Object.prototype.hasOwnProperty.call(payload, "username")) {
    const username = normalizeUsername(payload.username ?? "");
    const usernameLower = username;

    if (!usernameLower) {
      throw new Error("Username chỉ được gồm chữ thường, số, gạch ngang hoặc gạch dưới.");
    }

    nextBioPayload.username = username;
    nextBioPayload.usernameLower = usernameLower;
    nextUsername = usernameLower;

    const usernameSnap = await getDoc(doc(db, "usernames", usernameLower));
    if (usernameSnap.exists() && usernameSnap.data().uid !== uid) {
      throw new Error("Username này đang được tài khoản khác dùng.");
    }
  }

  await setDoc(bioRef, nextBioPayload, { merge: true });

  const nextUserPayload = {
    updatedAt: serverTimestamp()
  };

  if (Object.prototype.hasOwnProperty.call(payload, "displayName")) {
    nextUserPayload.displayName = payload.displayName ?? "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "username")) {
    nextUserPayload.username = nextUsername;
    nextUserPayload.usernameLower = nextUsername;
  }

  await setDoc(doc(db, "users", uid), nextUserPayload, { merge: true });

  if (nextUsername) {
    await setDoc(
      doc(db, "usernames", nextUsername),
      {
        uid,
        username: nextUsername,
        visibility: payload.visibility ?? currentBio.visibility ?? "public",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  if (Object.prototype.hasOwnProperty.call(payload, "visibility") && !Object.prototype.hasOwnProperty.call(payload, "username")) {
    const currentUsername = currentBio.usernameLower || currentBio.username || "";
    if (currentUsername) {
      await setDoc(
        doc(db, "usernames", currentUsername),
        {
          uid,
          username: currentUsername,
          visibility: payload.visibility,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  }

  const previousUsername = currentBio.usernameLower || currentBio.username || "";
  if (previousUsername && nextUsername && previousUsername !== nextUsername) {
    await deleteDoc(doc(db, "usernames", previousUsername));
  }
}

export async function updateUserRecord(uid, payload) {
  ensureConfigured();
  const username = payload.username ?? "";
  const usernameLower = username ? normalizeUsername(username) : "";

  if (usernameLower) {
    const existing = await getPublicBioByUsername(usernameLower);
    if (existing && existing.uid !== uid) {
      throw new Error("Username này đang được tài khoản khác dùng.");
    }
  }

  await setDoc(
    doc(db, "users", uid),
    {
      ...payload,
      username,
      usernameLower,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getPublicBioByUsername(username) {
  ensureConfigured();
  const usernameLower = normalizeUsername(username);
  if (!usernameLower) {
    return null;
  }

  const handleSnap = await getDoc(doc(db, "usernames", usernameLower));
  if (!handleSnap.exists()) {
    return null;
  }

  const handle = handleSnap.data();
  const bioSnap = await getDoc(doc(db, "bios", handle.uid));
  if (!bioSnap.exists()) {
    return null;
  }

  return bioSnap.data();
}

export function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

async function isUsernameTaken(usernameLower) {
  if (!usernameLower) {
    return false;
  }

  const existing = await getDoc(doc(db, "usernames", usernameLower));
  return existing.exists();
}

function ensureConfigured() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error("Firebase chưa được cấu hình. Hãy cập nhật assets/js/firebase-config.js.");
  }
}
