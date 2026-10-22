
import { useState, useEffect, useMemo } from 'react'
import { Home, Users, Receipt, Scale, Download, X, Plus, User, LogOut, Check, Loader2, Trash2, Camera, Share2, Link2, Copy, Image as ImageIcon } from 'lucide-react'
import { AuthProvider, useAuth } from './lib/auth'
import { usePWAInstall } from './lib/usePWAInstall'

type TabKey = 'dashboard' | 'gruppi' | 'spese' | 'saldi' | 'installa'
type SplitType = 'equal' | 'percent' | 'shares'
type Category = 'spesa' | 'affitto' | 'bollette' | 'pulizie' | 'trasporti' | 'svago' | 'altro'
const CATS: any = { spesa:{label:'Spesa',emoji:'🛒'}, affitto:{label:'Affitto',emoji:'🏠'}, bollette:{label:'Bollette',emoji:'💡'}, pulizie:{label:'Pulizie',emoji:'🧹'}, trasporti:{label:'Trasporti',emoji:'🚗'}, svago:{label:'Svago',emoji:'🍻'}, altro:{label:'Altro',emoji:'📦'} }
const TABS = [{key:'dashboard',label:'Home',icon:Home},{key:'gruppi',label:'Gruppi',icon:Users},{key:'spese',label:'Spese',icon:Receipt},{key:'saldi',label:'Saldi',icon:Scale},{key:'installa',label:'Installa',icon:Download}] as any

