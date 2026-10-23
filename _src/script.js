/* hero slideshow */
(function(){
const root = document.getElementById('heroSlideshow');
if (!root) return;
const slides = [...root.querySelectorAll('.slide')];
const dots = [...root.querySelectorAll('.dots button')];
const captionEl = document.querySelector('#heroCaption span:last-child');
let idx = 0;
let timer;
function show(i){
idx = (i + slides.length) % slides.length;
const s = slides[idx];
slides.forEach((sl, k) => sl.classList.toggle('active', k === idx));
dots.forEach((d, k) => d.classList.toggle('active', k === idx));
if (captionEl && s.dataset.caption) captionEl.textContent = s.dataset.caption;
}
function stop(){ if (timer) clearInterval(timer); }
function start(){ stop(); timer = setInterval(() => show(idx + 1), 5000); }
dots.forEach(d => d.addEventListener('click', () => { show(+d.dataset.idx); start(); }));
root.addEventListener('mouseenter', stop);
root.addEventListener('mouseleave', start);
root.addEventListener('keydown', e => {
if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ show(idx + (e.key === 'ArrowRight' ? 1 : -1)); start(); }
});
start();
})();
/* fade-in on scroll */
(function(){
const els = document.querySelectorAll('.fade-up');
if (!('IntersectionObserver' in window)){ els.forEach(el => el.classList.add('in')); return; }
const io = new IntersectionObserver(entries => {
entries.forEach(e => {
if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
});
}, {threshold: .12});
els.forEach(el => io.observe(el));
})();
/* active nav link while scrolling the home page */
(function(){
const links = [...document.querySelectorAll('nav.primary a')].filter(a => a.pathname === location.pathname && document.getElementById(a.hash.slice(1)));
if (!links.length) return;
function update(){
const y = window.scrollY + 140;
let active = links[0].hash;
links.forEach(a => { if (document.getElementById(a.hash.slice(1)).offsetTop <= y) active = a.hash; });
links.forEach(a => a.classList.toggle('active', a.hash === active));
}
window.addEventListener('scroll', update, {passive: true});
update();
})();
/* contact form → WhatsApp */
function handleContactForm(e) {
e.preventDefault();
var f = e.target;
if (!f.checkValidity()) { f.reportValidity(); return false; }
var name = document.getElementById('cfName').value;
var phone = document.getElementById('cfPhone').value;
var email = document.getElementById('cfEmail').value;
var service = document.getElementById('cfService').value;
var msg = document.getElementById('cfMsg').value;
var text = '📋 *طلب جديد من الموقع*\n\n'
+ '👤 *الاسم:* ' + name + '\n'
+ '📞 *الهاتف:* ' + phone + '\n'
+ '📧 *الإيميل:* ' + email + '\n'
+ '📦 *الخدمة:* ' + service + '\n'
+ '🌐 *الصفحة:* ' + location.pathname + '\n';
if (msg) text += '💬 *التفاصيل:* ' + msg + '\n';
document.getElementById('waBtn1').href = 'https://wa.me/9647751687406?text=' + encodeURIComponent(text);
var choose = document.getElementById('waChoose');
choose.style.display = 'block';
choose.scrollIntoView({behavior:'smooth', block:'center'});
return false;
}
/* mobile nav */
(function(){
const btn = document.getElementById('hamburger');
const nav = document.getElementById('mobileNav');
if (!btn || !nav) return;
function close(){
nav.classList.remove('open');
btn.setAttribute('aria-expanded','false');
document.body.style.overflow = '';
}
btn.addEventListener('click', () => {
const open = nav.classList.toggle('open');
btn.setAttribute('aria-expanded', open);
document.body.style.overflow = open ? 'hidden' : '';
});
nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
if ('serviceWorker' in navigator) {
window.addEventListener('load', () => {
navigator.serviceWorker.register('/sw.js').catch(() => {});
});
}
