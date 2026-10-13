import { useEffect, useState } from "react";
import { CheckCircle2, Download, WifiOff } from "lucide-react";

type InstallOffer = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome:"accepted"|"dismissed"}>;
};

export default function OfflineInstall() {
  const [ready,setReady] = useState(false);
  const [failed,setFailed] = useState(false);
  const [offer,setOffer] = useState<InstallOffer|null>(null);
  const [installed,setInstalled] = useState(false);
  const [online,setOnline] = useState(navigator.onLine);

  useEffect(() => {
    let alive=true;
    const updateConnectivity=()=>setOnline(navigator.onLine);
    const onInstallOffer=(event:Event)=>{
      event.preventDefault();
      if(alive)setOffer(event as InstallOffer);
    };
    const onInstalled=()=>{setInstalled(true);setOffer(null);};
    const standalone=window.matchMedia("(display-mode: standalone)").matches;
    if(standalone)setInstalled(true);
    window.addEventListener("online",updateConnectivity);
    window.addEventListener("offline",updateConnectivity);
    window.addEventListener("beforeinstallprompt",onInstallOffer);
    window.addEventListener("appinstalled",onInstalled);
    if("serviceWorker" in navigator){
      // ready só resolve após o Service Worker baixar o jogo e todas as artes.
      navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(async registration=>{
        await navigator.serviceWorker.ready;
        if(alive)setReady(true);
        if(navigator.onLine)void registration.update().catch(()=>{});
      }).catch(()=>{if(alive)setFailed(true);});
    }else setFailed(true);
    return ()=>{
      alive=false;
      window.removeEventListener("online",updateConnectivity);
      window.removeEventListener("offline",updateConnectivity);
      window.removeEventListener("beforeinstallprompt",onInstallOffer);
      window.removeEventListener("appinstalled",onInstalled);
    };
  },[]);

  const install=async()=>{
    if(!offer)return;
    try {
      await offer.prompt();
      const choice=await offer.userChoice;
      setOffer(null);
      if(choice.outcome==="accepted")setInstalled(true);
    }catch {setOffer(null);}
  };
  return <aside className="offline-mobile-bar" aria-live="polite">
    {failed ? <span><WifiOff size={15}/> Para instalar offline, abra no Chrome.</span> :
      ready ? <span><CheckCircle2 size={15}/> {online?"Jogo completo salvo · offline pronto":"Jogando sem internet"}</span> :
      <span>Preparando modo offline… mantenha a internet ligada.</span>}
    {!installed && offer && ready && <button onClick={()=>void install()}><Download size={14}/> Instalar</button>}
    {!installed && ready && !offer && <small>Chrome ⋮ → Adicionar à tela inicial</small>}
  </aside>;
}
