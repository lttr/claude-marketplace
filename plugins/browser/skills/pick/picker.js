// Element picker injected into a live page: the user hovers to see a highlight
// box with the element's tag/id/classes, then clicks to pick one (or
// Ctrl/Cmd+click several, Enter to finish, Esc to cancel). The pick is left on
// `window.__picked` with a CSS selector, text, truncated outerHTML and
// attributes, and `window.__pickerDone` flips to true; the caller polls those
// two globals over `playwright-cli eval` and gets back a selector it can act on.
// It exists so "this button here" becomes a selector without the user having to
// dig through devtools.
(() => {
  if (window.__picker) return "already-armed";
  window.__picked = null; window.__pickerDone = false;
  const multi = [];
  const marks = [];   // {el, prevOutline} for restore on teardown
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;pointer-events:none;z-index:2147483647;background:rgba(0,150,255,.25);border:2px solid #09f;border-radius:2px;transition:all .03s;";
  const tip = document.createElement("div");
  tip.style.cssText = "position:fixed;pointer-events:none;z-index:2147483647;background:#09f;color:#fff;font:11px/1.4 monospace;padding:2px 6px;border-radius:3px;max-width:60vw;";
  const banner = document.createElement("div");
  banner.style.cssText = "position:fixed;bottom:0;left:0;right:0;pointer-events:none;z-index:2147483647;background:#111;color:#fff;font:12px/1.6 monospace;padding:4px 10px;text-align:center;";
  banner.textContent = "click=pick · Ctrl/Cmd+click=add to multi · Enter=finish multi · Esc=cancel";
  document.body.append(box, tip, banner);
  const sel = el => {
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      let s = el.tagName.toLowerCase();
      if (el.classList.length) s += "." + [...el.classList].map(c=>CSS.escape(c)).join(".");
      const sib = [...el.parentNode.children].filter(c=>c.tagName===el.tagName);
      if (sib.length>1) s += ":nth-of-type(" + (sib.indexOf(el)+1) + ")";
      parts.unshift(s); el = el.parentElement;
    }
    return parts.join(" > ");
  };
  const info = el => ({
    selector: sel(el), tag: el.tagName.toLowerCase(), id: el.id||null,
    classes: el.className && typeof el.className==="string" ? el.className.trim().split(/\s+/).filter(Boolean) : [],
    text: (el.textContent||"").trim().slice(0,200),
    html: (el.outerHTML||"").slice(0,500),
    attrs: [...el.attributes].map(a=>a.name+"=\""+a.value+"\"").slice(0,12)
  });
  const teardown = () => {
    document.removeEventListener("mousemove", move, true);
    document.removeEventListener("click", click, true);
    document.removeEventListener("keydown", key, true);
    marks.forEach(m => { m.el.style.outline = m.prevOutline; });
    box.remove(); tip.remove(); banner.remove(); window.__picker = false;
  };
  const move = e => {
    const el = e.target, r = el.getBoundingClientRect();
    box.style.top=r.top+"px"; box.style.left=r.left+"px"; box.style.width=r.width+"px"; box.style.height=r.height+"px";
    tip.textContent = el.tagName.toLowerCase() + (el.id?"#"+el.id:"") + (el.className&&typeof el.className==="string"?"."+el.className.trim().split(/\s+/).join("."):"");
    tip.style.top = Math.max(0,r.top-20)+"px"; tip.style.left = r.left+"px";
  };
  const click = e => {
    e.preventDefault(); e.stopPropagation();
    const i = info(e.target);
    if (e.ctrlKey || e.metaKey) {
      multi.push(i);
      marks.push({el: e.target, prevOutline: e.target.style.outline});
      e.target.style.outline = "3px solid #f0f";   // persistent magenta marker
      banner.textContent = multi.length + " selected · Ctrl/Cmd+click=add more · Enter=finish · Esc=cancel";
      return false;
    }
    window.__picked = i; window.__pickerDone = true; teardown(); return false;
  };
  const key = e => {
    if (e.key === "Escape") { e.preventDefault(); window.__picked = {cancelled:true}; window.__pickerDone = true; teardown(); }
    else if (e.key === "Enter" && multi.length) { e.preventDefault(); window.__picked = {multi}; window.__pickerDone = true; teardown(); }
  };
  document.addEventListener("mousemove", move, true);
  document.addEventListener("click", click, true);
  document.addEventListener("keydown", key, true);
  window.__picker = true; return "armed";
})()
