import React from "react";
import ReactDOM from "react-dom/client";
import Game from "../app/game-client";
import "../app/ui.css";

if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) void registration.unregister();
  }).catch(() => {});
}
if ("caches" in window) {
  void caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("cronicas-da-guilda")).map(key => caches.delete(key)))).catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>,
);
