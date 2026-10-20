import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import DuelScene from "./DuelScene";

const root=document.getElementById("duel-lab-root");
if(!root)throw new Error("Laboratório isolado sem ponto de montagem.");
createRoot(root).render(<StrictMode><DuelScene/></StrictMode>);
