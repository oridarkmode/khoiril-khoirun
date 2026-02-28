/* =========================================================
   Glassmorphism Invitation - FINAL (Stabil + Featured Video)
========================================================= */

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

const LS = { RSVP: "inv_rsvp_v3", WISH: "inv_wish_v3" };
const state = { cfg: null, muted: true };

function safeText(s){ return (s ?? "").toString().replace(/[<>]/g,"").trim(); }
function qp(name){ return new URL(location.href).searchParams.get(name) || ""; }
function decodePlus(v){ return decodeURIComponent((v || "").replace(/\+/g, " ")); }

async function loadConfig(){
  const res = await fetch("./data/config.json", { cache: "no-store" });
  if(!res.ok) throw new Error("config.json tidak ditemukan");
  return res.json();
}

function setTheme(){
  const t = state.cfg.theme || {};
  if(t.bg) document.documentElement.style.setProperty("--bg", t.bg);
  if(t.accent) document.documentElement.style.setProperty("--accent", t.accent);
  if(t.accent2) document.documentElement.style.setProperty("--accent2", t.accent2);
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta && t.accent) meta.setAttribute("content", t.accent);
  document.title = state.cfg.siteTitle || document.title;
}

function setBrand(){
  $("#brandText").textContent = state.cfg.siteTitle || "Undangan";
  $("#footerBrand").textContent = state.cfg.brand || "Brand";
  $("#yearNow").textContent = new Date().getFullYear();
}

function applySectionBackgrounds(){
  const b = state.cfg.backgrounds || {};
  if($("#coverBg") && b.cover) $("#coverBg").style.backgroundImage = `url("${b.cover}")`;
  if($("#homeBg") && b.home) $("#homeBg").style.backgroundImage = `url("${b.home}")`;
  if($("#closingBg") && b.closing) $("#closingBg").style.backgroundImage = `url("${b.closing}")`;
}

function fillCover(){
  const c = state.cfg.cover || {};
  $("#coverTitleTop").textContent = c.titleTop || "The Wedding Of";
  $("#coverTitle").textContent = c.title || "Wedding Invitation";
  $("#coverDateText").textContent = c.dateText || "";
  $("#coverGreeting").textContent = c.greeting || "";
}

function setGuest(){
  const pName = state.cfg.guest?.paramName || "to";
  const raw = qp(pName);
  const name = safeText(decodePlus(raw)) || (state.cfg.guest?.defaultName || "Tamu Undangan");
  $("#guestName").textContent = name;
  $("#guestInline").textContent = name;
  $("#rsvpName").value = name !== (state.cfg.guest?.defaultName || "Tamu Undangan") ? name : "";
  $("#wishName").value = $("#rsvpName").value;
}

function setHome(){
  const home = state.cfg.home || {};

  // Salam diubah menjadi "The Wedding Of"
  $("#homeGreet").textContent = "The Wedding Of";

  // Headline tetap dari config (atau kosongkan jika diinginkan)
  $("#homeHeadline").textContent = home.headline || "";

  // Tanggal: tetap dari config cover
  $("#homeDatePill").textContent = state.cfg.cover?.dateText || "";

  // Lokasi tetap diisi (untuk fallback), tapi kita sembunyikan via CSS
  $("#homeLocPill").textContent = home.locationText || "";

  // Nama pendek mempelai + sinkronisasi ke penutup
  const groomShort = (state.cfg.couple?.groom?.name || "Mempelai Pria").split(" ")[0];
  const brideShort = (state.cfg.couple?.bride?.name || "Mempelai Wanita").split(" ")[0];
  $("#groomNameShort").textContent = groomShort;
  $("#brideNameShort").textContent = brideShort;
  $("#closingGroom").textContent = groomShort;
  $("#closingBride").textContent = brideShort;
}

