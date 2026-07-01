// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Offset for fixed navbar
        behavior: 'smooth'
      });
    }
  });
});

// Optional: Change navbar background on scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(11, 15, 25, 0.9)';
    nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
  } else {
    nav.style.background = 'rgba(11, 15, 25, 0.7)';
    nav.style.boxShadow = 'none';
  }
});
