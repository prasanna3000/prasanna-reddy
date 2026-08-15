document.getElementById('year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .project, .section-heading, .about-copy, .contact').forEach((item) => observer.observe(item));

if (window.particlesJS && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.particlesJS('particles-js', {
    particles: {
      number: { value: 72, density: { enable: true, value_area: 900 } },
      color: { value: ['#c9ff5b', '#9a72ff', '#ecebe8'] },
      shape: { type: 'circle' },
      opacity: { value: 0.68, random: true },
      size: { value: 2.7, random: true },
      line_linked: { enable: true, distance: 155, color: '#9a72ff', opacity: 0.28, width: 1 },
      move: { enable: true, speed: 0.7, direction: 'none', random: true, straight: false, out_mode: 'out' }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: false }, resize: true },
      modes: { grab: { distance: 130, line_linked: { opacity: 0.32 } } }
    },
    retina_detect: true
  });
}
