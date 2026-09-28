(function(){
const T=window.TRIP,G=window.GEO;
const NS='http:'+'//www.w3.org/2000/svg';
const $=s=>document.querySelector(s);
const el=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);if(attrs)for(const k in attrs){if(attrs[k]!=null)e.setAttribute(k,attrs[k])}if(parent)parent.appendChild(e);return e};
const h=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

const M=G.main;
const P=(lat,lon)=>[(lon-M.lon0)*M.kx,(M.lat1-lat)*M.ky];
const C=G.corr;
const PC=(lat,lon)=>[(lon-C.lon0)*C.kx,(C.lat1-lat)*C.ky];

function smooth(pts,t=0.5){
  if(pts.length<2)return'';
  let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
    const c1=[p1[0]+(p2[0]-p0[0])*t/3,p1[1]+(p2[1]-p0[1])*t/3],c2=[p2[0]-(p3[0]-p1[0])*t/3,p2[1]-(p3[1]-p1[1])*t/3];
    d+=`C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function wobble(pts,amp,seed){const r=rng(seed);const out=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];out.push(a);const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/26));for(let k=1;k<n;k++){const f=k/n,dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,o=(r()-.5)*2*amp;out.push([a[0]+dx*f-dy/L*o,a[1]+dy*f+dx/L*o])}}out.push(pts[pts.length-1]);return out}
function parsePath(d){return d.split('M').filter(Boolean).map(s=>s.replace('Z','').split('L').map(p=>p.split(',').map(Number)))}
function inPoly(x,y,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[a,b]=poly[i],[e,f]=poly[j];if(((b>y)!=(f>y))&&(x<(e-a)*(y-b)/(f-b)+a))c=!c}return c}

const ICON={
 stay:`<path d="M-15 9 L0 -13 L15 9 Z" fill="#F1BF2C" stroke="#3A281B" stroke-width="1.6" stroke-linejoin="round"/><path d="M-4 9 L0 -2 L4 9 Z" fill="#3A281B"/><path d="M0 -13 L0 -17" stroke="#3A281B" stroke-width="1.6"/><path d="M-18 9 H18" stroke="#3A281B" stroke-width="1.6" stroke-linecap="round"/>`,
 view:`<circle r="11" fill="#FFFEFA" stroke="#3A281B" stroke-width="1.6"/><path d="M-6 4 L4 -5 M2 -7 L7 -2" stroke="#3A281B" stroke-width="3" stroke-linecap="round"/><path d="M-2 1 L-6 7 M-2 1 L1 7" stroke="#3A281B" stroke-width="1.3"/>`,
 peak:`<rect x="-12" y="-9" width="24" height="7" rx="1" fill="#F1BF2C" stroke="#3A281B" stroke-width="1.6"/><path d="M-9 -2 V9 M9 -2 V9" stroke="#3A281B" stroke-width="2.2" stroke-linecap="round"/>`,
 water:`<circle r="11" fill="#FFFEFA" stroke="#3F86B4" stroke-width="1.8"/><path d="M-4 -6 V3 M0 -6 V6 M4 -6 V3" stroke="#3F86B4" stroke-width="1.8" stroke-linecap="round"/><path d="M-6 6 Q0 10 6 6" fill="none" stroke="#3F86B4" stroke-width="1.6"/>`,
 lake:`<ellipse rx="13" ry="8" fill="#3F86B4" stroke="#2B5F82" stroke-width="1.3"/><path d="M-7 -1 Q-3 -3 1 -1 M-1 3 Q3 1 7 3" stroke="#BFD9E8" stroke-width="1.3" fill="none"/>`,
 temple:`<path d="M-10 9 V-1 L0 -10 L10 -1 V9 Z" fill="#FFFEFA" stroke="#3A281B" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -10 V-15" stroke="#8C3A22" stroke-width="1.6"/><path d="M0 -15 L5 -13 L0 -11" fill="#8C3A22"/><rect x="-3" y="2" width="6" height="7" fill="#3A281B"/>`,
 wild:`<circle r="11" fill="#FFFEFA" stroke="#557F4A" stroke-width="1.8"/><ellipse cy="3" rx="4.5" ry="3.6" fill="#557F4A"/><circle cx="-5.5" cy="-2.5" r="1.9" fill="#557F4A"/><circle cx="-2" cy="-6" r="1.9" fill="#557F4A"/><circle cx="2" cy="-6" r="1.9" fill="#557F4A"/><circle cx="5.5" cy="-2.5" r="1.9" fill="#557F4A"/>`,
 cave:`<path d="M-12 9 Q-12 -10 0 -11 Q12 -10 12 9 Z" fill="#B9A58F" stroke="#3A281B" stroke-width="1.6"/><path d="M-5 9 Q-5 -2 0 -2 Q5 -2 5 9 Z" fill="#3A281B"/>`,
 food:`<circle r="11" fill="#FFFEFA" stroke="#8C3A22" stroke-width="1.8"/><path d="M-7 0 H7 Q6 7 0 7 Q-6 7 -7 0 Z" fill="#8C3A22"/><path d="M-3 -3 Q-1 -6 -3 -8 M2 -3 Q4 -6 2 -8" stroke="#8C3A22" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
 trek:`<circle r="11" fill="#FFFEFA" stroke="#3A281B" stroke-width="1.6"/><path d="M-7 6 L-2 -3 L1 2 L4 -2 L8 6 Z" fill="#8A7360" stroke="#3A281B" stroke-width="1.1" stroke-linejoin="round"/>`,
 heritage:`<circle r="11" fill="#FFFEFA" stroke="#3A281B" stroke-width="1.6"/><path d="M-7 6 H7 M-6 -3 H6 L0 -8 Z M-4 -3 V6 M0 -3 V6 M4 -3 V6" stroke="#3A281B" stroke-width="1.4" fill="none" stroke-linejoin="round"/>`,
 gate:`<rect x="-12" y="-4" width="24" height="7" fill="#FFFEFA" stroke="#8C3A22" stroke-width="1.6"/><path d="M-7 -4 L-3 3 M1 -4 L5 3" stroke="#8C3A22" stroke-width="2.4"/><path d="M-12 -4 V9" stroke="#3A281B" stroke-width="2"/>`,
 pin:`<path d="M0 12 C-2 6 -10 1 -10 -6 A10 10 0 1 1 10 -6 C10 1 2 6 0 12 Z" fill="#F1BF2C" stroke="#3A281B" stroke-width="1.6"/><circle cy="-6" r="3.6" fill="#3A281B"/>`
};
const KIND_LABEL={stay:'Stay',view:'Viewpoint',peak:'Summit',water:'Waterfall',lake:'Lake',temple:'Temple',wild:'Wildlife',cave:'Caves',food:'Food stop',trek:'Trek',heritage:'Heritage',gate:'Checkpost',pin:'Town'};
function iconSVG(kind,size=26){return `<svg class="ic" viewBox="-19 -19 38 38" width="${size}" height="${size}" aria-hidden="true">${ICON[kind]||ICON.view}</svg>`}

const PL=Object.assign({},T.places);
for(const k in T.stays)PL[k]=Object.assign({kind:'stay'},T.stays[k]);
const RN=T.roads.nodes;const RNP={};for(const k in RN)RNP[k]=P(RN[k][0],RN[k][1]);
const ADJ={};
T.roads.edges.forEach(([a,b,,via])=>{const pts=[RNP[a],...(via||[]).map(v=>P(v[0],v[1])),RNP[b]];let w=0;for(let i=1;i<pts.length;i++)w+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);(ADJ[a]=ADJ[a]||[]).push([b,w,pts]);(ADJ[b]=ADJ[b]||[]).push([a,w,pts.slice().reverse()])});
function nearestNode(lat,lon){let best=null,bd=1e9;const p=P(lat,lon);for(const k in RNP){const d=Math.hypot(RNP[k][0]-p[0],RNP[k][1]-p[1]);if(d<bd){bd=d;best=k}}return best}
function roadNode(slug){const p=PL[slug];return p.road||nearestNode(p.lat,p.lon)}
function dijkstra(a,b){if(a===b)return[RNP[a]];const dist={[a]:0},prev={},seen=new Set();const q=[a];while(q.length){q.sort((x,y)=>dist[x]-dist[y]);const u=q.shift();if(seen.has(u))continue;seen.add(u);if(u===b)break;for(const[v,w,pts]of ADJ[u]||[]){const nd=dist[u]+w;if(nd<(dist[v]??1e12)){dist[v]=nd;prev[v]=[u,pts];q.push(v)}}}
  if(!(b in prev))return[RNP[a],RNP[b]];const segs=[];let cur=b;while(cur!==a){const[u,pts]=prev[cur];segs.unshift(pts);cur=u}const out=[];segs.forEach((s,i)=>out.push(...(i?s.slice(1):s)));return out}
function ptOf(ref){if(RN[ref])return RNP[ref];const p=PL[ref];const q=P(p.lat,p.lon);return p.nudge?[q[0]+p.nudge[0],q[1]+p.nudge[1]]:q}
function routeBetween(a,b){const na=RN[a]?a:roadNode(a),nb=RN[b]?b:roadNode(b);const mid=dijkstra(na,nb);const out=[];if(!RN[a])out.push(ptOf(a));out.push(...mid);if(!RN[b])out.push(ptOf(b));return out.filter((p,i,arr)=>i===0||Math.hypot(p[0]-arr[i-1][0],p[1]-arr[i-1][1])>0.5)}

const svg=$('#map');
svg.setAttribute('viewBox',`0 0 ${M.W} ${M.H}`);
const defs=el('defs',null,svg);
defs.innerHTML=`
<filter id="wc" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="2.2"/></filter>
<filter id="wc2" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="1"/></filter>
<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.23  0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0.09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<clipPath id="wyclip"><path d="${G.wayanad}"/></clipPath>
<symbol id="oak" viewBox="-8 -9 16 16" overflow="visible"><path d="M-4 1 a3 3 0 0 1 1 -5 a3.4 3.4 0 0 1 6 0 a3 3 0 0 1 1 5 Z" fill="#8FB07A" stroke="#4E6F43" stroke-width=".8"/><path d="M0 1 V5" stroke="#5B4433" stroke-width="1"/></symbol>
<symbol id="oak2" viewBox="-8 -9 16 16" overflow="visible"><path d="M-4 1 a3 3 0 0 1 1 -5 a3.4 3.4 0 0 1 6 0 a3 3 0 0 1 1 5 Z" fill="#A8B879" stroke="#6C7340" stroke-width=".8"/><path d="M0 1 V5" stroke="#5B4433" stroke-width="1"/></symbol>
<symbol id="pine" viewBox="-6 -10 12 16" overflow="visible"><path d="M0 -9 L4.5 -1 H2 L5.5 4 H-5.5 L-2 -1 H-4.5 Z" fill="#2F6B3C" stroke="#1F4A29" stroke-width=".6"/><path d="M0 4 V6.5" stroke="#5B4433" stroke-width="1.1"/></symbol>
<symbol id="tea" viewBox="-10 -4 20 8" overflow="visible"><path d="M-9 1 Q-4.5 -3 0 1 Q4.5 -3 9 1" fill="none" stroke="#6E9A55" stroke-width="1.6" stroke-linecap="round"/></symbol>
`;
el('rect',{x:0,y:0,width:M.W,height:M.H,fill:'#FFFEFA'},svg);
const gBase=el('g',null,svg);
const stateCol={'Karnataka':'#F1EEE3','Tamil Nadu':'#F4EFE6','Kerala':'#F6F4EC'};
for(const s in G.main_states)el('path',{d:G.main_states[s],fill:stateCol[s]||'#F3F1E8',stroke:'#D8D1BE','stroke-width':1,'stroke-dasharray':'6 4'},gBase);
(T.terrain.forest||[]).filter(f=>f.out).forEach(f=>{const pts=f.poly.map(p=>P(p[0],p[1]));el('path',{d:smooth([...pts,pts[0],pts[1]],.6),fill:'#8DB07B',opacity:.35,filter:'url(#wc)'},gBase)});
el('path',{d:G.wayanad,fill:'#CFE0BF',filter:'url(#wc)',opacity:.95},gBase);
const gWash=el('g',{'clip-path':'url(#wyclip)'},gBase);
const wy=parsePath(G.wayanad)[0];
const r=rng(7);
const greens=['#9DBE86','#86A874','#B6CFA0','#7A9F69','#A9C592'];
for(let i=0;i<70;i++){let x,y,k=0;do{x=r()*M.W;y=r()*M.H;k++}while(!inPoly(x,y,wy)&&k<50);el('ellipse',{cx:x,cy:y,rx:30+r()*90,ry:20+r()*55,fill:greens[i%5],opacity:.22+r()*.3,filter:'url(#wc)',transform:`rotate(${(r()*60-30).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})`},gWash)}
(T.terrain.high||[]).forEach(t=>{const[x,y]=P(t.lat,t.lon);el('ellipse',{cx:x,cy:y,rx:t.rx,ry:t.ry,fill:'#CFCBC4',opacity:.75,filter:'url(#wc)',transform:`rotate(${t.rot||0} ${x} ${y})`},gWash)});
(T.terrain.forest||[]).filter(f=>!f.out).forEach(f=>{const pts=f.poly.map(p=>P(p[0],p[1]));el('path',{d:smooth([...pts,pts[0],pts[1]],.6),fill:'#5E8F52',opacity:.35,filter:'url(#wc)'},gWash)});
el('path',{d:G.wayanad,fill:'none',stroke:'#7E9C6C','stroke-width':1.4,'stroke-dasharray':'2 5',opacity:.9},gBase);
el('rect',{x:0,y:0,width:M.W,height:M.H,filter:'url(#grain)',fill:'#fff',opacity:.9},gBase);

const gW=el('g',null,svg);
(T.terrain.rivers||[]).forEach((rv,i)=>{const pts=wobble(rv.pts.map(p=>P(p[0],p[1])),2,30+i);el('path',{d:smooth(pts),fill:'none',stroke:'#7FB0D0','stroke-width':rv.w||2.2,'stroke-linecap':'round',opacity:.85},gW)});
(T.terrain.lakes||[]).forEach(lk=>{const pts=lk.poly.map(p=>P(p[0],p[1]));el('path',{d:smooth([...pts,pts[0],pts[1]],.8),fill:'#5C9CC4',stroke:'#3F7FA8','stroke-width':1,opacity:.9,filter:'url(#wc2)'},gW)});

const gR=el('g',null,svg);
T.roads.edges.forEach(([a,b,type,via],i)=>{const pts=wobble([RNP[a],...(via||[]).map(v=>P(v[0],v[1])),RNP[b]],1.2,100+i);const d=smooth(pts,.7);
  if(type==='nh'){el('path',{d,fill:'none',stroke:'#A9ADB1','stroke-width':6.5,'stroke-linecap':'round'},gR);el('path',{d,fill:'none',stroke:'#FFFFFF','stroke-width':1.3,'stroke-dasharray':'7 6'},gR)}
  else el('path',{d,fill:'none',stroke:'#BEC1C4','stroke-width':type==='track'?1.6:3,'stroke-dasharray':type==='track'?'3 3':null,'stroke-linecap':'round'},gR)});

const gT=el('g',null,svg);
const r2=rng(21);
(T.terrain.trees||[]).forEach(c=>{const[cx,cy]=P(c.lat,c.lon);for(let i=0;i<c.n;i++){const a=r2()*Math.PI*2,d=Math.sqrt(r2())*c.r;const x=cx+Math.cos(a)*d*1.3,y=cy+Math.sin(a)*d;if(!c.out&&!inPoly(x,y,wy))continue;const s=c.type==='tea'?14:c.type==='pine'?13:12;el('use',{href:'#'+c.type,x:x-s/2,y:y-s/2,width:s,height:s},gT)}});

const gMt=el('g',null,svg);
function mountains(g,x,y,w,hgt,n,seed,label,lx,ly,rot){const rr=rng(seed);const base=y;let d=`M${x-w/2},${base}`;const peaks=[];for(let i=0;i<n;i++){const px=x-w/2+w*(i+.5)/n+(rr()-.5)*w/n*.4,ph=hgt*(.55+rr()*.45)*(i===Math.floor(n/2)?1.1:1);peaks.push([px,base-ph])}
  let prev=[x-w/2,base];peaks.forEach((p,i)=>{const nx=i<n-1?(p[0]+peaks[i+1][0])/2:x+w/2,ny=i<n-1?base-hgt*(.18+rr()*.2):base;d+=`L${((prev[0]+p[0])/2).toFixed(1)},${(prev[1]*.6+p[1]*.4+2).toFixed(1)}L${p[0].toFixed(1)},${p[1].toFixed(1)}L${((p[0]+nx)/2+2).toFixed(1)},${((p[1]+ny)/2+1).toFixed(1)}L${nx.toFixed(1)},${ny.toFixed(1)}`;prev=[nx,ny]});
  d+='Z';const gg=el('g',{filter:'url(#rough)'},g);el('path',{d,fill:'#F7F3EA',stroke:'#5B4433','stroke-width':1.3,'stroke-linejoin':'round'},gg);
  peaks.forEach(p=>{for(let k=0;k<7;k++){const t=.15+k*.11;const sx=p[0]+(hgt*.5)*t*.9,sy=p[1]+hgt*.62*t;el('path',{d:`M${sx.toFixed(1)},${sy.toFixed(1)} l${(3+rr()*3).toFixed(1)},${(6+rr()*6).toFixed(1)}`,stroke:'#6D5543','stroke-width':.9,'stroke-linecap':'round'},gg)}el('path',{d:`M${p[0]},${p[1]} l-4,7 l3,-1 l2,5`,fill:'none',stroke:'#6D5543','stroke-width':.8},gg)});
  if(label){const X=lx??x-w/2,Y=ly??base-hgt-8;const t=el('text',{x:X,y:Y,class:'lbl-s halo-text',style:'font-weight:600;letter-spacing:.08em;font-size:11.5px',transform:rot?`rotate(${rot} ${X} ${Y})`:null},g);t.textContent=label}}
(T.terrain.mountains||[]).forEach((m,i)=>{const[x,y]=P(m.lat,m.lon);mountains(gMt,x,y,m.w,m.h,m.n,50+i,m.label,m.lx!=null?x+m.lx:null,m.ly!=null?y+m.ly:null,m.rot)});

const gL=el('g',null,svg);
(T.terrain.towns||[]).forEach(tw=>{const[x,y]=P(tw.lat,tw.lon);el('rect',{x:x-3,y:y-3,width:6,height:6,fill:'#5B4433',transform:`rotate(45 ${x} ${y})`},gL);const t=el('text',{x:x+(tw.dx??8),y:y+(tw.dy??-6),'text-anchor':tw.anchor||'start','font-family':'Oswald','font-size':10.5,'font-weight':500,'letter-spacing':'.14em',fill:'#7A6552',class:'halo-text town'},gL);t.textContent=tw.n.toUpperCase()});
(T.terrain.labels||[]).forEach(l=>{const[x,y]=l.xy?l.xy:P(l.lat,l.lon);const t=el('text',{x,y,'text-anchor':l.anchor||'middle',fill:l.color||'#8A7360','font-family':l.hand?'Kalam':'Oswald','font-size':l.size||13,'letter-spacing':l.hand?0:'.28em','font-weight':l.hand?300:500,opacity:l.op||.9,transform:l.rot?`rotate(${l.rot} ${x} ${y})`:null},gL);t.textContent=l.t});

const gFaint=el('g',null,svg);
const gRoute=el('g',null,svg);
const gNodes=el('g',null,svg);

let cur=0,curDay=null;
function stopsOf(it){const list=[];it.days.forEach((d,di)=>d.stops.forEach(s=>{if(s.p)list.push({...s,day:di})}));return list}

function drawRoute(anim){
  const it=T.itins[cur];gRoute.innerHTML='';gNodes.innerHTML='';gFaint.innerHTML='';
  svg.classList.toggle('anim',!!anim&&!reduce);
  const used=new Set(stopsOf(it).map(s=>s.p));
  for(const k in PL){if(used.has(k)||PL[k].kind==='stay'||PL[k].hideFaint)continue;const p=PL[k];const[x,y]=ptOf(k);const g=el('g',{class:'node',tabindex:0,role:'button','aria-label':p.name},gFaint);
    el('circle',{cx:x,cy:y,r:10,fill:'transparent'},g);el('circle',{cx:x,cy:y,r:3.6,fill:'#FFFEFA',stroke:'#8A7360','stroke-width':1.4},g);
    const fl=p.faint||{};const t=el('text',{x:x+(fl.dx??7),y:y+(fl.dy??4),'text-anchor':fl.anchor||'start','font-family':'Kalam','font-size':12.5,fill:'#6F5B49',class:'halo-text'},g);t.textContent=p.short||p.name;
    g.addEventListener('click',()=>openPop(k,null,g));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPop(k,null,g)}})}
  const seq=[];it.days.forEach((d,di)=>{d.stops.forEach(s=>{if(s.p||s.via)seq.push({ref:s.p||s.via,day:di})})});
  const dayPaths=it.days.map(()=>[]);
  for(let i=0;i<seq.length-1;i++){const a=seq[i],b=seq[i+1];if(a.ref===b.ref)continue;dayPaths[b.day].push(routeBetween(a.ref,b.ref))}
  dayPaths.forEach((segs,di)=>{const g=el('g',{class:'dayleg','data-day':di},gRoute);segs.forEach((pts,si)=>{const d=smooth(pts,.7);
      const glow=el('path',{d,fill:'none',stroke:'#F6E3A1','stroke-width':15,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.95,class:'glow'},g);
      el('path',{d,fill:'none',stroke:'#FFF6D1','stroke-width':7,'stroke-linecap':'round',opacity:.9},g);
      const dash=el('path',{d,fill:'none',stroke:'#3A281B','stroke-width':2.6,'stroke-dasharray':'9 6','stroke-linecap':'round'},g);
      const L=dash.getTotalLength();glow.style.setProperty('--len',L);glow.style.animationDelay=(di*.5+si*.12)+'s';
      if(L>70){const m=dash.getPointAtLength(L*.5),m2=dash.getPointAtLength(L*.5+2);const ang=Math.atan2(m2.y-m.y,m2.x-m.x)*180/Math.PI;el('path',{d:'M-5,-5 L3,0 L-5,5',fill:'none',stroke:'#3A281B','stroke-width':2.4,'stroke-linecap':'round','stroke-linejoin':'round',transform:`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) rotate(${ang.toFixed(0)})`},g)}
  })});
  (it.tags||T.tags||[]).forEach(tg=>{const[x,y]=tg.ref?ptOf(tg.ref):P(tg.lat,tg.lon);const w=tg.t.length*7.2+18;const g=el('g',{transform:`translate(${x+(tg.dx||0)-(tg.anchor==='end'?w:0)} ${y+(tg.dy||0)})`},gNodes);el('rect',{x:0,y:-11,width:w,height:22,fill:'#8C3A22',rx:1.5},g);el('rect',{x:2,y:-9,width:w-4,height:18,fill:'none',stroke:'#E7B59C','stroke-width':.8},g);const t=el('text',{x:w/2,y:4.5,'text-anchor':'middle','font-family':'Oswald','font-weight':600,'font-size':12,fill:'#FFF1E3','letter-spacing':'.04em'},g);t.textContent=tg.t});
  const first={},nights={};stopsOf(it).forEach(s=>{if(!first[s.p])first[s.p]=s;if(s.night)(nights[s.p]=nights[s.p]||[]).push(s.night)});
  Object.keys(first).forEach((k,i)=>{const s=first[k],p=PL[k];const[x,y]=ptOf(k);const lab=Object.assign({side:'r'},p.label||{},(it.labels||{})[k]||{});
    const isStay=p.kind==='stay';
    const g=el('g',{class:'node','data-day':isStay?'stay':s.day,tabindex:0,role:'button','aria-label':`${p.name}, day ${s.day+1}`},gNodes);
    const gi=el('g',{class:'node-in',style:`animation-delay:${(s.day*.5+.3+i*.04).toFixed(2)}s`},g);
    el('circle',{cx:x,cy:y,r:22,fill:'#F1BF2C',opacity:.35,class:'halo'},gi);
    const ic=el('g',{transform:`translate(${x} ${y}) scale(${isStay?1:.82})`},gi);ic.innerHTML=ICON[p.kind]||ICON.view;
    const ns=[...new Set(nights[k]||[])];
    const kline=isStay?`STAY · NIGHT${ns.length>1?'S':''} ${ns.join(' & ')}`:`DAY ${s.day+1} · ${s.t}`;
    const sub=lab.sub??p.sub??'';
    let tx=x,ty=y,anchor='start';const off=isStay?19:14;
    if(lab.side==='r'){tx=x+off;ty=y-4}else if(lab.side==='l'){tx=x-off;ty=y-4;anchor='end'}else if(lab.side==='t'){ty=y-(sub?46:34);anchor='middle'}else{ty=y+28;anchor='middle'}
    tx+=lab.dx||0;ty+=lab.dy||0;
    const t1=el('text',{x:tx,y:ty,'text-anchor':anchor,class:'lbl-k halo-text'},gi);t1.textContent=kline;
    const t2=el('text',{x:tx,y:ty+15,'text-anchor':anchor,class:'lbl-n halo-text',style:isStay?'font-size:17px':null},gi);t2.textContent=(p.short||p.name).toUpperCase();
    if(sub){const t3=el('text',{x:tx,y:ty+28,'text-anchor':anchor,class:'lbl-s halo-text'},gi);t3.textContent=sub}
    g.addEventListener('click',()=>openPop(k,s,g));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPop(k,s,g)}});
  });
  hideCollisions();
  applyDay();
}
function boxes(g){return[...g.querySelectorAll('text,circle.halo')].map(e=>{const b=e.getBBox();return[b.x-2,b.y-1,b.x+b.width+2,b.y+b.height+1]})}
function hit(b,list){return list.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1])}
function hideCollisions(){const act=boxes(gNodes).concat([...gNodes.querySelectorAll('rect')].map(e=>{const m=e.getCTM(),b=e.getBBox();const sm=svg.getCTM().inverse().multiply(m);const p=svg.createSVGPoint();p.x=b.x;p.y=b.y;const q=p.matrixTransform(sm);return[q.x,q.y,q.x+b.width,q.y+b.height]}));
  const keep=[];gFaint.querySelectorAll('text').forEach(t=>{const b=t.getBBox();const bb=[b.x,b.y,b.x+b.width,b.y+b.height];const hide=hit(bb,act)||hit(bb,keep);t.style.opacity=hide?0:1;if(!hide)keep.push(bb)});
  gL.querySelectorAll('text.town').forEach(t=>{const b=t.getBBox();t.style.opacity=hit([b.x,b.y,b.x+b.width,b.y+b.height],act)?0:1})}
function applyDay(){
  gRoute.querySelectorAll('.dayleg').forEach(g=>g.classList.toggle('dim',curDay!=null&&+g.dataset.day!==curDay));
  gNodes.querySelectorAll('.node').forEach(g=>g.classList.toggle('dim',curDay!=null&&g.dataset.day!=='stay'&&+g.dataset.day!==curDay));
  document.querySelectorAll('.day').forEach((b,i)=>b.setAttribute('aria-pressed',curDay===i));
}

function renderTabs(){const nav=$('#tabs');nav.innerHTML='';T.itins.forEach((it,i)=>{const b=h('button','rt');b.setAttribute('role','tab');b.setAttribute('aria-selected',i===cur);b.id='tab-'+it.id;
  b.innerHTML=`${it.pick?`<span class="pick">${esc(it.pick)}</span>`:''}<span class="k">${esc(it.key)}</span><span class="n">${esc(it.name)}</span><span class="t">${esc(it.tagline)}</span>`;
  b.onclick=()=>select(i,true);nav.appendChild(b)})}
function dotsN(n,cls){return `<div class="dots5 ${cls||''}">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div>`}
function renderDetail(){const it=T.itins[cur];
  $('#d-eyebrow').textContent=`${it.key} · ${it.base}`;$('#d-title').textContent=it.name;$('#d-pitch').innerHTML=it.pitch;
  const ck=`<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 11 L8 15 L17 4" fill="none" stroke="#557F4A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  $('#d-offers').innerHTML=it.offers.map(o=>`<li>${ck}<span>${o}</span></li>`).join('');
  const m=it.meters;$('#d-meters').innerHTML=`<div class="meter"><div class="mk">Peace</div>${dotsN(m.peace)}<div class="ms">${esc(m.peaceNote||'')}</div></div><div class="meter"><div class="mk">Crowds</div>${dotsN(m.crowd,'crowd')}<div class="ms">${esc(m.crowdNote||'')}</div></div><div class="meter"><div class="mk">Riding in Wayanad</div><div class="mv">${esc(m.ride)}</div><div class="ms">${esc(m.rideNote||'')}</div></div>`;
  $('#d-trade').innerHTML=`<b>The trade-off</b>${it.trade}`;
  const tl=$('#d-timeline');tl.innerHTML='';
  it.days.forEach((d,di)=>{const w=h('div','tday');w.appendChild(h('h4',null,`${esc(d.label)} <small>${esc(d.date)}</small>`));
    d.stops.forEach(s=>{if(s.p){const p=PL[s.p];const b=h('button','stop');b.innerHTML=`<span class="tm">${esc(s.t||'')}</span>${iconSVG(p.kind)}<span><span class="sn">${esc(p.name)}${s.dur?` <small style="font-weight:400;color:#8A7360;text-transform:none;font-size:14px">· ${esc(s.dur)}</small>`:''}</span><span class="sd">${s.d||''}</span></span>`;b.onclick=()=>openPop(s.p,{...s,day:di},b);w.appendChild(b)}
      else if(s.ride||s.note){const b=h('div','stop ride');b.innerHTML=`<span class="tm">${esc(s.t||'')}</span><span></span><span><span class="sn">${esc(s.ride||s.note)}</span></span>`;w.appendChild(b)}});
    tl.appendChild(w)});
  const days=$('#days');days.innerHTML='';it.days.forEach((d,di)=>{const b=h('button','day');b.setAttribute('aria-pressed','false');b.innerHTML=`<span class="dk">${esc(d.label)} · ${esc(d.date)}</span><span class="dn">${esc(d.strip.name)}</span><span class="dm">${esc(d.strip.meta)}</span>`;b.onclick=()=>{curDay=curDay===di?null:di;applyDay()};days.appendChild(b)});
  $('#s-title').textContent=it.stayTitle||'Stays';$('#s-note').innerHTML=it.stayNote||'';
  const sg=$('#s-grid');sg.innerHTML='';(it.stays||[]).forEach(k=>{const s=T.stays[k];const c=h('div','stay');
    c.innerHTML=`<div class="st">${iconSVG('stay',34)}<div><div class="sn">${esc(s.name)}</div><div class="sa">${esc(s.area)} · ${esc(s.type)}</div></div></div>
    <div class="nights">${(s.chips||[]).map((t,i)=>`<span class="chip ${i===0?'y':''}">${esc(t)}</span>`).join('')}</div>
    <p>${s.why}</p><div class="pr"><b>${esc(s.price)}</b>${s.rating?` · ${esc(s.rating)}`:''}</div>${s.bike?`<p style="color:#5B4433;font-size:13.5px">${s.bike}</p>`:''}
    ${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener">Check availability ↗</a>`:''}`;
    sg.appendChild(c)});
}
function select(i,anim){cur=i;curDay=null;closePop();renderTabs();renderDetail();drawRoute(anim);try{localStorage.setItem('wy-route',T.itins[i].id)}catch(e){}}

const pop=$('#pop'),scrim=$('#scrim');let lastFocus=null;
function openPop(k,s,anchor){const p=PL[k];lastFocus=anchor;
  const CR=window.CREDITS||{};const slugs=[].concat(p.img||k);
  const files=p.imgs||slugs.flatMap(sl=>Object.keys(CR).filter(f=>CR[f].place===sl).sort());
  const imgs=files.map(f=>({f,...(CR[f]||{})}));
  const car=$('#pop-car');
  if(imgs.length){car.innerHTML=`<div class="track">${imgs.map((m,i)=>`<figure><img src="img/${esc(m.f)}" alt="${esc(m.caption||p.name)}" loading="${i?'lazy':'eager'}"><figcaption>${esc(m.caption||'')}${m.author?`<small>Photo: ${esc(m.author)} · ${esc(m.license||'')}</small>`:''}</figcaption></figure>`).join('')}</div>${imgs.length>1?`<button class="nav p" aria-label="Previous photo">‹</button><button class="nav n" aria-label="Next photo">›</button><div class="dots">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}<button class="x" aria-label="Close">×</button>`;
    const trk=car.querySelector('.track');const dots=[...car.querySelectorAll('.dots i')];
    const go=d=>trk.scrollBy({left:d*trk.clientWidth,behavior:reduce?'auto':'smooth'});
    car.querySelector('.p')?.addEventListener('click',()=>go(-1));car.querySelector('.n')?.addEventListener('click',()=>go(1));
    trk.addEventListener('scroll',()=>{const i=Math.round(trk.scrollLeft/trk.clientWidth);dots.forEach((d,j)=>d.classList.toggle('on',i===j))},{passive:true});
  }else car.innerHTML=`<div class="noimg">${iconSVG(p.kind,72)}</div><button class="x" aria-label="Close">×</button>`;
  car.querySelector('.x').onclick=closePop;
  const it=T.itins[cur];
  let kline=`${KIND_LABEL[p.kind]||'Place'} · ${p.area||''}`;
  if(s&&p.kind!=='stay')kline=`Day ${s.day+1} · ${s.t||''} · ${KIND_LABEL[p.kind]}`;
  if(!s&&p.kind!=='stay')kline=p.corr?`On the ride · ${p.area}`:`Not on ${it.key} · ${p.area||''}`;
  const rows=[];
  if(s&&s.d)rows.push(['This route',s.d]);
  if(p.kind==='stay'){if(p.price)rows.push(['Price',esc(p.price)]);if(p.rating)rows.push(['Rating',esc(p.rating)]);if(p.bike)rows.push(['Bikes',p.bike])}
  if(p.time)rows.push(['Time needed',esc(p.time)]);if(p.timings)rows.push(['Open',esc(p.timings)]);if(p.fee)rows.push(['Entry',esc(p.fee)]);
  if(p.crowd)rows.push(['Crowd',dotsN(p.crowd,'crowd')]);if(p.status)rows.push(['Status',`<span class="status ${p.status[0]}">${esc(p.status[1])}</span>${p.statusNote?` <span style="font-size:13px">${p.statusNote}</span>`:''}`]);
  $('#pop-bd').innerHTML=`<div class="pk">${esc(kline)}</div><div class="pn" id="pop-n">${esc(p.name)}</div>${p.what?`<p class="pw">${p.what}</p>`:''}${p.why?`<p class="pw">${p.why}</p>`:''}
   <dl class="kv">${rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>
   ${p.tip?`<div class="tip">${p.tip}</div>`:''}${p.quote?`<span class="quote">“${esc(p.quote.q)}” ${p.quote.url?`<a href="${esc(p.quote.url)}" target="_blank" rel="noopener">${esc(p.quote.src)}</a>`:esc(p.quote.src)}</span>`:''}
   <div>${p.url?`<a class="ln" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.urlLabel||'Book / details')} ↗</a>`:''}<a class="ln" style="margin-left:${p.url?14:0}px" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}" target="_blank" rel="noopener">Open in Maps ↗</a></div>`;
  pop.hidden=false;scrim.hidden=false;
  const narrow=matchMedia('(max-width:700px)').matches;
  if(!narrow){const rc=anchor.getBoundingClientRect();const pw=pop.offsetWidth,ph=pop.offsetHeight;let x=rc.right+16;if(x+pw>innerWidth-16)x=rc.left-pw-16;if(x<16)x=Math.max(16,(innerWidth-pw)/2);let y=rc.top+rc.height/2-ph/2;y=Math.max(16,Math.min(y,innerHeight-ph-16));pop.style.left=x+'px';pop.style.top=y+'px';scrim.style.background='transparent'}
  else{pop.style.left='';pop.style.top='';scrim.style.background=''}
  pop.querySelector('.x').focus({preventScroll:true});
}
function closePop(){if(pop.hidden)return;pop.hidden=true;scrim.hidden=true;lastFocus&&lastFocus.focus&&lastFocus.focus({preventScroll:true})}
scrim.addEventListener('click',closePop);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePop();if(!pop.hidden&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){const b=pop.querySelector(e.key==='ArrowRight'?'.n':'.p');b&&b.click()}});
addEventListener('resize',()=>{if(!pop.hidden&&!matchMedia('(max-width:700px)').matches)closePop()});
addEventListener('scroll',()=>{if(!pop.hidden&&!matchMedia('(max-width:700px)').matches)closePop()},{passive:true});