function setCouple(){
  const couple = state.cfg.couple || {};
  const bride = couple.bride || {};
  const groom = couple.groom || {};
  $("#brideName").textContent = bride.name || "Mempelai Wanita";
  $("#brideParents").textContent = bride.parents || "";
  if (bride.photo) $("#bridePhoto").src = bride.photo;
  $("#brideIg").href = bride.instagram || "#";
  $("#groomName").textContent = groom.name || "Mempelai Pria";
  $("#groomParents").textContent = groom.parents || "";
  if (groom.photo) $("#groomPhoto").src = groom.photo;
  $("#groomIg").href = groom.instagram || "#";
}

/* -------- Events (buat DOM aman) -------- */
function buildEvents(){
  const wrap = $("#eventCards");
  wrap.innerHTML = "";
  const events = state.cfg.events || [];

  events.forEach((ev, i)=>{
    const card = document.createElement("article");
    card.className = "eventCard glass reveal";

    const top = document.createElement("div");
    top.className = "eventTop";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = safeText(ev.type);
    const num = document.createElement("span");
    num.className = "muted small";
    num.textContent = `#${String(i+1).padStart(2,"0")}`;
    top.appendChild(badge);
    top.appendChild(num);
    card.appendChild(top);

    const meta = document.createElement("div");
    meta.className = "eventMeta";
    meta.style.marginTop = "6px";
    meta.innerHTML = `<div><b>${safeText(ev.dateText || "")}</b></div>`;
    card.appendChild(meta);

    (ev.items || []).forEach(it=>{
      const block = document.createElement("div");
      block.className = "eventBlock";
      block.innerHTML = `
        <div class="badge" style="display:inline-block">${safeText(it.label)}</div>
        <div class="eventMeta" style="margin-top:8px">
          <div><b>${safeText(it.timeText)}</b></div>
          <div class="eventPlace">${safeText(it.place)}</div>
          <div class="muted small">${safeText(it.address)}</div>
        </div>
      `;
      card.appendChild(block);
    });

    if (ev.mapEmbed) {
      const iframe = document.createElement("iframe");
      iframe.className = "mapFrame";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.title = `Peta ${safeText(ev.type)}`;
      iframe.src = ev.mapEmbed;
      card.appendChild(iframe);
    }

    if (ev.mapDirection) {
      const btnWrap = document.createElement("div");
      btnWrap.style.cssText = "display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:10px";
      const a = document.createElement("a");
      a.className = "btn btn--ghost";
      a.href = ev.mapDirection;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Petunjuk Arah";
      btnWrap.appendChild(a);
      card.appendChild(btnWrap);
    }

    wrap.appendChild(card);
  });
}

/* -------- Countdown -------- */
function countdown(){
  const target = new Date(state.cfg.home?.eventISO || new Date().toISOString()).getTime();
  const tick = ()=>{
    const now = Date.now();
    let d = Math.max(0, target - now);
    const days = Math.floor(d/(24*3600*1000)); d -= days*24*3600*1000;
    const hrs = Math.floor(d/(3600*1000)); d -= hrs*3600*1000;
    const mins = Math.floor(d/(60*1000)); d -= mins*60*1000;
    const secs = Math.floor(d/1000);
    $("#cdDays").textContent = String(days).padStart(2,"0");
    $("#cdHours").textContent = String(hrs).padStart(2,"0");
    $("#cdMins").textContent = String(mins).padStart(2,"0");
    $("#cdSecs").textContent = String(secs).padStart(2,"0");
  };
  tick();
  setInterval(tick, 1000);
}

