
import { useState, useEffect, useMemo } from 'react'
import { Home, Users, Receipt, Scale, Download, X, Plus, User, LogOut, PieChart, Repeat, Check, Loader2, Trash2, Camera, Share2, Link2, Copy, Image as ImageIcon } from 'lucide-react'
import { AuthProvider, useAuth } from './lib/auth'
import { usePWAInstall } from './lib/usePWAInstall'
import { supabase } from './lib/supabase'

type TabKey = 'dashboard' | 'gruppi' | 'spese' | 'saldi' | 'installa'
type SplitType = 'equal' | 'percent' | 'shares'
type Category = 'spesa' | 'affitto' | 'bollette' | 'pulizie' | 'trasporti' | 'svago' | 'altro'
const CATS: any = { spesa:{label:'Spesa',emoji:'🛒'}, affitto:{label:'Affitto',emoji:'🏠'}, bollette:{label:'Bollette',emoji:'💡'}, pulizie:{label:'Pulizie',emoji:'🧹'}, trasporti:{label:'Trasporti',emoji:'🚗'}, svago:{label:'Svago',emoji:'🍻'}, altro:{label:'Altro',emoji:'📦'} }
const TABS = [{key:'dashboard',label:'Home',icon:Home},{key:'gruppi',label:'Gruppi',icon:Users},{key:'spese',label:'Spese',icon:Receipt},{key:'saldi',label:'Saldi',icon:Scale},{key:'installa',label:'Installa',icon:Download}] as any