$('#facts').innerHTML=T.facts.map(f=>`<span>${esc(f[0])} <b>${esc(f[1])}</b></span>`).join('');
$('#intro').innerHTML=T.intro;
const lg=k=>`<svg viewBox="-19 -19 38 38"><g transform="scale(.8)">${ICON[k]}</g></svg>`;
$('#legend').innerHTML=`<h4>Legend</h4>
<svg viewBox="0 0 30 18"><path d="M2 9 H28" stroke="#F6E3A1" stroke-width="9" stroke-linecap="round"/><path d="M2 9 H28" stroke="#3A281B" stroke-width="2.4" stroke-dasharray="6 4"/></svg><span>Your route</span>
<svg viewBox="0 0 30 18"><path d="M2 9 H28" stroke="#A9ADB1" stroke-width="6" stroke-linecap="round"/><path d="M2 9 H28" stroke="#fff" stroke-width="1.2" stroke-dasharray="5 4"/></svg><span>Highway</span>
${lg('stay')}<span>Stay</span>${lg('peak')}<span>Summit / trek top</span>${lg('view')}<span>Viewpoint</span>${lg('water')}<span>Waterfall</span>${lg('lake')}<span>Lake / dam</span>${lg('temple')}<span>Temple</span>${lg('wild')}<span>Wildlife</span>${lg('cave')}<span>Caves</span>${lg('food')}<span>Food</span>
<svg viewBox="0 0 30 18"><circle cx="15" cy="9" r="3.6" fill="#FFFEFA" stroke="#8A7360" stroke-width="1.4"/></svg><span style="font-family:Kalam">Not on this route</span>`;

