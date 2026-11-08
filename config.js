/* FastWeek: indstillinger.
   Indsæt dine egne værdier fra Firebase (se README.md, del 1). Intet her er hemmeligt. */
window.UGEKURV_CONFIG = {
  firebase: {
    apiKey: "AIzaSyArfMA0qUaqRkwrdfserf28wr8xajFDJik",
    authDomain: "fastweek-f6d0f.firebaseapp.com",
    projectId: "fastweek-f6d0f",
    appId: "1:3280358977:web:fb5935f32b1b19d8b600c0"
  },
  /* Adressen på FastWeek-serveren, der læser kogebogsbilleder (Cloudflare Worker, se README.md "Billedlæsning").
     Tom = den enkle læser bruges. Adressen er ikke hemmelig; nøglen ligger kun på serveren. */
  aiProxy: "https://rough-sea-5acffastweek-ai.fredefrederik.workers.dev",
  /* Offentlig VAPID-nøgle til notifikationer. Valgfri, se README.md, del 3. */
  vapidPublicKey: "BGwmt0-W_8Vur-ZzghpM7Cf0idvGslRwX1qc1Mk-MWMhohLAFs-zwdLDXkyD8KFKZD05VSH2x-ErU9qXQJX9LWk"
};
