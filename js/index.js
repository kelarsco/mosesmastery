function toggleMenu(event) {
    event.stopPropagation(); // Prevents closing when clicking menu icon
    document.querySelector(".menu-icon").classList.toggle("active");
    document.querySelector(".nav-menu").classList.toggle("active");
}

 
window.onclick = function(event) {
    if (!document.querySelector(".menu-icon").contains(event.target) &&
        !document.querySelector(".nav-menu").contains(event.target)) {
        document.querySelector(".menu-icon").classList.remove("active");
        document.querySelector(".nav-menu").classList.remove("active");
    }
}



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