(function(){const s=$('#corr');s.setAttribute('viewBox',`0 0 ${C.W} ${C.H}`);
  const d=el('defs',null,s);d.innerHTML=`<filter id="wcC" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="2"/></filter>`;
  el('rect',{x:0,y:0,width:C.W,height:C.H,fill:'#FFFEFA'},s);
  const cs={'Karnataka':'#F3EFE2','Tamil Nadu':'#F1ECE4','Kerala':'#EEF2E4'};
  for(const k in G.corr_states)el('path',{d:G.corr_states[k],fill:cs[k],stroke:'#CFC6AF','stroke-width':1.2,'stroke-dasharray':'7 5'},s);
  el('path',{d:G.corr_wayanad,fill:'#B9D3A4',filter:'url(#wcC)'},s);
  T.corridor.forests.forEach(f=>{const pts=f.poly.map(p=>PC(p[0],p[1]));el('path',{d:smooth([...pts,pts[0],pts[1]],.7),fill:'#6E9C5E',opacity:.45,filter:'url(#wcC)'},s);const[x,y]=PC(f.lat,f.lon);const t=el('text',{x,y,'text-anchor':'middle','font-family':'Kalam','font-size':16,fill:'#3F6436',class:'halo-text'},s);t.textContent=f.name});
  T.corridor.labels.forEach(l=>{const[x,y]=PC(l.lat,l.lon);const t=el('text',{x,y,'text-anchor':'middle','font-family':'Oswald','font-size':l.size||15,'letter-spacing':'.3em',fill:'#A8977F'},s);t.textContent=l.t});
  (T.corridor.alt||[]).forEach(a=>{const pts=a.pts.map(p=>PC(p[0],p[1]));el('path',{d:smooth(pts,.7),fill:'none',stroke:'#B39E89','stroke-width':2,'stroke-dasharray':'2 5','stroke-linecap':'round'},s);const[x,y]=PC(a.lat,a.lon);const t=el('text',{x,y,'font-family':'Kalam','font-size':14,fill:'#7A6552','text-anchor':a.anchor||'start',class:'halo-text'},s);t.textContent=a.t});
  const pts=T.corridor.road.map(p=>PC(p[0],p[1]));const dd=smooth(wobble(pts,1,3),.7);
  el('path',{d:dd,fill:'none',stroke:'#A9ADB1','stroke-width':7,'stroke-linecap':'round'},s);
  el('path',{d:dd,fill:'none',stroke:'#F6E3A1','stroke-width':16,'stroke-linecap':'round',opacity:.7},s);
  el('path',{d:dd,fill:'none',stroke:'#3A281B','stroke-width':2.6,'stroke-dasharray':'9 6'},s);
  T.corridor.stops.forEach(st=>{const[x,y]=PC(st.lat,st.lon);const g=el('g',st.p?{class:'node',tabindex:0,role:'button','aria-label':st.n}:null,s);if(st.p){el('circle',{cx:x,cy:y,r:22,fill:'#F1BF2C',opacity:.35,class:'halo'},g);g.addEventListener('click',()=>openPop(st.p,null,g));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPop(st.p,null,g)}})}const ic=el('g',{transform:`translate(${x} ${y})`},g);ic.innerHTML=ICON[st.kind||'pin'];
    const a=st.side==='l'?'end':'start',tx=x+(st.side==='l'?-20:20)+(st.dx||0),ty=y-4+(st.dy||0);
    const t1=el('text',{x:tx,y:ty,'text-anchor':a,class:'lbl-k halo-text',style:'font-size:12px'},g);t1.textContent=st.k;
    const t2=el('text',{x:tx,y:ty+19,'text-anchor':a,class:'lbl-n halo-text',style:'font-size:20px'},g);t2.textContent=st.n.toUpperCase();
    if(st.s){const t3=el('text',{x:tx,y:ty+35,'text-anchor':a,class:'lbl-s halo-text',style:'font-size:14px'},g);t3.textContent=st.s}});
  $('#legs').innerHTML=T.corridor.legs.map(l=>`<div class="leg"><h3>${esc(l.title)} <small>${esc(l.meta)}</small></h3><ol>${l.rows.map(r=>`<li class="${r.gate?'gate':''}"><span class="t">${esc(r.t)}</span><span class="w"><b>${esc(r.n)}</b><span>${r.s||''}</span></span></li>`).join('')}</ol></div>`).join('')+T.corridor.warns.map(w=>`<div class="warn"><b>${esc(w.k)}</b>${w.t}</div>`).join('');
})();