/* -------- Gallery: foto atas, video featured, foto bawah -------- */
function gallery(){
  const gridTop = $("#galleryPhotosTop");
  const gridBottom = $("#galleryPhotosBottom");
  const featured = $("#galleryVideoFeatured");
  gridTop.innerHTML = "";
  gridBottom.innerHTML = "";
  featured.innerHTML = "";

  const photos = state.cfg.gallery?.photos || [];
  const videos = state.cfg.gallery?.videos || [];

  const mid = Math.ceil(photos.length / 2);
  const photosTop = photos.slice(0, mid);
  const photosBottom = photos.slice(mid);

  const makePhotoItem = (src) => {
    const d = document.createElement("div");
    d.className = "gItem glass";
    d.dataset.full = src;
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Foto galeri";
    img.loading = "lazy";
    d.appendChild(img);
    return d;
  };

  photosTop.forEach(src => gridTop.appendChild(makePhotoItem(src)));

  // -------- Video featured (tengah) --------
  // Log untuk inspeksi live (cek di DevTools → Console)
  console.log("[gallery] videos (from config):", state.cfg.gallery?.videos);

  const vids = Array.isArray(state.cfg.gallery?.videos) ? state.cfg.gallery.videos : [];

  if (vids.length > 0 && vids[0]) {
    const v = vids[0];

    // Fallback poster yang benar-benar ada:
    // prioritas: v.poster -> foto pertama -> gallery-1.jpg
    const poster =
      v.poster ||
      (photos && photos.length ? photos[0] : "assets/img/gallery-1.jpg");

    const card = document.createElement("div");
    card.className = "featuredCard";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "featuredMediaLink";
    btn.setAttribute("data-video", v.src || "");
    btn.style.cssText = "all:unset;display:block;cursor:pointer;";

    const media = document.createElement("div");
    media.className = "featuredMedia";
    media.style.backgroundImage = `url('${poster}')`;

    const overlay = document.createElement("div");
    overlay.className = "featuredOverlay";
    const play = document.createElement("div");
    play.className = "featuredPlay";
    play.textContent = "▶";
    overlay.appendChild(play);

    btn.appendChild(media);
    btn.appendChild(overlay);
    card.appendChild(btn);
    featured.appendChild(card);

    // Pasang listener klik langsung di tombol
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-video") || "";
      if (!src) {
        console.warn("[gallery] data-video kosong. Cek config.json -> gallery.videos[0].src");
        return;
      }
      openVideoModal(src);
    });

    console.log("[gallery] Video tile rendered with src:", v.src, "poster:", poster);
  } else {
    console.warn("[gallery] Tidak ada item video. Pastikan data/config.json -> gallery.videos adalah array dengan minimal 1 item.");
    // (Opsional) render placeholder agar terlihat blok ini berjalan
    // Hapus blok ini jika tidak ingin placeholder.
    const card = document.createElement("div");
    card.className = "featuredCard";
    const info = document.createElement("div");
    info.style.cssText = "padding:32px;text-align:center;color:#fff;";
    info.innerHTML = `
      <div class="featuredMedia" style="display:block;background:#222;aspect-ratio:16/9;border-radius:0;"></div>
      <div style="margin-top:12px;font-weight:700;">Video belum dikonfigurasi</div>
      <div class="muted small" style="margin-top:4px;">Tambahkan array "gallery.videos" di data/config.json</div>
    `;
    card.appendChild(info);
    featured.appendChild(card);
  }

  photosBottom.forEach(src => gridBottom.appendChild(makePhotoItem(src)));

  // Photo modal
  const photoModal = $("#photoModal");
  const photoFull = $("#photoFull");
  function openPhoto(src){
    photoFull.src = src;
    photoModal.classList.add("show");
    photoModal.setAttribute("aria-hidden","false");
  }
  function closePhoto(){
    photoModal.classList.remove("show");
    photoModal.setAttribute("aria-hidden","true");
  }
  $("#photoClose").addEventListener("click", closePhoto);
  photoModal.addEventListener("click",(e)=>{ if(e.target===photoModal) closePhoto(); });

  // Video modal
  const videoModal = $("#videoModal");
  const player = $("#videoPlayer");
  function openVideoModal(src){
    player.src = src;
    videoModal.classList.add("show");
    videoModal.setAttribute("aria-hidden","false");
    player.play().catch(()=>{});
  }
  function closeVideo(){
    player.pause();
    player.removeAttribute("src");
    player.load();
    videoModal.classList.remove("show");
    videoModal.setAttribute("aria-hidden","true");
  }
  $("#videoClose").addEventListener("click", closeVideo);
  videoModal.addEventListener("click",(e)=>{ if(e.target===videoModal) closeVideo(); });

  // Delegasi klik untuk foto
  const onPhotoGridClick = (e)=>{
    const p = e.target.closest("[data-full]");
    if(p){ openPhoto(p.dataset.full); }
  };
  gridTop.addEventListener("click", onPhotoGridClick);
  gridBottom.addEventListener("click", onPhotoGridClick);

  // ESC
  window.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){ closePhoto(); closeVideo(); }
  });
}