function AuthScreen(){
  const { signIn, signUp } = useAuth()
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [mode,setMode]=useState<'in'|'up'>('in'); const [err,setErr]=useState(''); const [loading,setLoading]=useState(false)
  const submit=async()=>{ if(!email||!pass){ setErr('Inserisci email e password'); return } setLoading(true); setErr(''); const fn=mode==='in'?signIn:signUp; const { error } = await fn(email,pass); if(error) setErr(error.message); else if(mode==='up') setErr('✅ Controlla email'); setLoading(false) }
  return (<div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-6"><div className="w-full max-w-sm bg-[#1c1f27] rounded-[24px] p-6 border border-[#2a2e3a]"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-xl bg-[#d4ff32] flex items-center justify-center font-black text-black text-xl">E</div><div><p className="font-black text-xl tracking-widest text-white">EQUO</p><p className="text-xs text-[#8a8f9e]">Siamo pari.</p></div></div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-3 text-white"/><input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="password" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-4 text-white"/>{err&&<p className="text-sm mb-3 p-3 rounded-xl bg-[#d4ff32]/20 text-[#d4ff32]">{err}</p>}<button onClick={submit} disabled={loading} className="w-full bg-[#d4ff32] text-black font-black rounded-xl py-3 mb-3 flex items-center justify-center gap-2">{loading&&<Loader2 size={16} className="animate-spin"/>}{mode==='in'?'Accedi':'Registrati'}</button><button onClick={()=>setMode(mode==='in'?'up':'in')} className="w-full text-[#8a8f9e] text-sm">{mode==='in'?'Non hai account? Registrati':'Hai già account? Accedi'}</button></div></div>)
}

function AppContent(){
  const { user, loading: authLoading, signOut } = useAuth()
  const [tab,setTab]=useState<TabKey>('dashboard')
  const { canInstall, promptInstall } = usePWAInstall()
  const [dismiss,setDismiss]=useState(false)
  const [groups,setGroups]=useState<any[]>([{id:'1',name:'Casa Cumiana',members:['Tino','Marco','Sara']}])
  const [expenses,setExpenses]=useState<any[]>([])
  const [activeGroup,setActiveGroup]=useState('1')
  const [showAdd,setShowAdd]=useState(false); const [showProfile,setShowProfile]=useState(false)
  const [showEditGroup,setShowEditGroup]=useState<any>(null)
  const [editGroupName,setEditGroupName]=useState('')
  const [editMembers,setEditMembers]=useState<string[]>([])
  const [newMemberName,setNewMemberName]=useState('')
  const [inviteCopied,setInviteCopied]=useState(false)
  const [form,setForm]=useState({description:'',amount:'',paidBy:'Tino',category:'spesa' as Category})

  useEffect(()=>{
    const lg=JSON.parse(localStorage.getItem('equo_groups')||'[]')
    if(lg.length){ setGroups(lg); setActiveGroup(lg[0].id) }
    const le=JSON.parse(localStorage.getItem('equo_expenses')||'[]')
    if(le.length) setExpenses(le)
  },[])
  useEffect(()=>{ localStorage.setItem('equo_groups',JSON.stringify(groups)) },[groups])
  useEffect(()=>{ localStorage.setItem('equo_expenses',JSON.stringify(expenses)) },[expenses])

  const currentGroup = groups.find(g=>g.id===activeGroup)||groups[0]
  const members: string[] = currentGroup?.members||['Tino']
  const filtered = expenses.filter(e=>e.groupId===activeGroup)
  const total = filtered.reduce((s,e)=>s+Number(e.amount),0)

  const openEditGroup=(g:any)=>{ setShowEditGroup(g); setEditGroupName(g.name); setEditMembers([...g.members]) }
  const saveEditGroup=()=>{ if(!editGroupName.trim()) return; const clean=editMembers.filter((m:string)=>m.trim()); setGroups(groups.map((x:any)=>x.id===showEditGroup.id?{id:x.id,name:editGroupName,members:clean}:x)); setShowEditGroup(null) }
  const deleteGroup=(id:string)=>{ if(!confirm('Eliminare gruppo?')) return; const rem=groups.filter((g:any)=>g.id!==id); setGroups(rem.length?rem:[{id:'1',name:'Casa Cumiana',members:['Tino']} ]); if(activeGroup===id) setActiveGroup(rem[0]?.id||'1'); setShowEditGroup(null) }
  const addMember=()=>{ if(!newMemberName.trim()) return; if(editMembers.includes(newMemberName.trim())) return; setEditMembers([...editMembers,newMemberName.trim()]); setNewMemberName('') }
  const removeMember=(name:string)=>{ if(editMembers.length<=1) return; setEditMembers(editMembers.filter((m:string)=>m!==name)) }
  const addGroup=()=>{ const name=prompt('Nome gruppo'); if(!name) return; const ms=prompt('Membri virgola','Tino, Marco'); const arr=ms?ms.split(',').map(s=>s.trim()):['Tino']; const id=Date.now().toString(); setGroups([...groups,{id,name,members:arr}]); setActiveGroup(id) }
  const addExpense=()=>{ if(!form.description||!form.amount) return; setExpenses([{id:Date.now().toString(),groupId:activeGroup,description:form.description,amount:Number(form.amount),paidBy:form.paidBy,category:form.category,date:new Date().toISOString().slice(0,10)},...expenses]); setForm({description:'',amount:'',paidBy:members[0],category:'spesa'}); setShowAdd(false) }

  const inviteLink = `https://equo-ten.vercel.app?invite=${activeGroup}`
  const copyInvite=()=>{ navigator.clipboard.writeText(`Unisciti al mio gruppo EQUO "${currentGroup?.name}"! 👉 ${inviteLink}`); setInviteCopied(true); setTimeout(()=>setInviteCopied(false),2000) }

  if(authLoading) return <div className="h-screen bg-[#0f1115] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#d4ff32] border-t-transparent rounded-full animate-spin"/></div>
  if(!user) return <AuthScreen/>

  return (<div className="flex flex-col h-screen bg-[#0f1115] max-w-md mx-auto"><div className="flex items-center justify-between px-5 pt-6 pb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#d4ff32] flex items-center justify-center font-black text-black">E</div><div><p className="font-black tracking-widest text-white">EQUO</p><p className="text-[10px] text-[#8a8f9e] -mt-1">Siamo pari. OFFLINE FIX</p></div></div><button onClick={()=>setShowProfile(true)} className="w-8 h-8 rounded-full bg-[#1c1f27] border border-[#2a2e3a] flex items-center justify-center"><User size={14} className="text-[#8a8f9e]"/></button></div>

<div className="flex-1 overflow-y-auto px-5 pb-24">{tab==='dashboard'&&<div className="space-y-4 mt-2"><div className="bg-[#1c1f27] rounded-2xl p-4 border border-[#2a2e3a]"><p className="text-xs text-[#8a8f9e]">Totale {currentGroup?.name}</p><p className="text-3xl font-black text-white">€ {total.toFixed(2)}</p></div></div>}

{tab==='gruppi'&&<div className="space-y-3 mt-2">
<div className="bg-[#1c1f27] rounded-2xl p-4 border border-[#d4ff32]/30">
<p className="text-xs font-bold text-[#d4ff32] mb-2 flex items-center gap-1"><Link2 size={12}/> INVITA AMICI - FIX</p>
<p className="text-xs text-[#8a8f9e] mb-3">Condividi {currentGroup?.name}</p>
<div className="flex gap-2"><div className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-3 py-2 text-[10px] text-[#8a8f9e] truncate">{inviteLink}</div><button onClick={copyInvite} className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${inviteCopied?'bg-green-500 text-white':'bg-[#d4ff32] text-black'}`}>{inviteCopied?<><Check size={12}/> Copiato!</>:<><Copy size={12}/> Copia</>}</button></div>
</div>
{groups.map((g:any)=><div key={g.id} className={`w-full bg-[#1c1f27] rounded-2xl p-4 border ${activeGroup===g.id?'border-[#d4ff32]':'border-[#2a2e3a]'} relative`}>
<div className="flex justify-between items-center"><button onClick={()=>setActiveGroup(g.id)} className="flex-1 text-left font-bold text-white">{g.name}</button><div className="flex items-center gap-2">{activeGroup===g.id&&<Check size={16} className="text-[#d4ff32]"/>}<button onClick={()=>openEditGroup(g)} className="w-8 h-8 rounded-full bg-[#2a2e3a] flex items-center justify-center hover:bg-[#3a3e4a]">✏️</button></div></div>
<div className="flex gap-1 mt-2 flex-wrap">{g.members?.map((m:string)=><span key={m} className="px-2 py-1 rounded-full bg-[#d4ff32]/20 text-[#d4ff32] text-[10px] font-bold">{m}</span>)}</div>
</div>)}
<button onClick={addGroup} className="w-full border border-dashed border-[#2a2e3a] rounded-2xl py-3 text-[#8a8f9e] text-sm">+ Nuovo gruppo</button>
</div>}

{tab==='spese'&&<div className="space-y-3 mt-2"><button onClick={()=>setShowAdd(true)} className="w-full bg-[#d4ff32] text-black font-black rounded-xl py-3 flex items-center justify-center gap-2"><Plus size={16}/> Aggiungi spesa</button>{filtered.map((e:any)=><div key={e.id} className="bg-[#1c1f27] rounded-xl p-4 border border-[#2a2e3a]"><div className="flex justify-between"><div><p className="font-bold text-white">{CATS[e.category]?.emoji} {e.description}</p><p className="text-xs text-[#8a8f9e]">{e.paidBy} • {e.date}</p></div><p className="font-bold text-white">€ {Number(e.amount).toFixed(2)}</p></div></div>)}</div>}

{tab==='installa'&&<div className="mt-2 bg-[#1c1f27] rounded-2xl p-5 border border-[#2a2e3a] text-center"><p className="font-black text-white">EQUO OFFLINE FIX</p><p className="text-xs text-[#8a8f9e]">Supabase in down, uso locale</p></div>}

</div><nav className="flex-shrink-0 bg-[#15181f] border-t border-[#2a2e3a]"><div className="flex">{TABS.map((t:any)=>{ const Icon=t.icon; const active=tab===t.key; return <button key={t.key} onClick={()=>setTab(t.key)} className={`flex-1 flex flex-col items-center py-3 gap-1 ${active?'text-[#d4ff32]':'text-[#8a8f9e]'}`}><Icon size={22} strokeWidth={active?2.5:2}/><span className="text-[10px]">{t.label}</span></button> })}</div></nav>

{showEditGroup&&<div className="fixed inset-0 z-[70] flex items-end justify-center max-w-md mx-auto"><div className="absolute inset-0 bg-black/60" onClick={()=>setShowEditGroup(null)}/><div className="relative w-full bg-[#1c1f27] rounded-t-3xl p-5 border-t border-[#2a2e3a]"><p className="font-bold text-lg mb-4 text-white">✏️ Modifica Gruppo</p><input value={editGroupName} onChange={e=>setEditGroupName(e.target.value)} className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-4 text-white"/><div className="space-y-2 mb-3">{editMembers.map((m:string)=><div key={m} className="flex items-center justify-between bg-[#15181f] border border-[#2a2e3a] rounded-xl px-3 py-2"><span className="text-sm text-white">{m}</span><button onClick={()=>removeMember(m)} className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"><X size={12} className="text-red-400"/></button></div>)}</div><div className="flex gap-2 mb-4"><input value={newMemberName} onChange={e=>setNewMemberName(e.target.value)} placeholder="Nuovo utente" className="flex-1 bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 text-white text-sm"/><button onClick={addMember} className="bg-[#d4ff32] text-black font-bold px-4 rounded-xl text-sm">+ Aggiungi</button></div><div className="flex gap-2 mb-3"><button onClick={()=>setShowEditGroup(null)} className="flex-1 bg-[#2a2e3a] text-white font-bold rounded-xl py-3">Annulla</button><button onClick={saveEditGroup} className="flex-1 bg-[#d4ff32] text-black font-black rounded-xl py-3">Salva</button></div><button onClick={()=>deleteGroup(showEditGroup.id)} className="w-full border border-red-500/30 text-red-400 font-bold rounded-xl py-3 text-sm">🗑 Elimina gruppo</button></div></div>}

{showAdd&&<div className="fixed inset-0 z-50 flex items-end justify-center max-w-md mx-auto"><div className="absolute inset-0 bg-black/60" onClick={()=>setShowAdd(false)}/><div className="relative w-full bg-[#1c1f27] rounded-t-3xl p-5 border-t border-[#2a2e3a]"><p className="font-bold text-lg mb-4 text-white">Nuova spesa</p><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Descrizione" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-3 text-white"/><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} type="number" placeholder="€" className="w-full bg-[#15181f] border border-[#2a2e3a] rounded-xl px-4 py-3 mb-3 text-white"/><button onClick={addExpense} className="w-full bg-[#d4ff32] text-black font-black rounded-xl py-3">Salva</button></div></div>}

{showProfile&&<div className="fixed inset-0 z-[80] flex items-end justify-center max-w-md mx-auto"><div className="absolute inset-0 bg-black/60" onClick={()=>setShowProfile(false)}/><div className="relative w-full bg-[#1c1f27] rounded-t-3xl p-5 border-t border-[#2a2e3a]"><p className="font-bold text-white">{user?.email}</p><button onClick={()=>{setShowProfile(false);signOut()}} className="w-full mt-4 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl py-3 flex items-center justify-center gap-2"><LogOut size={16}/> Esci</button></div></div>}

</div>)
}
export default function App(){ return <AuthProvider><AppContent/></AuthProvider> }
