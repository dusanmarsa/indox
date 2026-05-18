import { getWorkspaceBySlug } from "@indox/core";

function buildScript(slug: string, base: string): string {
  const frameSrc = `${base}/w/${slug}/chat-frame`;
  return `(function(){
var FRAME='${frameSrc}';
var W=420,H=560;

var msgIcon='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
var closeIcon='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

var OFFSET=16;

var pill=document.createElement('button');
Object.assign(pill.style,{position:'fixed',bottom:OFFSET+'px',right:OFFSET+'px',zIndex:'2147483647',
  display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',borderRadius:'999px',
  border:'1px solid rgba(0,0,0,0.12)',background:'#fff',
  boxShadow:'0 4px 12px rgba(0,0,0,0.12)',cursor:'pointer',
  fontFamily:'ui-monospace,monospace',fontSize:'13px',color:'#6b7280',lineHeight:'1'});
pill.innerHTML=msgIcon+'<span>chat</span>';
document.body.appendChild(pill);

var panel=document.createElement('div');
Object.assign(panel.style,{position:'fixed',bottom:OFFSET+'px',right:OFFSET+'px',zIndex:'2147483647',
  width:W+'px',height:H+'px',display:'none',flexDirection:'column',borderRadius:'12px',
  border:'1px solid rgba(0,0,0,0.12)',background:'#fff',
  boxShadow:'0 8px 32px rgba(0,0,0,0.16)',overflow:'hidden'});
document.body.appendChild(panel);

var hdr=document.createElement('div');
Object.assign(hdr.style,{display:'flex',alignItems:'center',justifyContent:'space-between',
  padding:'10px 12px',borderBottom:'1px solid rgba(0,0,0,0.08)',flexShrink:'0',background:'#fff'});

var title=document.createElement('div');
Object.assign(title.style,{display:'flex',alignItems:'center',gap:'8px',color:'#9ca3af',
  fontFamily:'ui-monospace,monospace',fontSize:'12px'});
title.innerHTML=msgIcon.replace('width="16" height="16"','width="14" height="14"')+'<span>chat</span>';

var closeBtn=document.createElement('button');
Object.assign(closeBtn.style,{display:'flex',alignItems:'center',justifyContent:'center',
  width:'24px',height:'24px',borderRadius:'4px',border:'none',
  background:'transparent',cursor:'pointer',color:'#9ca3af',flexShrink:'0'});
closeBtn.setAttribute('aria-label','Close chat');
closeBtn.innerHTML=closeIcon;

hdr.appendChild(title);
hdr.appendChild(closeBtn);
panel.appendChild(hdr);

var frame=document.createElement('iframe');
Object.assign(frame.style,{flex:'1',border:'none',minHeight:'0',display:'block'});
frame.setAttribute('title','Chat');
frame.setAttribute('allow','clipboard-write');
panel.appendChild(frame);

function openPanel(){
  pill.style.display='none';
  panel.style.display='flex';
  if(!frame.src)frame.src=FRAME;
}
function closePanel(){
  panel.style.display='none';
  pill.style.display='flex';
}

pill.addEventListener('click',openPanel);
closeBtn.addEventListener('click',function(e){e.stopPropagation();closePanel();});
})();`;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ws = await getWorkspaceBySlug(slug);
  if (!ws || !ws.isPublic) {
    return new Response("Not Found", { status: 404 });
  }

  const base = new URL(req.url).origin;

  return new Response(buildScript(slug, base), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
