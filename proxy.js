import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1WnDm6XEtVNMFHFXDV9QCLVlJSo4-nrQ",
  authDomain: "wy-sequence-lngi.firebaseapp.com",
  databaseURL: "https://wy-sequence-lngi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wy-sequence-lngi",
  storageBucket: "wy-sequence-lngi.firebasestorage.app",
  messagingSenderId: "171132084225",
  appId: "1:171132084225:web:f3be5025ff1dad79d62000",
  measurementId: "G-TYVB29BNME"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

signInAnonymously(auth).catch((error) => {
  console.error("Anonymous sign-in failed:", error);
});

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const userRef = ref(db, "online/" + user.uid);
  const connectedRef = ref(db, ".info/connected");

  onValue(connectedRef, (snap) => {
    if (snap.val()) {
      set(userRef, true);
      onDisconnect(userRef).remove();
    }
  });
});

const onlineRef = ref(db, "online");

onValue(onlineRef, (snapshot) => {
  const data = snapshot.val() || {};
  const count = Object.keys(data).length;

  const onlineDiv = document.getElementById("online");
  if (onlineDiv) {
    onlineDiv.textContent = `🟢 ${count} user${count === 1 ? "" : "s"} online`;
  }
});
