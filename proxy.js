import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsBKRwzPo-Kn52o4m_AEzZK5zbu5NTx2M",
  authDomain: "wy-lngi.firebaseapp.com",
  databaseURL: "https://wy-lngi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wy-lngi",
  storageBucket: "wy-lngi.firebasestorage.app",
  messagingSenderId: "912532176065",
  appId: "1:912532176065:web:262019e355d2dc1e18e840",
  measurementId: "G-LDRNDTDVKG"
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
    if (snap.val() === true) {
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