/* -------- Gifts -------- */
function gifts(){
  const wrap = $("#giftWrap");
  wrap.innerHTML = "";
  if(!state.cfg.gifts?.enabled){
    $("#gifts").style.display = "none";
    return;
  }

  (state.cfg.gifts.options || []).forEach((g)=>{
    const d = document.createElement("div");
    d.className = "giftCard glass reveal";

    const top = document.createElement("div");
    top.className = "giftTop";

    if(g.logo){
      const logo = document.createElement("img");
      logo.className = "giftLogo";
      logo.src = g.logo;
      logo.alt = `Logo ${safeText(g.note || g.label)}`;
      logo.loading = "lazy";
      top.appendChild(logo);
    }

    const txt = document.createElement("div");
    txt.style.textAlign = "left";
    txt.innerHTML = `
      <div class="giftNote">${safeText(g.note || g.label)}</div>
      <h4 style="margin:4px 0 0">${safeText(g.label)}</h4>
    `;
    top.appendChild(txt);

    const box = document.createElement("div");
    box.className = "valueBox";
    box.innerHTML = `
      <b>${safeText(g.name)}</b>
      <div class="mono">${safeText(g.value)}</div>
    `;

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; justify-content:center";

    const btnCopy = document.createElement("button");
    btnCopy.className = "btn btn--primary";
    btnCopy.type = "button";
    btnCopy.setAttribute("data-copy", safeText(g.value));
    btnCopy.innerHTML = `<span class="btn__glow" aria-hidden="true"></span> Salin`;

    const btnShare = document.createElement("button");
    btnShare.className = "btn btn--ghost";
    btnShare.type = "button";
    btnShare.setAttribute("data-share", safeText(g.value));
    btnShare.textContent = "Bagikan";

    actions.appendChild(btnCopy);
    actions.appendChild(btnShare);

    const thanks = document.createElement("p");
    thanks.className = "tiny muted";
    thanks.style.margin = "10px 0 0";
    thanks.textContent = "Terima kasih atas perhatian dan doanya 🙏";

    d.appendChild(top);
    d.appendChild(box);
    d.appendChild(actions);
    d.appendChild(thanks);

    wrap.appendChild(d);
  });

  wrap.addEventListener("click", async (e)=>{
    const copyBtn = e.target.closest("[data-copy]");
    const shareBtn = e.target.closest("[data-share]");
    if(copyBtn){
      const val = copyBtn.getAttribute("data-copy");
      try{
        await navigator.clipboard.writeText(val);
        copyBtn.textContent = "Tersalin ✓";
        setTimeout(()=>copyBtn.innerHTML = `<span class="btn__glow" aria-hidden="true"></span> Salin`, 1200);
      }catch{
        alert("Gagal salin otomatis. Salin manual ya: " + val);
      }
    }
    if(shareBtn){
      const val = shareBtn.getAttribute("data-share");
      if(navigator.share){
        navigator.share({ title:"Kado Digital", text: val }).catch(()=>{});
      }else{
        alert("Browser belum support share. Kamu bisa salin teks ini:\n" + val);
      }
    }
  });
}

