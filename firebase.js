const firebaseConfig = {
  apiKey: "AIzaSyDKEp-XP1QDCvnAJjn_tGkvjg2nMveJdq8",
  authDomain: "rivals-bracket-eb713.firebaseapp.com",
  databaseURL: "https://rivals-bracket-eb713-default-rtdb.firebaseio.com",
  projectId: "rivals-bracket-eb713",
  storageBucket: "rivals-bracket-eb713.firebasestorage.app",
  messagingSenderId: "248737838095",
  appId: "1:248737838095:web:583b27b79021b8ac9c9f7a"
};

if (!firebase.apps.length) {

  firebase.initializeApp(firebaseConfig);

}

window.database = firebase.database();

window.auth = firebase.auth();

/*

  Keep these names available for your older page scripts

  that use database and auth directly.

*/

const database = window.database;

const auth = window.auth;
