System.register(["jimu-core/emotion","jimu-core","jimu-arcgis"],function(e,r){var o={},n={},t={};return{setters:[function(e){o.jsx=e.jsx,o.jsxs=e.jsxs},function(e){n.React=e.React,n.css=e.css},function(e){t.JimuMapViewComponent=e.JimuMapViewComponent,t.loadArcGISJSAPIModules=e.loadArcGISJSAPIModules}],execute:function(){e((()=>{var e={2686(e){"use strict";e.exports=t},9244(e){"use strict";e.exports=n},7386(e){"use strict";e.exports=o}},r={};function a(o){var n=r[o];if(void 0!==n)return n.exports;var t=r[o]={exports:{}};return e[o](t,t.exports,a),t.exports}a.d=(e,r)=>{for(var o in r)a.o(r,o)&&!a.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:r[o]})},a.o=(e,r)=>Object.prototype.hasOwnProperty.call(e,r),a.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},a.p="";var i={};return a.p=window.jimuConfig.baseUrl,(()=>{"use strict";a.r(i),a.d(i,{__set_webpack_public_path__:()=>u,default:()=>x});var e=a(7386),r=a(9244),o=a(2686);const n={_widgetLabel:"Selector de im\xe1genes drone",noMap:"Conecta este widget a un mapa desde su configuraci\xf3n.",loading:"Leyendo im\xe1genes del mapa\u2026",groupNotFound:"No se encontr\xf3 el grupo de capas configurado.",noImages:"No se encontraron capas con una fecha v\xe1lida.",title:"Im\xe1genes drone",subtitle:"Explora el historial de levantamientos",latest:"M\xe1s reciente",active:"Visible",available:"disponibles",images:"Im\xe1genes",search:"Buscar por fecha o nombre",year:"A\xf1o",allYears:"Todos los a\xf1os",from:"Desde",to:"Hasta",clear:"Limpiar filtros",previous:"Imagen anterior",next:"Imagen siguiente",image:"Imagen",layer:"Capa",opacity:"Transparencia",of:"de",compare:"Comparar",compareHint:"Se compara autom\xe1ticamente con la fecha adyacente dentro del filtro.",compareUnavailable:"Se necesitan al menos dos im\xe1genes dentro del filtro.",primary:"Principal",comparison:"Comparaci\xf3n",swipeActive:"Cortina activa en el mapa",emptyFilter:"No hay im\xe1genes en este rango.",refresh:"Actualizar capas",group:"Grupo"};var t=function(e,r,o,n){return new(o||(o=Promise))(function(t,a){function i(e){try{s(n.next(e))}catch(e){a(e)}}function d(e){try{s(n.throw(e))}catch(e){a(e)}}function s(e){var r;e.done?t(e.value):(r=e.value,r instanceof o?r:new o(function(e){e(r)})).then(i,d)}s((n=n.apply(e,r||[])).next())})};const d=()=>(0,e.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,e.jsx)("circle",{cx:"11",cy:"11",r:"7"}),(0,e.jsx)("path",{d:"m20 20-4-4"})]}),s=()=>(0,e.jsxs)("svg",{width:"25",height:"25",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",children:[(0,e.jsx)("rect",{x:"3",y:"4",width:"18",height:"16",rx:"2"}),(0,e.jsx)("circle",{cx:"15.5",cy:"9",r:"2"}),(0,e.jsx)("path",{d:"m4 17 5-5 4 4 2-2 5 4"})]}),l=()=>(0,e.jsxs)("svg",{width:"38",height:"38",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",children:[(0,e.jsx)("rect",{x:"3",y:"4",width:"18",height:"16",rx:"2"}),(0,e.jsx)("path",{d:"m4 17 5-5 3 3 2-2 6 5M8 8h.01"})]}),c=()=>(0,e.jsx)("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:(0,e.jsx)("path",{d:"m5 12 4 4L19 6"})}),p=({right:r=!1})=>(0,e.jsx)("svg",{width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:(0,e.jsx)("path",{d:r?"m9 18 6-6-6-6":"m15 18-6-6 6-6"})}),x=a=>{var i,x;const[u,g]=r.React.useState(void 0),[m,h]=r.React.useState([]),[f,v]=r.React.useState(""),[b,y]=r.React.useState(""),[w,j]=r.React.useState(!1),[k,N]=r.React.useState(""),[C,R]=r.React.useState(""),[S,L]=r.React.useState(""),[z,E]=r.React.useState(""),[M,I]=r.React.useState({}),[A,P]=r.React.useState(""),[O,D]=r.React.useState("idle"),T=r.React.useRef(void 0),$=r.React.useRef([]),_=r.React.useRef([]),V=r.React.useRef(void 0),B=r.React.useRef(void 0),W=r.React.useRef(0),F=r.React.useRef(!1),Y=r.React.useCallback(e=>n[e]||e,[]),J=r.React.useCallback(e=>{try{const r=new RegExp(a.config.datePattern||"(\\d{4})[_-](\\d{2})[_-](\\d{2})"),o=e.match(r);if(!o||o.length<4)return null;const n=Number(o[1]),t=Number(o[2]),i=Number(o[3]),d=new Date(n,t-1,i);return d.getFullYear()!==n||d.getMonth()!==t-1||d.getDate()!==i?null:{date:d,iso:`${n}-${String(t).padStart(2,"0")}-${String(i).padStart(2,"0")}`}}catch(e){return null}},[a.config.datePattern]),G=r.React.useCallback(e=>t(void 0,void 0,void 0,function*(){var r,o,n,t,i,d,s,l;D("loading");const c=null===(r=e.view)||void 0===r?void 0:r.map;if(!c)return;const p=(null===(n=null===(o=c.allLayers)||void 0===o?void 0:o.toArray)||void 0===n?void 0:n.call(o))||[];let x=p.find(e=>"group"===e.type&&e.title.trim().toLocaleLowerCase()===(a.config.groupTitle||"Drone").trim().toLocaleLowerCase());if(x||(x=null===(t=p.filter(e=>"group"===e.type).map(e=>{var r,o;return{candidate:e,datedCount:(null===(o=null===(r=e.layers)||void 0===r?void 0:r.toArray)||void 0===o?void 0:o.call(r).filter(e=>Boolean(J(e.title||""))).length)||0}}).filter(e=>e.datedCount>0).sort((e,r)=>r.datedCount-e.datedCount)[0])||void 0===t?void 0:t.candidate),!x)return h([]),P(""),void D("group");P(x.title),yield x.load();const u=((null===(d=null===(i=x.layers)||void 0===i?void 0:i.toArray)||void 0===d?void 0:d.call(i))||[]).map(e=>{const r=J(e.title||"");return r?Object.assign({id:e.id,title:e.title,layer:e},r):null}).filter(Boolean).sort((e,r)=>r.date.getTime()-e.date.getTime());if(h(u),!u.length)return void D("empty");D("ready");const g=u.find(e=>e.layer.visible),m=a.config.autoSelectLatest&&!F.current?u[0]:g||u[0];u.forEach(e=>{e.layer.visible=e.id===m.id}),v(m.id),y((null===(s=u.find(e=>e.id!==m.id))||void 0===s?void 0:s.id)||""),F.current=!0,null===(l=T.current)||void 0===l||l.remove(),T.current=x.layers.on("change",()=>{Date.now()<W.current||window.setTimeout(()=>G(e),0)})}),[J,a.config.autoSelectLatest,a.config.groupTitle]),H=r.React.useCallback(()=>{var e,r,o;if(_.current.forEach(({layerView:e,clip:r})=>{var o;return null===(o=e.clips)||void 0===o?void 0:o.remove(r)}),_.current=[],null===(e=B.current)||void 0===e||e.call(B),B.current=void 0,null===(r=V.current)||void 0===r||r.remove(),V.current=void 0,$.current.length&&(null===(o=null==u?void 0:u.view)||void 0===o?void 0:o.map)){W.current=Date.now()+1200;const e=[...$.current].sort((e,r)=>e.index-r.index);e.forEach(({layer:e})=>u.view.map.remove(e)),e.forEach(({layer:e,group:r,index:o})=>r.layers.add(e,o)),$.current=[]}},[u]);r.React.useEffect(()=>()=>{var e,r,o;null===(e=T.current)||void 0===e||e.remove(),_.current.forEach(({layerView:e,clip:r})=>{var o;return null===(o=e.clips)||void 0===o?void 0:o.remove(r)}),_.current=[],null===(r=B.current)||void 0===r||r.call(B),null===(o=V.current)||void 0===o||o.remove(),$.current=[]},[]);const U=r.React.useCallback(e=>{g(e),F.current=!1,G(e)},[G]),X=r.React.useMemo(()=>Array.from(new Set(m.map(e=>e.date.getFullYear()))).sort((e,r)=>r-e),[m]),q=r.React.useMemo(()=>{const e=k.trim().toLocaleLowerCase();return m.filter(r=>(!e||r.title.toLocaleLowerCase().includes(e)||r.iso.includes(e))&&(!C||r.date.getFullYear()===Number(C))&&(!S||r.iso>=S)&&(!z||r.iso<=z))},[m,k,C,S,z]),K=r.React.useMemo(()=>{const e=q.findIndex(e=>e.id===f);return e<0?null:q[e+1]||q[e-1]||null},[q,f]),Q=r.React.useMemo(()=>q.find(e=>e.id===b&&e.id!==f)||K,[q,b,f,K]);r.React.useEffect(()=>{var e;if(!q.length)return j(!1),void y("");if(!q.some(e=>e.id===f)){const r=q[0];v(r.id),y((null===(e=q[1])||void 0===e?void 0:e.id)||"")}},[q,f]),r.React.useEffect(()=>{if(q.length<2)return j(!1),void y("");q.some(e=>e.id===b&&e.id!==f)||y((null==K?void 0:K.id)||"")},[q,f,b,K]);const Z=r.React.useCallback(e=>t(void 0,void 0,void 0,function*(){var r,o;const n=m.find(r=>r.id===e);if(n){if(m.forEach(r=>{var o;r.layer.visible=r.id===e||w&&r.id===b,r.layer.opacity=null!==(o=M[r.id])&&void 0!==o?o:1}),v(e),b===e||!q.some(e=>e.id===b)){const n=q.findIndex(r=>r.id===e);y((null===(r=q[n+1])||void 0===r?void 0:r.id)||(null===(o=q[n-1])||void 0===o?void 0:o.id)||"")}if(a.config.zoomOnSelect&&(null==u?void 0:u.view))try{yield n.layer.load();const e=n.layer.fullExtent;e&&(yield u.view.goTo(e.expand(1.12),{duration:900,easing:"ease-in-out"}))}catch(e){console.warn("No fue posible acercar a la extensi\xf3n de la imagen seleccionada.",e)}}}),[m,q,w,b,M,a.config.zoomOnSelect,u]);r.React.useEffect(()=>{m.length&&m.forEach(e=>{var r;const o=w&&e.id===(null==Q?void 0:Q.id)&&e.id!==f;e.layer.visible=e.id===f||o,e.layer.opacity=null!==(r=M[e.id])&&void 0!==r?r:1})},[w,Q,f,m,M]);const ee=r.React.useCallback(e=>{var r;const o=null!==(r=M[e.id])&&void 0!==r?r:1,n=o>.75?.75:o>.5?.5:o>.25?.25:1;e.layer.opacity=n,I(r=>Object.assign(Object.assign({},r),{[e.id]:n}))},[M]);r.React.useEffect(()=>{let e=!1;return t(void 0,void 0,void 0,function*(){if(H(),!w||!(null==u?void 0:u.view))return;const r=m.find(e=>e.id===f),n=Q;if(!r||!n||r.id===n.id)return;yield Promise.all([r.layer.load(),n.layer.load()]);const[t]=yield(0,o.loadArcGISJSAPIModules)(["esri/views/layers/support/ClipRect"]);if(e)return;const a=r.layer.parent,i=n.layer.parent;if("group"!==(null==a?void 0:a.type)||"group"!==(null==i?void 0:i.type))return;const d=[{layer:r.layer,group:a,index:a.layers.indexOf(r.layer)},{layer:n.layer,group:i,index:i.layers.indexOf(n.layer)}];W.current=Date.now()+1200,d.forEach(({layer:e,group:r})=>r.layers.remove(e)),u.view.map.addMany([r.layer,n.layer]),$.current=d,r.layer.visible=!0,n.layer.visible=!0;const[s,l]=yield Promise.all([u.view.whenLayerView(r.layer),u.view.whenLayerView(n.layer)]);if(e)return void H();const c=new t({left:0,top:0,right:"50%",bottom:0}),p=new t({left:"50%",top:0,right:0,bottom:0}),x=s,g=l;if(!x.clips||!g.clips)throw new Error("Las vistas de estas capas no admiten recorte Swipe.");x.clips.add(c),g.clips.add(p),_.current=[{layerView:x,clip:c},{layerView:g,clip:p}];const h=document.createElement("div");h.setAttribute("aria-hidden","true"),Object.assign(h.style,{position:"absolute",inset:"0",zIndex:"20",pointerEvents:"none",overflow:"hidden"});const v=document.createElement("div");Object.assign(v.style,{position:"absolute",left:"50%",top:"0",bottom:"0",width:"3px",marginLeft:"-1px",background:"#ffffff",borderLeft:"1px solid rgba(23,37,42,.65)",borderRight:"1px solid rgba(23,37,42,.65)",cursor:"col-resize",pointerEvents:"auto",touchAction:"none",boxShadow:"0 0 4px rgba(0,0,0,.25)"});const b=document.createElement("div");b.textContent="\u2194",Object.assign(b.style,{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%, -50%)",width:"34px",height:"38px",display:"grid",placeItems:"center",color:"#075f59",fontSize:"18px",background:"#ffffff",border:"1px solid #547078",borderRadius:"5px",boxShadow:"0 2px 7px rgba(0,0,0,.2)"}),v.appendChild(b),h.appendChild(v),u.view.container.appendChild(h),V.current=h;const y=e=>{const r=u.view.container.getBoundingClientRect(),o=Math.max(2,Math.min(98,(e-r.left)/r.width*100));v.style.left=`${o}%`,c.right=100-o+"%",p.left=`${o}%`};let j=!1;const k=e=>{e.preventDefault(),e.stopPropagation(),j&&y(e.clientX)},N=e=>{e.preventDefault(),e.stopPropagation(),j=!1,v.hasPointerCapture(e.pointerId)&&v.releasePointerCapture(e.pointerId)},C=e=>{e.preventDefault(),e.stopPropagation(),j=!0,v.setPointerCapture(e.pointerId),y(e.clientX)};v.addEventListener("pointerdown",C),v.addEventListener("pointermove",k),v.addEventListener("pointerup",N),v.addEventListener("pointercancel",N),B.current=()=>{v.removeEventListener("pointerdown",C),v.removeEventListener("pointermove",k),v.removeEventListener("pointerup",N),v.removeEventListener("pointercancel",N)}}),()=>{e=!0,H()}},[w,f,Q,m,u,H]);const re=q.findIndex(e=>e.id===f),oe=(null===(i=a.config.widgetTitle)||void 0===i?void 0:i.trim())||"Im\xe1genes drone",ne=e=>e.toLocaleDateString("es-CL",{year:"numeric",month:"long",day:"numeric"}),te=()=>{N(""),R(""),L(""),E("")};return(0,e.jsxs)("div",{className:"jimu-widget",css:r.css`
  --drone-ink: #17252a;
  --drone-muted: #66777d;
  --drone-line: #dce5e7;
  --drone-teal: #087f75;
  --drone-teal-dark: #075f59;
  --drone-soft: #e9f6f3;
  height: 100%;
  width: 100%;
  min-height: 300px;
  min-width: 0;
  overflow: hidden;
  position: relative;
  z-index: 2;
  isolation: isolate;
  color: var(--drone-ink);
  background: #fff;
  font-family: var(--ref-typeface-brand, "Avenir Next", Arial, sans-serif);

  * { box-sizing: border-box; }
  button, input { font: inherit; }

  .drone-shell { width: 100%; height: 100%; min-height: 0; overflow: hidden; display: flex; flex-direction: column; background: #fff; }
  .drone-header {
    flex: 0 0 auto;
    color: #fff;
    background: linear-gradient(135deg, #073f45 0%, #0a6c70 62%, #15877f 100%);
    padding: 20px 20px 17px;
    position: relative;
    overflow: hidden;
  }
  .drone-header::after {
    content: "";
    position: absolute;
    width: 150px; height: 150px;
    right: -65px; top: -80px;
    border: 28px solid rgba(255,255,255,.07);
    border-radius: 50%;
  }
  .drone-eyebrow { font-size: 11px; letter-spacing: .11em; text-transform: uppercase; opacity: .75; }
  .drone-heading { display: flex; align-items: center; gap: 11px; margin-top: 4px; }
  .drone-heading h2 { font-size: 20px; line-height: 1.2; margin: 0; font-weight: 700; }
  .drone-heading svg { flex: 0 0 auto; }
  .drone-summary { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 12px; }
  .drone-live { width: 7px; height: 7px; border-radius: 50%; background: #75e0b9; box-shadow: 0 0 0 4px rgba(117,224,185,.16); }

  .drone-toolbar { flex: 0 0 auto; padding: 14px 16px 12px; border-bottom: 1px solid var(--drone-line); background: #fff; }
  .drone-search { position: relative; }
  .drone-search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #718087; pointer-events: none; }
  .drone-search input {
    width: 100%; height: 38px; border: 1px solid #cbd7da; border-radius: 7px;
    padding: 0 36px 0 35px; outline: none; color: var(--drone-ink); background: #fbfcfc;
  }
  .drone-search input:focus { border-color: var(--drone-teal); box-shadow: 0 0 0 2px rgba(8,127,117,.13); background: #fff; }
  .drone-clear-search { position: absolute; right: 4px; top: 3px; width: 32px; height: 32px; border: 0; background: transparent; color: #65767c; cursor: pointer; }
  .drone-year { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: center; margin-top: 11px; }
  .drone-year span { font-size: 10px; font-weight: 700; color: var(--drone-muted); text-transform: uppercase; letter-spacing: .06em; }
  .drone-year select { width: 100%; height: 33px; border: 1px solid #cbd7da; border-radius: 6px; padding: 0 28px 0 9px; color: var(--drone-ink); background: #fff; }
  .drone-year select:focus { border-color: var(--drone-teal); box-shadow: 0 0 0 2px rgba(8,127,117,.13); outline: none; }
  .drone-range { display: grid; grid-template-columns: 1fr 12px 1fr; gap: 7px; align-items: end; margin-top: 11px; }
  .drone-range label { display: block; font-size: 10px; font-weight: 700; color: var(--drone-muted); text-transform: uppercase; letter-spacing: .06em; }
  .drone-range input { width: 100%; height: 33px; margin-top: 4px; border: 1px solid #cbd7da; border-radius: 6px; padding: 0 7px; color: var(--drone-ink); background: #fff; }
  .drone-dash { padding-bottom: 9px; color: #9aabad; text-align: center; }
  .drone-filter-meta { min-height: 27px; display: flex; align-items: end; justify-content: space-between; font-size: 11px; color: var(--drone-muted); }
  .drone-link { border: 0; padding: 2px 0; background: transparent; color: var(--drone-teal-dark); font-weight: 600; cursor: pointer; }

  .drone-list { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 8px 10px 14px; background: #f7f9f9; }
  .drone-card {
    position: relative; width: 100%; min-height: 82px; margin: 6px 0;
    border: 1px solid transparent; border-radius: 9px; background: #fff; color: inherit;
    box-shadow: 0 1px 2px rgba(25,50,56,.07); transition: border-color .15s, transform .15s, box-shadow .15s;
  }
  .drone-card:hover { border-color: #a8ceca; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25,50,56,.09); }
  .drone-card.is-active { border-color: var(--drone-teal); box-shadow: 0 0 0 1px var(--drone-teal), 0 5px 14px rgba(8,127,117,.12); }
  .drone-card.is-compare { border-color: #9c7b30; background: #fffdf7; }
  .drone-card-select {
    width: 100%; min-height: 80px; display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 11px;
    padding: 11px 10px 31px; border: 0; border-radius: inherit; text-align: left; color: inherit; background: transparent; cursor: pointer;
  }
  .drone-date-box { width: 42px; height: 45px; border-radius: 7px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #edf3f3; color: #35545a; }
  .is-active .drone-date-box { background: var(--drone-soft); color: var(--drone-teal-dark); }
  .drone-day { font-size: 18px; font-weight: 750; line-height: 18px; }
  .drone-month { font-size: 9px; letter-spacing: .05em; text-transform: uppercase; margin-top: 3px; }
  .drone-card-main { display: block; min-width: 0; overflow: visible; }
  .drone-card-title { display: block; font-size: 13px; font-weight: 700; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .drone-card-sub { display: flex; align-items: center; gap: 5px; min-width: 0; min-height: 14px; margin-top: 6px; font-size: 10px; line-height: 1.35; color: var(--drone-muted); }
  .drone-layer-label { flex: 0 0 auto; padding-right: 5px; border-right: 1px solid #cbd7da; color: #49656b; font-size: 9px; font-weight: 750; letter-spacing: .05em; text-transform: uppercase; }
  .drone-layer-name { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .drone-badge { display: inline-block; border-radius: 10px; padding: 2px 7px; margin-top: 6px; font-size: 9px; font-weight: 750; text-transform: uppercase; letter-spacing: .04em; color: var(--drone-teal-dark); background: var(--drone-soft); }
  .drone-check { width: 22px; height: 22px; display: grid; place-items: center; border: 1px solid #c9d4d6; border-radius: 50%; color: transparent; }
  .is-active .drone-check { color: #fff; border-color: var(--drone-teal); background: var(--drone-teal); }
  .is-compare .drone-check { color: #fff; border-color: #9c7b30; background: #9c7b30; }
  .drone-opacity {
    position: absolute; right: 9px; bottom: 7px; min-width: 54px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    padding: 0 7px; border: 1px solid #c7d4d6; border-radius: 11px;
    color: #486168; background: #f7f9f9; font-size: 10px; font-weight: 700; cursor: pointer;
  }
  .drone-opacity:hover, .drone-opacity:focus-visible { color: #fff; border-color: var(--drone-teal); background: var(--drone-teal); outline: none; }
  .drone-opacity-icon { font-size: 13px; line-height: 1; }

  .drone-footer { flex: 0 0 auto; position: relative; z-index: 3; padding: 12px 16px 14px; border-top: 1px solid var(--drone-line); background: #fff; }
  .drone-nav { display: grid; grid-template-columns: 38px 1fr 38px; align-items: center; gap: 9px; }
  .drone-nav button { width: 38px; height: 36px; border: 1px solid #cbd7da; border-radius: 7px; color: #38555b; background: #fff; cursor: pointer; }
  .drone-nav button:hover:not(:disabled) { color: #fff; background: var(--drone-teal); border-color: var(--drone-teal); }
  .drone-nav button:disabled { opacity: .35; cursor: default; }
  .drone-position { text-align: center; font-size: 11px; color: var(--drone-muted); }
  .drone-position strong { display: block; color: var(--drone-ink); font-size: 13px; margin-bottom: 2px; }
  .drone-compare-row { display: flex; justify-content: space-between; align-items: center; margin-top: 11px; padding-top: 11px; border-top: 1px solid #e5ebec; }
  .drone-compare-copy strong { display: block; font-size: 12px; }
  .drone-compare-copy span { display: block; font-size: 10px; color: var(--drone-muted); margin-top: 2px; }
  .drone-toggle { position: relative; width: 38px; height: 21px; border: 0; border-radius: 12px; padding: 0; background: #bcc8ca; cursor: pointer; }
  .drone-toggle:disabled { opacity: .45; cursor: not-allowed; }
  .drone-toggle::after { content: ""; position: absolute; width: 17px; height: 17px; left: 2px; top: 2px; border-radius: 50%; background: #fff; transition: left .15s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
  .drone-toggle.on { background: var(--drone-teal); }
  .drone-toggle.on::after { left: 19px; }
  .drone-swipe-status { margin-top: 10px; padding: 7px 9px; border-radius: 6px; font-size: 10px; font-weight: 650; color: var(--drone-teal-dark); background: var(--drone-soft); text-align: center; }
  .drone-compare-summary { display: grid; grid-template-columns: minmax(0,1fr) 22px minmax(0,1fr); gap: 5px; align-items: center; margin-top: 9px; padding: 8px; border: 1px solid var(--drone-line); border-radius: 7px; text-align: center; background: #f7f9f9; }
  .drone-compare-summary.active { border-color: #8fc6c1; background: var(--drone-soft); }
  .drone-compare-summary span { min-width: 0; }
  .drone-compare-summary small, .drone-compare-summary strong { display: block; }
  .drone-compare-summary small { color: var(--drone-muted); font-size: 8px; text-transform: uppercase; }
  .drone-compare-summary strong { margin-top: 2px; color: var(--drone-teal-dark); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .drone-compare-summary > b { color: var(--drone-teal); }

  .drone-state { height: 100%; min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px; text-align: center; color: var(--drone-muted); }
  .drone-state svg { color: #7d969b; margin-bottom: 13px; }
  .drone-state strong { color: var(--drone-ink); margin-bottom: 5px; }
  .drone-spinner { width: 28px; height: 28px; margin-bottom: 15px; border: 3px solid #dbe8e8; border-top-color: var(--drone-teal); border-radius: 50%; animation: drone-spin .8s linear infinite; }
  @keyframes drone-spin { to { transform: rotate(360deg); } }

  @media (max-width: 300px) {
    .drone-header { padding: 16px; }
    .drone-toolbar { padding-left: 10px; padding-right: 10px; }
    .drone-card { grid-template-columns: 39px 1fr auto; gap: 8px; }
    .drone-date-box { width: 38px; }
  }

  @media (max-height: 960px) {
    .drone-header { padding: 13px 16px 11px; }
    .drone-heading h2 { font-size: 18px; }
    .drone-summary { margin-top: 8px; }
    .drone-toolbar { padding: 10px 12px 8px; }
    .drone-range { margin-top: 7px; }
    .drone-filter-meta { min-height: 23px; }
    .drone-list { padding: 5px 8px 8px; }
    .drone-card { min-height: 68px; margin: 4px 0; }
    .drone-card-select { min-height: 66px; padding: 8px 8px 28px; }
    .drone-date-box { height: 41px; }
    .drone-card-sub { margin-top: 3px; }
    .drone-badge { margin-top: 3px; }
    .drone-footer { padding: 8px 12px 10px; }
    .drone-compare-row { margin-top: 7px; padding-top: 7px; }
    .drone-swipe-status { margin-top: 6px; padding: 5px 8px; }
  }

  @media (max-height: 720px) {
    .drone-eyebrow, .drone-summary, .drone-compare-copy span { display: none; }
    .drone-heading { margin-top: 0; }
    .drone-header { padding-top: 10px; padding-bottom: 10px; }
    .drone-range input { height: 30px; }
    .drone-card { min-height: 60px; }
    .drone-card-select { min-height: 58px; }
    .drone-footer { padding-top: 6px; padding-bottom: 7px; }
  }
`,children:[(null===(x=a.useMapWidgetIds)||void 0===x?void 0:x[0])&&(0,e.jsx)(o.JimuMapViewComponent,{useMapWidgetId:a.useMapWidgetIds[0],onActiveViewChange:U}),(()=>{var r;return"idle"!==O&&(null===(r=a.useMapWidgetIds)||void 0===r?void 0:r.length)?"loading"===O?(0,e.jsxs)("div",{className:"drone-state",children:[(0,e.jsx)("div",{className:"drone-spinner"}),(0,e.jsx)("span",{children:Y("loading")})]}):"group"===O?(0,e.jsxs)("div",{className:"drone-state",children:[(0,e.jsx)(l,{}),(0,e.jsx)("strong",{children:Y("groupNotFound")}),(0,e.jsxs)("span",{children:[Y("group"),": ",a.config.groupTitle||"Autom\xe1tico"]})]}):"empty"===O?(0,e.jsxs)("div",{className:"drone-state",children:[(0,e.jsx)(l,{}),(0,e.jsx)("strong",{children:Y("noImages")}),(0,e.jsx)("span",{children:a.config.datePattern})]}):(0,e.jsxs)("div",{className:"drone-shell",children:[(0,e.jsxs)("header",{className:"drone-header",children:[(0,e.jsx)("div",{className:"drone-eyebrow",children:Y("subtitle")}),(0,e.jsxs)("div",{className:"drone-heading",children:[(0,e.jsx)(s,{}),(0,e.jsx)("h2",{children:oe})]}),(0,e.jsxs)("div",{className:"drone-summary",children:[(0,e.jsx)("span",{className:"drone-live"}),(0,e.jsxs)("span",{children:[m.length," ",Y("available")," \xb7 ",Y("group")," ",A]})]})]}),(0,e.jsxs)("section",{className:"drone-toolbar","aria-label":"Filtros",children:[(0,e.jsxs)("div",{className:"drone-search",children:[(0,e.jsx)(d,{}),(0,e.jsx)("input",{"aria-label":Y("search"),placeholder:Y("search"),value:k,onChange:e=>N(e.target.value)}),k&&(0,e.jsx)("button",{className:"drone-clear-search",onClick:()=>N(""),"aria-label":Y("clear"),children:"\xd7"})]}),(0,e.jsxs)("label",{className:"drone-year",children:[(0,e.jsx)("span",{children:Y("year")}),(0,e.jsxs)("select",{value:C,onChange:e=>R(e.target.value),"aria-label":Y("year"),children:[(0,e.jsx)("option",{value:"",children:Y("allYears")}),X.map(r=>(0,e.jsx)("option",{value:r,children:r},r))]})]}),(0,e.jsxs)("div",{className:"drone-range",children:[(0,e.jsxs)("label",{children:[Y("from"),(0,e.jsx)("input",{type:"date",value:S,max:z||void 0,onChange:e=>L(e.target.value)})]}),(0,e.jsx)("span",{className:"drone-dash",children:"\u2014"}),(0,e.jsxs)("label",{children:[Y("to"),(0,e.jsx)("input",{type:"date",value:z,min:S||void 0,onChange:e=>E(e.target.value)})]})]}),(0,e.jsxs)("div",{className:"drone-filter-meta",children:[(0,e.jsxs)("span",{children:[(0,e.jsxs)("strong",{children:[Y("images"),":"]})," ",q.length," ",Y("of")," ",m.length]}),(k||C||S||z)&&(0,e.jsx)("button",{className:"drone-link",onClick:te,children:Y("clear")})]})]}),(0,e.jsx)("main",{className:"drone-list","aria-live":"polite",children:q.length?q.map((r,o)=>{var n;const t=r.id===f,a=w&&r.id===b&&!t,i=null!==(n=M[r.id])&&void 0!==n?n:1;return(0,e.jsxs)("div",{className:`drone-card${t?" is-active":""}${a?" is-compare":""}`,children:[(0,e.jsxs)("button",{className:"drone-card-select",onClick:()=>w&&!t?y(r.id):void Z(r.id),title:r.title,"aria-pressed":t||a,children:[(0,e.jsxs)("span",{className:"drone-date-box",children:[(0,e.jsx)("span",{className:"drone-day",children:r.date.getDate()}),(0,e.jsx)("span",{className:"drone-month",children:(d=r.date,d.toLocaleDateString("es-CL",{month:"short"}).replace(".",""))})]}),(0,e.jsxs)("span",{className:"drone-card-main",children:[(0,e.jsx)("span",{className:"drone-card-title",children:ne(r.date)}),(0,e.jsxs)("span",{className:"drone-card-sub",children:[(0,e.jsx)("span",{className:"drone-layer-label",children:Y("layer")}),(0,e.jsx)("span",{className:"drone-layer-name",children:r.title})]}),0===o&&r.id===m[0].id&&(0,e.jsx)("span",{className:"drone-badge",children:Y("latest")}),t&&0!==o&&(0,e.jsx)("span",{className:"drone-badge",children:Y("active")}),a&&(0,e.jsx)("span",{className:"drone-badge",children:Y("compare")})]}),(0,e.jsx)("span",{className:"drone-check",children:(0,e.jsx)(c,{})})]}),(0,e.jsxs)("button",{className:"drone-opacity",onClick:()=>ee(r),title:`${Y("opacity")}: ${Math.round(100*i)}%`,"aria-label":`${Y("opacity")} ${r.title}: ${Math.round(100*i)}%`,children:[(0,e.jsx)("span",{className:"drone-opacity-icon","aria-hidden":"true",children:"\u25d0"}),Math.round(100*i),"%"]})]},r.id);var d}):(0,e.jsxs)("div",{className:"drone-state",children:[(0,e.jsx)(l,{}),(0,e.jsx)("span",{children:Y("emptyFilter")})]})}),(0,e.jsxs)("footer",{className:"drone-footer",children:[(0,e.jsxs)("div",{className:"drone-nav",children:[(0,e.jsx)("button",{disabled:re<0||re>=q.length-1,onClick:()=>{var e;Z(null===(e=q[re+1])||void 0===e?void 0:e.id)},"aria-label":Y("previous"),children:(0,e.jsx)(p,{})}),(0,e.jsxs)("div",{className:"drone-position",children:[(0,e.jsx)("strong",{children:q[re]?ne(q[re].date):"\u2014"}),Y("image")," ",re>=0?re+1:0," ",Y("of")," ",q.length]}),(0,e.jsx)("button",{disabled:re<=0,onClick:()=>{var e;Z(null===(e=q[re-1])||void 0===e?void 0:e.id)},"aria-label":Y("next"),children:(0,e.jsx)(p,{right:!0})})]}),(0,e.jsxs)("div",{className:"drone-compare-row",children:[(0,e.jsxs)("div",{className:"drone-compare-copy",children:[(0,e.jsx)("strong",{children:Y("compare")}),(0,e.jsx)("span",{children:q.length<2?Y("compareUnavailable"):Y("compareHint")})]}),(0,e.jsx)("button",{disabled:q.length<2,className:"drone-toggle"+(w?" on":""),onClick:()=>{!w&&K&&y(K.id),j(!w)},role:"switch","aria-checked":w,"aria-label":Y("compare")})]}),q.length>=2&&q[re]&&Q&&(0,e.jsxs)("div",{className:"drone-compare-summary"+(w?" active":""),children:[(0,e.jsxs)("span",{children:[(0,e.jsx)("small",{children:Y("primary")}),(0,e.jsx)("strong",{children:ne(q[re].date)})]}),(0,e.jsx)("b",{children:"\u2194"}),(0,e.jsxs)("span",{children:[(0,e.jsx)("small",{children:Y("comparison")}),(0,e.jsx)("strong",{children:ne(Q.date)})]})]}),w&&(0,e.jsx)("div",{className:"drone-swipe-status",children:Y("swipeActive")})]})]}):(0,e.jsxs)("div",{className:"drone-state",children:[(0,e.jsx)(l,{}),(0,e.jsx)("strong",{children:oe}),(0,e.jsx)("span",{children:Y("noMap")})]})})()]})};function u(e){a.p=e}})(),i})())}}});