/* -------- ICS -------- */
function makeICS({title, startISO, durationHours=3, location="", description=""}){
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationHours*3600*1000);
  const fmt = (d)=> new Date(d).toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Glass Invite//GitHub Pages//ID
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@glass-invite
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(start)}
DTEND:${fmt(end)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "undangan.ics";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* -------- Audio + Gate -------- */
function setMutedUI(muted){
  state.muted = muted;
  $("#btnMute").setAttribute("aria-pressed", String(!muted));
  $("#btnMuteGate").setAttribute("aria-pressed", String(!muted));
  $("#btnMuteGate").textContent = muted ? "Musik: Off" : "Musik: On";
}
async function playAudio(){
  const bgm = $("#bgm");
  bgm.muted = state.muted;
  try{ await bgm.play(); }catch{}
}
function wireAudio(){
  const bgm = $("#bgm");
  const audioSrc = state.cfg.music?.src || "";
  bgm.src = audioSrc;

  if(!audioSrc){
    $("#btnMute").style.display = "none";
    $("#btnMuteGate").style.display = "none";
    $("#btnOpen").addEventListener("click", ()=>$("#coverGate").classList.add("hidden"));
    return;
  }

  setMutedUI(!!state.cfg.music?.startMuted);

  const toggle = async ()=>{
    setMutedUI(!state.muted);
    bgm.muted = state.muted;
    if(!state.muted) await playAudio();
  };
  $("#btnMute").addEventListener("click", toggle);
  $("#btnMuteGate").addEventListener("click", toggle);
  $("#btnOpen").addEventListener("click", async ()=>{
    $("#coverGate").classList.add("hidden");
    await playAudio();
  });
}

/* -------- Wishes & RSVP -------- */
function readLS(key){
  try{ return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch{ return []; }
}
function writeLS(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function wishItem(w){
  const el = document.createElement("div");
  el.className = "wish";
  const when = w.createdAt ? new Date(w.createdAt).toLocaleString("id-ID", { dateStyle:"medium", timeStyle:"short" }) : "";
  el.innerHTML = `<b>${safeText(w.name || "Tamu")}</b><p>${safeText(w.text || "")}</p>${when ? `<small>${when}</small>` : ""}`;
  return el;
}

async function postToSheet(payload){
  if(!state.cfg.sheet?.enabled) return { ok:false, msg:"sheet-disabled" };
  const url = state.cfg.sheet?.postEndpoint;
  if(!url) return { ok:false, msg:"missing-endpoint" };
  try{
    await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, secret: state.cfg.sheet.secret }) });
    return { ok:true };
  }catch(err){
    return { ok:false, msg: err.message || "failed" };
  }
}

function fetchWishesJSONP(limit=100){
  return new Promise((resolve)=>{
    if(!state.cfg.sheet?.enabled) return resolve(null);
    const url = state.cfg.sheet?.readEndpoint;
    if(!url) return resolve(null);
    const cbName = "wishes_cb_" + Math.random().toString(16).slice(2);
    window[cbName] = (data)=>{
      try{ resolve(Array.isArray(data?.wishes) ? data.wishes : []); }
      finally{ delete window[cbName]; script.remove(); }
    };
    const script = document.createElement("script");
    script.src = `${url}?type=wishes&limit=${encodeURIComponent(limit)}&callback=${encodeURIComponent(cbName)}`;
    script.onerror = ()=>{ delete window[cbName]; script.remove(); resolve(null); };
    document.body.appendChild(script);
  });
}

async function renderWishes(){
  const wrap = $("#wishList");
  wrap.innerHTML = `<p class="muted small">Memuat ucapan...</p>`;
  let list = await fetchWishesJSONP(200);
  if(!list){ list = readLS(LS.WISH); }
  wrap.innerHTML = "";
  if(!list.length){
    wrap.innerHTML = `<p class="muted small">Belum ada ucapan. Jadilah yang pertama 😊</p>`;
    return;
  }
  list.slice().reverse().forEach(w => wrap.appendChild(wishItem(w)));
}

