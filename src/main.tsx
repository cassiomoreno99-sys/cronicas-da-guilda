import React from "react";
import ReactDOM from "react-dom/client";
import Game from "../app/game-client";
import "../app/ui.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>,
);
