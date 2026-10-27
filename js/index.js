function toggleMenu(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    var root = document.querySelector('.pg.on') || document;
    var menu = root.querySelector('.mm-menu'), btn = root.querySelector('.menu-icon');
    if (!menu) return;
    var open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (btn) { btn.classList.toggle('active', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    document.documentElement.classList.toggle('mm-lock', open);
    if (open) { var first = menu.querySelector('.mm-menu-links a'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350); }
    else if (btn) btn.focus({ preventScroll: true });
}
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = document.querySelector('.pg.on .mm-menu.open, .mm-menu.open'); if (m) toggleMenu(); }
});
document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.mm-menu-links a, .mm-menu-logo');
    if (a && !a.classList.contains('mm-menu-cta')) { var m = document.querySelector('.pg.on .mm-menu.open, .mm-menu.open'); if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('mm-lock'); var b = document.querySelector('.pg.on .menu-icon, .menu-icon'); if (b) { b.classList.remove('active'); b.setAttribute('aria-expanded', 'false'); } } }
});

 



/* reveal */
/* 
document.addEventListener("DOMContentLoaded", function() {
    const elements = document.querySelectorAll(".reveal");
  
    function revealOnScroll() {
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.90) {
          el.classList.add("active");
        }
      });
    }
  
    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // Run once on load
  });
  

  window.addEventListener('scroll', function() {
    let video = document.getElementById('video');
    let scale = Math.max(0.4, 1 - window.scrollY / 4000);
    video.style.width = (90 * scale) + 'vw';
});



let currentIndex = 1; */

function showTestimonial(index) {
  const testimonials = [
    document.getElementById('testimonial'),
    document.getElementById('testimonial2'),
    document.getElementById('testimonial3'),
    document.getElementById('testimonial4'),
    document.getElementById('testimonial5')
  ];
  const dots = document.querySelectorAll('.dot');

  testimonials.forEach((testimonial, i) => {
    testimonial.style.display = index - 1 === i ? 'flex' : 'none';
    dots[i].classList.toggle('active', index - 1 === i);
  });
  currentIndex = index;
}

function nextTestimonial() {
  const nextIndex = currentIndex === 5 ? 1 : currentIndex + 1;
  showTestimonial(nextIndex);
}

function prevTestimonial() {
  const prevIndex = currentIndex === 1 ? 5 : currentIndex - 1;
  showTestimonial(prevIndex);
}

let startX = 0;
let isDragging = false;

const slider = document.querySelector('.testimonial-slider');
if (slider) {

slider.addEventListener('mousedown', (e) => {
  startX = e.clientX;
  isDragging = true;
});

slider.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  const endX = e.clientX;
  handleSwipe(endX - startX);
  isDragging = false;
});

slider.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

slider.addEventListener('touchend', (e) => {
  const endX = e.changedTouches[0].clientX;
  handleSwipe(endX - startX);
});
}

function handleSwipe(deltaX) {
  if (Math.abs(deltaX) > 50) {
    if (deltaX < 0) {
      nextTestimonial();
    } else {
      prevTestimonial();
    }
  }
};


const items = document.querySelectorAll("#skills li");

items.forEach(li=>{
  li.addEventListener("mouseenter", () =>{
    document.getElementById("p-img").src = li.dataset.img;
    document.getElementById("p-title").textContent = li.dataset.title;
    document.getElementById("p-desc").textContent = li.dataset.desc;
  });
});