function AuthScreen(){
  const { signIn, signUp } = useAuth()
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [mode,setMode]=useState<'in'|'up'>('in'); const [err,setErr]=useState(''); const [loading,setLoading]=useState(false)
  const submit=async()=>{ if(!email||!pass){ setErr('Inserisci email e password'); return } setLoading(true); setErr(''); const fn=mode==='in'?signIn:signUp; const { error } = await fn(email,pass); if(error) setErr(error.message); else if(mode==='up') setErr('✅ Controlla email per confermare, poi accedi'); setLoading(false) }
  return (<div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6"><div className="w-full max-w-sm bg-[#1c1f27] rounded-[24px] p-6 border border-[#2a2e3a]"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-xl bg-[#d4ff32] flex items-center justify-center font-black text-black text-xl">E</div><div><p className="font-black text-xl tracking-widest text-white">EQUO</p><p className="text-xs text-[#8a8f9e]">Siamo pari.</p></div></div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-3 text-white"/><input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="password" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-4 text-white"/>{err&&<p className="text-sm mb-3 p-3 rounded-xl bg-[#d4ff32]/20 text-[#d4ff32]">{err}</p>}<button onClick={submit} disabled={loading} className="w-full bg-[#d4ff32] text-black font-black rounded-xl py-3 mb-3 flex items-center justify-center gap-2">{loading&&<Loader2 size={16} className="animate-spin"/>}{mode==='in'?'Accedi':'Registrati'}</button><button onClick={()=>setMode(mode==='in'?'up':'in')} className="w-full text-[#8a8f9e] text-sm">{mode==='in'?'Non hai account? Registrati':'Hai già account? Accedi'}</button></div></div>)
}

function AppContent(){
  const { user, loading: authLoading, signOut } = useAuth()
  const [tab,setTab]=useState<TabKey>('dashboard')
  const { canInstall, promptInstall } = usePWAInstall()
  const [dismiss,setDismiss]=useState(false)
  const [groups,setGroups]=useState<any[]>([]); const [expenses,setExpenses]=useState<any[]>([]); const [activeGroup,setActiveGroup]=useState(''); const [cloudLoading,setCloudLoading]=useState(false); const [cloudStatus,setCloudStatus]=useState<'offline'|'sync'|'cloud'>('offline')
  const [showAdd,setShowAdd]=useState(false); const [showProfile,setShowProfile]=useState(false)
  const [showReceipt,setShowReceipt]=useState<any>(null)
  const [inviteCopied,setInviteCopied]=useState(false)
  const [deleteConfirm,setDeleteConfirm]=useState<string|null>(null)
  const [payments,setPayments]=useState<any[]>([])
  const [showPay,setShowPay]=useState(false)
  const [payForm,setPayForm]=useState({from:'',to:'',amount:'',note:''})
  const [recurringInfo,setRecurringInfo]=useState<string>('')
  const [form,setForm]=useState({description:'',amount:'',paidBy:'',category:'spesa' as Category,splitType:'equal' as SplitType,percents:{} as any,shares:{} as any,recurring:false,frequency:'monthly',receipt:'' as string, receiptName:'' as string})
  const hasSupabase = !!supabase

  useEffect(()=>{
    if(!user) return
    const load=async()=>{
      setCloudLoading(true)
      if(hasSupabase){
        try{
          const { data: gData } = await supabase.from('groups').select('*').eq('user_id', user.id).order('created_at')
          const { data: eData } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at',{ascending:false})
          if(gData && gData.length>0){ setGroups(gData.map((g:any)=>({id:g.id,name:g.name,members:g.members||['Tino']}))); setActiveGroup(gData[0].id) }
          else { const { data:newG } = await supabase.from('groups').insert({name:'Casa Cumiana',members:['Tino','Marco','Sara'],user_id:user.id}).select().single(); if(newG){ setGroups([{id:newG.id,name:newG.name,members:newG.members}]); setActiveGroup(newG.id) } }
          if(eData) setExpenses(eData.map((e:any)=>({id:e.id,groupId:e.group_id,description:e.description,amount:e.amount,paidBy:e.paid_by,category:e.category,splitType:e.split_type,splitData:e.split_data,date:e.created_at?.slice(0,10),recurring:e.is_recurring})))
          setCloudStatus('cloud')
        }catch(e){ setCloudStatus('offline') }
      }else{
        const lg=JSON.parse(localStorage.getItem('equo_groups')||'[]'); const le=JSON.parse(localStorage.getItem('equo_expenses')||'[]'); const lp=JSON.parse(localStorage.getItem('equo_payments')||'[]'); if(lg.length){ setGroups(lg); setActiveGroup(lg[0].id) } if(le.length) setExpenses(le); if(lp.length) setPayments(lp); setCloudStatus('offline')
      }
      setCloudLoading(false)
    }
    load()
  },[user])

  useEffect(()=>{ if(groups.length) localStorage.setItem('equo_groups',JSON.stringify(groups)) },[groups])
  useEffect(()=>{ if(expenses.length) localStorage.setItem('equo_expenses',JSON.stringify(expenses)) },[expenses])
  useEffect(()=>{ localStorage.setItem('equo_payments',JSON.stringify(payments)) },[payments])

  const currentGroup = groups.find(g=>g.id===activeGroup)||groups[0]
  const members: string[] = currentGroup?.members||[]
  useEffect(()=>{ if(members.length && !form.paidBy) setForm(f=>({...f,paidBy:members[0]})) },[members])
  const filtered = expenses.filter(e=>e.groupId===activeGroup)
  const balances = useMemo(()=>{ 
      const bal:Record<string,number>={}; 
      members.forEach(m=>bal[m]=0); 
      filtered.forEach(exp=>{ 
        const total=Number(exp.amount); let owed:Record<string,number>={}; 
        if(exp.splitType==='equal'||!exp.splitType){ const each=total/(members.length||1); members.forEach(m=>owed[m]=each) } 
        else if(exp.splitType==='percent'){ members.forEach(m=>owed[m]=total*(exp.splitData?.[m]||0)/100) } 
        else { const sum=Object.values((()=>{const d:any={}; Object.entries(exp.splitData||{}).forEach(([k,v])=>{ if(!k.startsWith('_')) d[k]=v }); return d})().reduce((a:any,b:any)=>a+Number(b||0),0) as number) as number ||1; members.forEach(m=>owed[m]=total*(Number((exp.splitData?.[m] as any)||0)/sum)) } 
        members.forEach(m=>{ if(m===exp.paidBy) bal[m]+=total-(owed[m]||0); else bal[m]-=(owed[m]||0) }) 
      }); 
      // Sottrai pagamenti: se A paga B, A sale, B scende (debito saldato)
      payments.filter(p=>p.groupId===activeGroup).forEach(p=>{
        if(bal[p.from]!==undefined) bal[p.from]+=Number(p.amount)
        if(bal[p.to]!==undefined) bal[p.to]-=Number(p.amount)
      })
      return bal 
    },[filtered,members,payments,activeGroup])
  const simplified = useMemo(()=>{ const cr=Object.entries(balances).filter(([,v])=>v>0.01).map(([k,v])=>({name:k,amount:v})).sort((a,b)=>b.amount-a.amount); const db=Object.entries(balances).filter(([,v])=>v<-0.01).map(([k,v])=>({name:k,amount:-v})).sort((a,b)=>b.amount-a.amount); const res:any[]=[]; let i=0,j=0; while(i<cr.length&&j<db.length){ const c=cr[i],d=db[j]; const amt=Math.min(c.amount,d.amount); if(amt>0.01) res.push({from:d.name,to:c.name,amount:amt}); c.amount-=amt; d.amount-=amt; if(c.amount<0.01) i++; if(d.amount<0.01) j++ } return res },[balances])
  const total=filtered.reduce((s,e)=>s+Number(e.amount),0)

  const addGroup=async()=>{ const name=prompt('Nome gruppo'); if(!name) return; const ms=prompt('Membri separati da virgola','Tino, Marco, Sara'); const arr=ms?ms.split(',').map(s=>s.trim()):['Tino']; if(hasSupabase&&user){ const { data } = await supabase.from('groups').insert({name,members:arr,user_id:user.id}).select().single(); if(data){ setGroups([...groups,{id:data.id,name:data.name,members:data.members}]); setActiveGroup(data.id) } } else { const id=Date.now().toString(); setGroups([...groups,{id,name,members:arr}]); setActiveGroup(id) } }
  const addExpense=async()=>{ if(!form.description||!form.amount) return; setCloudStatus('sync'); 
      const extraData:any = {}
      if(form.receipt) extraData._receipt = form.receipt
      if(form.receiptName) extraData._receiptName = form.receiptName
      const mergedSplit = form.splitType==='percent'?form.percents:form.splitType==='shares'?form.shares:{}
      Object.assign(mergedSplit, extraData)
      if(hasSupabase&&user){ 
        const { data } = await supabase.from('expenses').insert({description:form.description,amount:Number(form.amount),paid_by:form.paidBy,category:form.category,split_type:form.splitType,split_data:mergedSplit,group_id:activeGroup,user_id:user.id,is_recurring:form.recurring,frequency:form.frequency}).select().single(); 
        if(data) setExpenses([{id:data.id,groupId:data.group_id,description:data.description,amount:data.amount,paidBy:data.paid_by,category:data.category,splitType:data.split_type,splitData:data.split_data,date:data.created_at?.slice(0,10),recurring:data.is_recurring, receipt: data.split_data?._receipt, receiptName: data.split_data?._receiptName},...expenses]) 
      } else { 
        setExpenses([{id:Date.now().toString(),groupId:activeGroup,description:form.description,amount:Number(form.amount),paidBy:form.paidBy,category:form.category,splitType:form.splitType,splitData:mergedSplit,date:new Date().toISOString().slice(0,10),recurring:form.recurring, receipt: form.receipt, receiptName: form.receiptName},...expenses]) 
      } 
      setCloudStatus(hasSupabase?'cloud':'offline'); 
      setForm({description:'',amount:'',paidBy:members[0],category:'spesa',splitType:'equal',percents:{},shares:{},recurring:false,frequency:'monthly',receipt:'',receiptName:''}); 
      setShowAdd(false) }
  const deleteExpense=async(id:string)=>{
    if(hasSupabase&&user){ await supabase.from('expenses').delete().eq('id',id).eq('user_id',user.id) }
    setExpenses(expenses.filter(e=>e.id!==id))
    setDeleteConfirm(null)
  }
  const shareOnWhatsApp=()=>{
    if(simplified.length===0){ 
      const txt = `EQUO - ${currentGroup?.name}: Siamo pari! 🎉 Nessun debito.`
      window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,'_blank')
      return
    }
    let txt = `EQUO - ${currentGroup?.name} - Siamo pari.\n\n`
    txt += simplified.map((s:any)=>`• ${s.from} deve €${s.amount.toFixed(2)} a ${s.to}`).join('\n')
    txt += `\n\nTotale: €${total.toFixed(2)} - A testa: €${(total/(members.length||1)).toFixed(2)}`
    txt += `\n\n👉 equo-ten.vercel.app`
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,'_blank')
  }
  const addPayment=async()=>{
    if(!payForm.from||!payForm.to||!payForm.amount||payForm.from===payForm.to) return
    const amt = Number(payForm.amount)
    setCloudStatus('sync')
    if(hasSupabase&&user){
      const { data } = await supabase.from('expenses').insert({
        description: payForm.note||`Pagamento ${payForm.from} → ${payForm.to}`,
        amount: amt,
        paid_by: payForm.from,
        category: 'altro',
        split_type: 'equal',
        split_data: {_isPayment:true,_payFrom:payForm.from,_payTo:payForm.to},
        group_id: activeGroup,
        user_id: user.id
      }).select().single()
      if(data) setPayments([...payments,{id:data.id,groupId:data.group_id,from:payForm.from,to:payForm.to,amount:data.amount,date:data.created_at?.slice(0,10),note:payForm.note}])
    } else {
      setPayments([...payments,{id:Date.now().toString(),groupId:activeGroup,from:payForm.from,to:payForm.to,amount:amt,date:new Date().toISOString().slice(0,10),note:payForm.note}])
    }
    setCloudStatus(hasSupabase?'cloud':'offline')
    setPayForm({from:'',to:'',amount:'',note:''})
    setShowPay(false)
  }
  const deletePayment=async(id:string)=>{
    if(hasSupabase&&user){ await supabase.from('expenses').delete().eq('id',id).eq('user_id',user.id) }
    setPayments(payments.filter(p=>p.id!==id))
  }

  // Spese ricorrenti automatiche
  useEffect(()=>{
    if(!expenses.length) return
    const now = new Date()
    const toCreate:any[]=[]
    expenses.forEach(exp=>{
      if(!exp.recurring) return
      const lastDate = new Date(exp.date)
      let next = new Date(lastDate)
      if(exp.frequency==='weekly') next.setDate(lastDate.getDate()+7)
      else if(exp.frequency==='yearly') next.setFullYear(lastDate.getFullYear()+1)
      else next.setMonth(lastDate.getMonth()+1) // monthly default
      if(next <= now){
        // evita duplicati: controlla se esiste già stessa descrizione stesso mese
        const exists = expenses.some(e=>e.description===exp.description && e.date.slice(0,7)===now.toISOString().slice(0,7) && e.id!==exp.id)
        if(!exists) toCreate.push({...exp, id: Date.now().toString()+Math.random().toString(), date: now.toISOString().slice(0,10)})
      }
    })
    if(toCreate.length){
      setRecurringInfo(`🔁 ${toCreate.length} spese ricorrenti create automaticamente!`)
      // salva
      toCreate.forEach(async (ne:any)=>{
        if(hasSupabase&&user){
          const { data } = await supabase.from('expenses').insert({
            description: ne.description,
            amount: ne.amount,
            paid_by: ne.paidBy,
            category: ne.category,
            split_type: ne.splitType,
            split_data: ne.splitData||{},
            group_id: ne.groupId,
            user_id: user.id,
            is_recurring: true,
            frequency: ne.frequency
          }).select().single()
          if(data) setExpenses(prev=>[{id:data.id,groupId:data.group_id,description:data.description,amount:data.amount,paidBy:data.paid_by,category:data.category,splitType:data.split_type,splitData:data.split_data,date:data.created_at?.slice(0,10),recurring:true,frequency:data.frequency},...prev])
        } else {
          setExpenses(prev=>[ne,...prev])
        }
      })
      setTimeout(()=>setRecurringInfo(''),4000)
    }
  },[expenses])

  const inviteLink = `https://equo-ten.vercel.app?invite=${activeGroup}`
  const copyInvite=()=>{
    navigator.clipboard.writeText(`Unisciti al mio gruppo EQUO "${currentGroup?.name}"! 👉 ${inviteLink}`)
    setInviteCopied(true)
    setTimeout(()=>setInviteCopied(false),2000)
  }
  const handleReceiptUpload=(e:any)=>{
    const file=e.target.files?.[0]
    if(!file) return
    if(file.size>2*1024*1024){ alert('Foto troppo grande, max 2MB'); return }
    const reader=new FileReader()
    reader.onload=(ev)=>{
      setForm({...form, receipt: ev.target?.result as string, receiptName: file.name})
    }
    reader.readAsDataURL(file)
  }

  if(authLoading||cloudLoading) return <div className="h-screen bg-[#0f1115] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#d4ff32] border-t-transparent rounded-full animate-spin"/></div>
  if(!user) return <AuthScreen/>

  return (<div className="flex flex-col h-screen bg-[#0f1115] max-w-md mx-auto"><div className="flex items-center justify-between px-5 pt-6 pb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#d4ff32] flex items-center justify-center font-black text-black">E</div><div><p className="font-black tracking-widest text-white">EQUO</p><p className="text-[10px] text-[#8a8f9e] -mt-1">Siamo pari.</p></div></div><div className="flex items-center gap-2"><div className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 ${cloudStatus==='cloud'?'bg-green-500/10 border-green-500/30':'bg-[#1c1f27] border-[#2a2e3a]'}`}><div className={`w-2 h-2 rounded-full ${cloudStatus==='cloud'?'bg-green-400 animate-pulse':'bg-[#8a8f9e]'}`}/><span className="text-[10px] text-[#c2c6d1]">{cloudStatus==='cloud'?'Cloud sync':cloudStatus==='sync'?'Sync...':'Offline'}</span></div><button onClick={()=>setShowProfile(true)} className="w-8 h-8 rounded-full bg-[#1c1f27] border border-[#2a2e3a] flex items-center justify-center"><User size={14} className="text-[#8a8f9e]"/></button></div></div>{canInstall&&!dismiss&&<div className="mx-4 mb-2 bg-[#d4ff32]/10 border border-[#d4ff32]/30 rounded-xl px-3 py-2.5 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#d4ff32]/20 flex items-center justify-center"><Download size={16} className="text-[#d4ff32]"/></div><div className="flex-1"><p className="text-xs font-bold text-white">Installa EQUO</p><p className="text-[10px] text-[#8a8f9e]">App vera in 1 tap</p></div><button onClick={promptInstall} className="bg-[#d4ff32] text-black text-xs font-bold px-3 py-1.5 rounded-lg">Installa</button><button onClick={()=>setDismiss(true)}><X size={14} className="text-[#8a8f9e]"/></button></div>}<div className="flex-1 overflow-y-auto px-5 pb-24">{tab==='dashboard'&&<div className="space-y-4 mt-2">{recurringInfo&&<div className="bg-[#d4ff32]/20 border border-[#d4ff32]/40 rounded-xl px-3 py-2 text-xs text-[#d4ff32] font-bold">{recurringInfo}</div>}<div className="bg-[#1c1f27] rounded-2xl p-4 border border-[#2a2e3a]"><p className="text-xs text-[#8a8f9e]">Totale {currentGroup?.name}</p><p className="text-3xl font-black text-white">€ {total.toFixed(2)}</p><div className="flex gap-2 mt-3"><div className="bg-[#15181f] rounded-xl px-3 py-2 flex-1"><p className="text-[10px] text-[#8a8f9e]">A testa</p><p className="text-sm font-bold text-white">€ {(total/(members.length||1)).toFixed(2)}</p></div><div className="bg-[#15181f] rounded-xl px-3 py-2 flex-1"><p className="text-[10px] text-[#8a8f9e]">Spese</p><p className="text-sm font-bold text-white">{filtered.length}</p></div></div></div><div className="space-y-2"><p className="text-sm font-bold text-white">Ultime</p>{filtered.slice(0,5).map(e=><div key={e.id} className="bg-[#1c1f27] rounded-xl px-4 py-3 flex justify-between border border-[#2a2e3a]"><div><p className="text-sm font-bold text-white">{CATS[e.category]?.emoji} {e.description}</p><p className="text-[11px] text-[#8a8f9e]">{e.paidBy} • {e.date}</p></div><p className="font-bold text-white">€ {Number(e.amount).toFixed(2)}</p></div>)}</div></div>}{tab==='gruppi'&&<div className="space-y-3 mt-2">
<div className="bg-[#1c1f27] rounded-2xl p-4 border border-[#2a2e3a]">
<p className="text-xs font-bold text-[#d4ff32] mb-2 flex items-center gap-1"><Link2 size={12}/> INVITA AMICI</p>
<p className="text-xs text-[#8a8f9e] mb-3">Condividi il link del gruppo {currentGroup?.name}</p>
<div className="flex gap-2"><div className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-3 py-2 text-[10px] text-[#8a8f9e] truncate">{`equo-ten.vercel.app?invite=${activeGroup}`}</div><button onClick={copyInvite} className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${inviteCopied?'bg-green-500 text-white':'bg-[#d4ff32] text-black'}`}>{inviteCopied?<><Check size={12}/> Copiato!</>:<><Copy size={12}/> Copia</>}</button></div>
<button onClick={()=>{ const msg=`Unisciti al mio gruppo EQUO "${currentGroup?.name}"! 👉 https://equo-ten.vercel.app?invite=${activeGroup}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank')}} className="w-full mt-2 bg-[#25D366] text-white font-bold rounded-xl py-2.5 text-xs flex items-center justify-center gap-2"><Share2 size={14}/> Invita su WhatsApp</button>
</div>
{groups.map(g=><button key={g.id} onClick={()=>setActiveGroup(g.id)} className={`w-full text-left bg-[#1c1f27] rounded-2xl p-4 border ${activeGroup===g.id?'border-[#d4ff32]':'border-[#2a2e3a]'}`}><div className="flex justify-between"><p className="font-bold text-white">{g.name}</p>{activeGroup===g.id&&<Check size={16} className="text-[#d4ff32]"/>}</div><div className="flex gap-1 mt-2">{g.members?.map((m:string)=><span key={m} className="w-7 h-7 rounded-full bg-[#d4ff32]/20 text-[#d4ff32] flex items-center justify-center text-[10px] font-bold">{m[0]}</span>)}</div></button>)}{/* */}<button onClick={addGroup} className="w-full border border-dashed border-[#2a2e3a] rounded-2xl py-3 text-[#8a8f9e] text-sm">+ Nuovo gruppo</button></div>}{tab==='spese'&&<div className="space-y-3 mt-2">
<button onClick={()=>setShowAdd(true)} className="w-full bg-[#d4ff32] text-black font-black rounded-xl py-3 flex items-center justify-center gap-2"><Plus size={16}/> Aggiungi spesa</button>
{filtered.map(e=><div key={e.id} className="relative group bg-[#1c1f27] rounded-xl p-4 border border-[#2a2e3a] overflow-hidden">
<div className="flex justify-between items-start"><div className="flex-1"><p className="font-bold text-white flex items-center gap-2">{CATS[e.category]?.emoji} {e.description} {(e as any).receipt||(e as any).splitData?._receipt?<button onClick={()=>setShowReceipt(e)} className="ml-1 bg-[#2a2e3a] p-1 rounded-lg"><ImageIcon size={12} className="text-[#d4ff32]"/></button>:null}</p><p className="text-xs text-[#8a8f9e] mt-1">{e.paidBy} • {e.splitType} • {e.date}</p></div><div className="flex items-center gap-2"><p className="font-bold text-white">€ {Number(e.amount).toFixed(2)}</p><button onClick={()=>setDeleteConfirm(e.id)} className="w-7 h-7 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center"><Trash2 size={14} className="text-red-400"/></button></div></div>
{deleteConfirm===e.id&&<div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-between"><span className="text-xs text-red-300">Eliminare?</span><div className="flex gap-2"><button onClick={()=>setDeleteConfirm(null)} className="px-3 py-1 rounded-lg bg-[#2a2e3a] text-xs text-white">Annulla</button><button onClick={()=>deleteExpense(e.id)} className="px-3 py-1 rounded-lg bg-red-500 text-xs text-white font-bold">Elimina</button></div></div>}
</div>)}
{filtered.length===0&&<p className="text-center text-[#8a8f9e] text-sm mt-8">Nessuna spesa. Tocca Aggiungi!</p>}
</div>}{tab==='saldi'&&<div className="space-y-4 mt-2">
<div className="bg-[#1c1f27] rounded-2xl p-4 border border-[#2a2e3a]">
<div className="flex justify-between items-center mb-3"><p className="font-bold text-white">Saldi</p><button onClick={shareOnWhatsApp} className="bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"><Share2 size={12}/> WhatsApp</button></div>{Object.entries(balances).map(([n,b]:any)=><div key={n} className="flex justify-between py-2 border-b border-[#2a2e3a] last:border-0"><span className="text-white">{n}</span><span className={`font-bold ${Number(b)>0?'text-[#d4ff32]':Number(b)<0?'text-red-400':'text-[#8a8f9e]'}`}>{Number(b)>0?'+':''}€ {Number(b).toFixed(2)}</span></div>)}</div><div className="bg-[#d4ff32] rounded-2xl p-4 text-black"><div className="flex justify-between items-center"><p className="font-black flex items-center gap-2"><Scale size={16}/> Semplifica debiti</p><button onClick={()=>{ if(members.length>=2){ setPayForm({from:simplified[0]?.from||members[0],to:simplified[0]?.to||members[1],amount:simplified[0]?.amount.toFixed(2)||'',note:''}); setShowPay(true)} else { setShowPay(true)} }} className="bg-black text-[#d4ff32] text-[10px] font-bold px-3 py-1.5 rounded-full">💸 Paga</button></div><div className="mt-3 space-y-2">{simplified.length===0?<p className="bg-black/10 rounded-xl px-3 py-2 text-sm font-bold">🎉 Siete EQUO!</p>:simplified.map((s:any,i:number)=><button key={i} onClick={()=>{ setPayForm({from:s.from,to:s.to,amount:s.amount.toFixed(2),note:`Saldo ${s.from} → ${s.to}`}); setShowPay(true)}} className="w-full bg-black/10 rounded-xl px-3 py-2 flex justify-between text-sm font-bold hover:bg-black/20 text-left"><span>{s.from} → {s.to}</span><span>€ {s.amount.toFixed(2)} • Paga</span></button>)}</div></div>
{payments.filter(p=>p.groupId===activeGroup).length>0&&<div className="bg-[#1c1f27] rounded-2xl p-4 border border-[#2a2e3a]"><p className="font-bold text-white text-sm mb-2">Pagamenti registrati</p><div className="space-y-2">{payments.filter(p=>p.groupId===activeGroup).map((p:any)=><div key={p.id} className="bg-[#15181f] rounded-xl px-3 py-2 flex justify-between items-center border border-[#2a2e3a]"><span className="text-xs text-white">💸 {p.from} → {p.to} • €{Number(p.amount).toFixed(2)} • {p.date}</span><button onClick={()=>deletePayment(p.id)}><Trash2 size={12} className="text-red-400"/></button></div>)}</div></div>}
</div>}{tab==='installa'&&<div className="space-y-4 mt-2">
<div className="bg-[#1c1f27] rounded-2xl p-5 border border-[#2a2e3a] text-center">
<div className="w-16 h-16 rounded-2xl bg-[#d4ff32] mx-auto flex items-center justify-center font-black text-black text-2xl mb-3">E</div>
<p className="font-black text-white text-lg">EQUO</p>
<p className="text-sm text-[#8a8f9e] mb-1">Siamo pari.</p>
<p className="text-[11px] text-[#d4ff32] mb-4">v2.0 Cloud • equo-ten.vercel.app</p>
{canInstall?<button onClick={promptInstall} className="w-full bg-[#d4ff32] text-black font-black rounded-xl py-3.5 text-base">⬇️ Installa App Ora</button>:
<div className="space-y-3 text-left">
  <div className="bg-[#15181f] rounded-xl p-4 border border-[#2a2e3a]">
    <p className="font-bold text-white text-sm mb-3 flex items-center gap-2">🍎 iPhone (Safari)</p>
    <ol className="space-y-2 text-xs text-[#c2c6d1]">
      <li className="flex gap-2"><span className="bg-[#d4ff32] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">1</span>Apri <b className="text-white">equo-ten.vercel.app</b> in Safari</li>
      <li className="flex gap-2"><span className="bg-[#d4ff32] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">2</span>Tocca <span className="bg-[#2a2e3a] px-1.5 py-0.5 rounded text-white">⎙ Condividi</span> in basso</li>
      <li className="flex gap-2"><span className="bg-[#d4ff32] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">3</span>Tocca <b className="text-white">Aggiungi a Home</b> → Aggiungi</li>
    </ol>
  </div>
  <div className="bg-[#15181f] rounded-xl p-4 border border-[#2a2e3a]">
    <p className="font-bold text-white text-sm mb-3 flex items-center gap-2">🤖 Android (Chrome)</p>
    <ol className="space-y-2 text-xs text-[#c2c6d1]">
      <li className="flex gap-2"><span className="bg-[#d4ff32] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">1</span>Apri <b className="text-white">equo-ten.vercel.app</b> in Chrome</li>
      <li className="flex gap-2"><span className="bg-[#d4ff32] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">2</span>Tocca <span className="bg-[#2a2e3a] px-1.5 py-0.5 rounded text-white">⋮ Menu</span> in alto a destra</li>
      <li className="flex gap-2"><span className="bg-[#d4ff32] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">3</span>Tocca <b className="text-white">Installa app</b> / Aggiungi a schermata Home</li>
    </ol>
  </div>
</div>
}
<p className="text-[11px] text-[#8a8f9e] mt-4">{hasSupabase?'✅ Cloud Sync attivo - i dati sono al sicuro':'⚠️ Offline'}</p>
</div>
<div className="bg-[#d4ff32]/10 border border-[#d4ff32]/30 rounded-2xl p-4">
<p className="text-xs font-bold text-[#d4ff32] mb-1">Perché installare?</p>
<p className="text-[11px] text-[#c2c6d1] leading-relaxed">App vera, si apre come WhatsApp, funziona offline, notifiche future, niente più link. Come MotoGarage, ma per le spese di casa.</p>
</div>
</div>}</div><nav className="flex-shrink-0 bg-[#15181f] border-t border-[#2a2e3a]"><div className="flex">{TABS.map((t:any)=>{ const Icon=t.icon; const active=tab===t.key; return <button key={t.key} onClick={()=>setTab(t.key)} className={`flex-1 flex flex-col items-center py-3 gap-1 ${active?'text-[#d4ff32]':'text-[#8a8f9e]'}`}><Icon size={22} strokeWidth={active?2.5:2}/><span className="text-[10px]">{t.label}</span></button> })}</div></nav>{showPay&&<div className="fixed inset-0 z-[60] flex items-end justify-center max-w-md mx-auto"><div className="absolute inset-0 bg-black/60" onClick={()=>setShowPay(false)}/><div className="relative w-full bg-[#1c1f27] rounded-t-3xl p-5 border-t border-[#2a2e3a]"><p className="font-bold text-lg mb-4 text-white">💸 Registra Pagamento</p><div className="flex gap-2 mb-3"><select value={payForm.from} onChange={e=>setPayForm({...payForm,from:e.target.value})} className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-3 py-3 text-white text-sm"><option value="">Chi paga?</option>{members.map(m=><option key={m} value={m}>{m}</option>)}</select><span className="flex items-center text-white">→</span><select value={payForm.to} onChange={e=>setPayForm({...payForm,to:e.target.value})} className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-3 py-3 text-white text-sm"><option value="">A chi?</option>{members.map(m=><option key={m} value={m}>{m}</option>)}</select></div><input value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} type="number" placeholder="€ Importo" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-3 text-white"/><input value={payForm.note} onChange={e=>setPayForm({...payForm,note:e.target.value})} placeholder="Nota (opzionale)" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-4 text-white"/><div className="flex gap-2"><button onClick={()=>setShowPay(false)} className="flex-1 bg-[#2a2e3a] text-white font-bold rounded-xl py-3">Annulla</button><button onClick={addPayment} className="flex-1 bg-[#d4ff32] text-black font-black rounded-xl py-3">Registra Pagamento</button></div></div></div>}
{showReceipt&&<div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/80" onClick={()=>setShowReceipt(null)}/><div className="relative bg-[#1c1f27] rounded-2xl p-4 max-w-sm w-full border border-[#2a2e3a]"><div className="flex justify-between items-center mb-3"><p className="font-bold text-white text-sm">{showReceipt.description} - Scontrino</p><button onClick={()=>setShowReceipt(null)} className="w-8 h-8 rounded-full bg-[#15181f] flex items-center justify-center"><X size={14} className="text-white"/></button></div><img src={(showReceipt as any).receipt || (showReceipt as any).splitData?._receipt} className="w-full rounded-xl"/><p className="text-xs text-[#8a8f9e] mt-2">€ {Number(showReceipt.amount).toFixed(2)} - {showReceipt.paidBy}</p></div></div>}
{showAdd&&<div className="fixed inset-0 z-50 flex items-end justify-center max-w-md mx-auto"><div className="absolute inset-0 bg-black/60" onClick={()=>setShowAdd(false)}/><div className="relative w-full bg-[#1c1f27] rounded-t-3xl p-5 border-t border-[#2a2e3a] max-h-[85vh] overflow-y-auto"><p className="font-bold text-lg mb-4 text-white flex items-center justify-between">Nuova spesa - Cloud {form.receipt&&<span className="text-[10px] bg-[#d4ff32] text-black px-2 py-1 rounded-full flex items-center gap-1"><Camera size={10}/> Foto ok</span>}</p>
<div className="mb-3">
<label className="w-full bg-[#15181f] border border-dashed border-[#2a2e3a] rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-[#8a8f9e] text-sm cursor-pointer hover:border-[#d4ff32]/50">
<Camera size={16}/> {form.receiptName||'Allega foto scontrino (opzionale)'}
<input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceiptUpload}/>
</label>
{form.receipt&&<div className="mt-2 flex gap-2"><img src={form.receipt} className="w-16 h-16 rounded-xl object-cover border border-[#2a2e3a]"/><button onClick={()=>setForm({...form,receipt:'',receiptName:''})} className="text-xs text-red-400">Rimuovi foto</button></div>}
</div><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Descrizione" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-3 text-white"/><div className="flex gap-2 mb-3"><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} type="number" placeholder="€" className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 text-white"/><select value={form.paidBy} onChange={e=>setForm({...form,paidBy:e.target.value})} className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-3 py-3 text-white">{members.map(m=><option key={m} value={m}>{m}</option>)}</select></div><div className="flex gap-2 mb-3">{Object.entries(CATS).map(([k,v]:any)=><button key={k} onClick={()=>setForm({...form,category:k as any})} className={`px-2.5 py-2 rounded-xl text-xs border ${form.category===k?'bg-[#d4ff32] text-black':'bg-[#15181f] border-[#2a2e3a] text-white'}`}>{v.emoji}</button>)}</div><div className="flex gap-2 mb-3">{(['equal','percent','shares'] as SplitType[]).map(s=><button key={s} onClick={()=>setForm({...form,splitType:s})} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${form.splitType===s?'bg-[#d4ff32] text-black':'bg-[#15181f] border-[#2a2e3a] text-[#8a8f9e]'}`}>{s==='equal'?'Equo':s==='percent'?'%':'Quote'}</button>)}</div><div className="flex items-center gap-2 mb-3 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-3 py-2"><label className="flex items-center gap-2 text-xs text-white flex-1"><input type="checkbox" checked={form.recurring} onChange={e=>setForm({...form,recurring:e.target.checked})} className="accent-[#d4ff32]"/> 🔁 Spesa ricorrente</label>{form.recurring&&<select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})} className="bg-[#2a2e3a] rounded-lg px-2 py-1 text-xs text-white"><option value="weekly">Settimanale</option><option value="monthly">Mensile</option><option value="yearly">Annuale</option></select>}</div>
{form.splitType==='percent'&&members.map((m:string)=><div key={m} className="flex items-center gap-2 mb-2 text-white"><span className="w-12 text-xs">{m}</span><input type="number" value={form.percents[m]||0} onChange={e=>setForm({...form,percents:{...form.percents,[m]:Number(e.target.value)}})} className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-lg px-2 py-2 text-xs"/><span className="text-xs">%</span></div>)}{form.splitType==='shares'&&members.map((m:string)=><div key={m} className="flex items-center gap-2 mb-2 text-white"><span className="w-12 text-xs">{m}</span><input type="number" value={form.shares[m]||1} onChange={e=>setForm({...form,shares:{...form.shares,[m]:Number(e.target.value)}})} className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-lg px-2 py-2 text-xs"/><span className="text-xs">quote</span></div>)}<label className="flex items-center gap-2 mt-3 mb-4 text-xs text-white"><input type="checkbox" checked={form.recurring} onChange={e=>setForm({...form,recurring:e.target.checked})}/> Ricorrente</label><button onClick={addExpense} className="w-full bg-[#d4ff32] text-black font-black rounded-xl py-3">Salva in Cloud</button></div></div>}{showProfile&&<div className="fixed inset-0 z-[80] flex items-end justify-center max-w-md mx-auto"><div className="absolute inset-0 bg-black/60" onClick={()=>setShowProfile(false)}/><div className="relative w-full bg-[#1c1f27] rounded-t-3xl p-5 border-t border-[#2a2e3a]"><p className="font-bold text-white">{user?.email}</p><p className="text-xs text-[#8a8f9e] mb-4">{hasSupabase?'✅ Cloud Sync attivo come MotoGarage':'Offline'}</p><button onClick={()=>{setShowProfile(false);signOut()}} className="w-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl py-3 flex items-center justify-center gap-2"><LogOut size={16}/> Esci</button></div></div>}</div>)
}
export default function App(){ return <AuthProvider><AppContent/></AuthProvider> }
