
import { useEffect, useState } from 'react'
export function usePWAInstall(){
  const [deferred,setDeferred]=useState<any>(null)
  const [canInstall,setCanInstall]=useState(false)
  useEffect(()=>{
    const h=(e:any)=>{e.preventDefault();setDeferred(e);setCanInstall(true)}
    window.addEventListener('beforeinstallprompt',h)
    return()=>window.removeEventListener('beforeinstallprompt',h)
  },[])
  const promptInstall=async()=>{ if(!deferred) return; deferred.prompt(); await deferred.userChoice; setDeferred(null); setCanInstall(false) }
  return {canInstall,promptInstall}
}