function wireRSVP(){
  if(!state.cfg.rsvp?.enabled){
    $("#rsvp").style.display = "none";
    return;
  }
  $("#rsvpPax").max = String(state.cfg.rsvp.maxPax || 5);

  $("#rsvpForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = safeText($("#rsvpName").value);
    const attend = $("#rsvpAttend").value;
    const pax = Math.max(1, Math.min(Number($("#rsvpPax").value || 1), Number(state.cfg.rsvp.maxPax || 5)));
    const msg = safeText($("#rsvpMsg").value);
    if(!name){ $("#rsvpNote").textContent = "Nama wajib diisi."; return; }
    const entry = { type:"rsvp", name, attend, pax, msg, createdAt: new Date().toISOString() };
    const res = await postToSheet(entry);
    $("#rsvpNote").textContent = res.ok ? "RSVP terkirim ✓" : "RSVP tersimpan lokal (endpoint belum siap).";
    const list = readLS(LS.RSVP); list.unshift(entry); writeLS(LS.RSVP, list);
    $("#rsvpForm").reset(); $("#rsvpPax").value = 1;
  });

  $("#wishForm").addEventListener("submit", async (e)=>{
    e.preventDefault();

    // Honeypot: jika terisi, anggap bot → jangan kirim
    const hp = $("#hp_trap_wish")?.value?.trim();
    if (hp) { return; }

    const name = safeText($("#wishName").value);
    const text = safeText($("#wishText").value);

    if(!name || !text){ alert("Nama dan ucapan wajib diisi."); return; }
    const entry = { type:"wish", name, text, createdAt: new Date().toISOString() };
    const res = await postToSheet(entry);
    const list = readLS(LS.WISH); list.unshift(entry); writeLS(LS.WISH, list);
    $("#wishForm").reset();
    await renderWishes();
    if(!res.ok){ console.warn("Sheet endpoint not ready. Stored locally."); }
  });

  $("#btnRefreshWishes").addEventListener("click", ()=>renderWishes());
  renderWishes();
}

/* -------- Closing, Reveal, UI, SW -------- */
function closing(){
  $("#closingTitle").textContent = state.cfg.closing?.title || "Terima Kasih";
  $("#closingDesc").textContent = state.cfg.closing?.desc || "";
}

/* RENAME DARI story() → renderStory() AGAR TIDAK BENTROK DENGAN id="story" */
function renderStory(){
  const wrap = $("#storyWrap");
  wrap.innerHTML = "";
  (state.cfg.story || []).forEach((s)=>{
    const d = document.createElement("div");
    d.className = "tItem glass reveal";
    d.innerHTML = `
      <div class="tTop">
        <span class="year">${safeText(s.year)}</span>
        <span class="muted small">—</span>
      </div>
      <h4>${safeText(s.title)}</h4>
      <p>${safeText(s.desc)}</p>
    `;
    wrap.appendChild(d);
  });
}

function reveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting) en.target.classList.add("show"); });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el=>io.observe(el));
}
function wireUI(){
  $("#btnTop").addEventListener("click", ()=>window.scrollTo({ top:0, behavior:"smooth" }));
  $("#btnIcs").addEventListener("click", ()=>{
    makeICS({
      title: state.cfg.cover?.title || "Undangan Pernikahan",
      startISO: state.cfg.home?.eventISO || new Date().toISOString(),
      durationHours: 3,
      location: state.cfg.home?.locationText || "",
      description: "Undangan Pernikahan"
    });
  });
}
function registerSW(){
  // Tambahkan flag ?nosw untuk mematikan SW saat pengembangan
  if ("serviceWorker" in navigator && !location.search.includes("nosw")) {
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
}

/* -------- Init -------- */
(async function init(){
  try{
    state.cfg = await loadConfig();
    setTheme(); setBrand(); fillCover(); applySectionBackgrounds();
    setGuest(); setHome(); setCouple(); buildEvents();
    gallery(); renderStory(); gifts(); wireRSVP(); closing();
    countdown(); wireAudio(); wireUI(); reveal(); registerSW();
  }catch(err){
    console.error(err);
    alert("Gagal memuat undangan. Pastikan struktur folder & path file benar.");
  }
})();



