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
      // Em instalações antigas o Service Worker anterior já está ativo.
      // Espera o NOVO instalar todas as faixas, não mostra "offline pronto" cedo demais.
      navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(async registration=>{
        if(navigator.onLine)await registration.update();
        const candidate=registration.installing || registration.waiting;
        if(candidate && candidate.state!=="activated"){
          await new Promise<void>((resolve,reject)=>{
            const changed=()=>{
              if(candidate.state==="activated"){candidate.removeEventListener("statechange",changed);resolve();}
              else if(candidate.state==="redundant"){candidate.removeEventListener("statechange",changed);reject(new Error("Atualização offline interrompida"));}
            };
            candidate.addEventListener("statechange",changed);
            changed();
          });
        }
        await navigator.serviceWorker.ready;
        if(alive)setReady(true);
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
    {failed ? <span><WifiOff size={15}/> Não foi possível completar o download offline. Conecte ao Wi-Fi e reabra o jogo.</span> :
      ready ? <span><CheckCircle2 size={15}/> {online?"Jogo completo salvo · offline pronto":"Jogando sem internet"}</span> :
      <span>Baixando jogo e trilha completa… mantenha o Wi-Fi ligado.</span>}
    {!installed && offer && ready && <button onClick={()=>void install()}><Download size={14}/> Instalar</button>}
    {!installed && ready && !offer && <small>Chrome ⋮ → Adicionar à tela inicial</small>}
  </aside>;
}
