/**
 * PORTFÓLIO WANDRY - DESENVOLVEDOR WEB
 * Script Principal para Navegação e Interações
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initMobileMenu();
  initSmoothScroll();
  initActiveSectionObserver();
  initScrollReveal();
});

/**
 * 1. Navbar Fixa com Transição Suave ao Rolar
 */
function initNavbarScroll() {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('nav-scrolled');
      navbar.classList.remove('py-6');
    } else {
      navbar.classList.remove('nav-scrolled');
      navbar.classList.add('py-6');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Executa no carregamento inicial
}

/**
 * 2. Menu Mobile com Animação e Acessibilidade
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  if (!menuToggle || !mobileMenu) return;

  const toggleMenu = () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    
    if (isExpanded) {
      mobileMenu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
      mobileMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      document.body.classList.remove('overflow-hidden');
    } else {
      mobileMenu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
      mobileMenu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
  };

  menuToggle.addEventListener('click', toggleMenu);

  // Fecha o menu ao clicar em qualquer link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
      mobileMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      document.body.classList.remove('overflow-hidden');
    });
  });
}

/**
 * 3. Rolagem Suave com Compensação da Altura do Navbar Fixo
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navHeight = 80;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * 4. IntersectionObserver para Indicar a Seção Ativa no Menu
 */
function initActiveSectionObserver() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const currentId = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href').replace('#', '');
          if (href === currentId) {
            link.classList.add('text-emerald-400');
            link.classList.remove('text-neutral-400');
          } else {
            link.classList.remove('text-emerald-400');
            link.classList.add('text-neutral-400');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/**
 * 5. Animações de Rolagem (Fade-in & Slide-up via IntersectionObserver)
 */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}