(function(){const t=$('#cmp');const its=T.itins;t.innerHTML=`<thead><tr><th></th>${its.map(i=>`<th>${esc(i.key)}<br><span style="font-weight:400;font-size:14px;text-transform:none">${esc(i.name)}</span></th>`).join('')}</tr></thead><tbody>${T.cmpRows.map(r=>`<tr><th>${esc(r[0])}</th>${its.map(i=>`<td>${i.cmp[r[1]]||''}</td>`).join('')}</tr>`).join('')}</tbody>`})();
$('#voices').innerHTML=T.voices.map(v=>`<div class="voice"><q>${esc(v.q)}</q><span class="src">${v.url?`<a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.src)} ↗</a>`:esc(v.src)}</span></div>`).join('');
$('#skip').innerHTML=T.skip.map(s=>`<li><span class="x ${s.v!=='Skip'?'m':''}">${esc(s.v)}</span><div><b>${esc(s.n)}</b><p>${s.why}</p></div></li>`).join('');
$('#notes').innerHTML=T.notes.map(n=>`<li><span>${n}</span></li>`).join('');
$('#credits').innerHTML=T.creditsHtml;

let start=0;try{const s=localStorage.getItem('wy-route');const i=T.itins.findIndex(x=>x.id===s);if(i>=0)start=i}catch(e){}
select(start,false);
})();
