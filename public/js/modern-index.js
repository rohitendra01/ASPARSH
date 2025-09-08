/**
 * Modern JavaScript for Asparsh Website
 * Handles modern interactions, animations, and accessibility
 */

console.log('🚀 Asparsh Modern JS Loaded');

// Performance monitoring
const perfMark = (name) => {
  if ('performance' in window) {
    performance.mark(name);
  }
};

perfMark('js-start');

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  perfMark('dom-ready');
  console.log('🎯 DOM ready, starting initialization...');
  
  // Small delay to ensure Swiper library is loaded
  setTimeout(() => {
    initializeApp();
  }, 100);
});

/**
 * Also initialize when window loads (fallback)
 */
window.addEventListener('load', () => {
  console.log('🌟 Window loaded, checking if app initialized...');
  if (!window.asparshInitialized) {
    console.log('🔄 App not initialized yet, initializing now...');
    initializeApp();
  }
});

/**
 * Main application initialization
 */
function initializeApp() {
  if (window.asparshInitialized) {
    console.log('⚠️ App already initialized, skipping...');
    return;
  }
  
  console.log('🚀 Initializing Asparsh app...');
  
  // Initialize all components
  initializeSwiper();
  initializeAnimations();
  initializeTabSystem();
  initializeTestimonialCarousel();
  initializeFormEnhancements();
  initializePerformanceOptimizations();
  
  window.asparshInitialized = true;
  perfMark('app-initialized');
  
  console.log('✅ Asparsh app fully initialized!');
  
  // Log performance metrics
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      console.log(`🔥 Page loaded in ${Math.round(navigation.loadEventEnd - navigation.fetchStart)}ms`);
    });
  }
}

/**
 * Modern Swiper initialization with better performance
 */
function initializeSwiper() {
  const swiperContainer = document.querySelector('.products-swiper');
  if (!swiperContainer) {
    console.log('❌ Swiper container not found');
    return;
  }

  console.log('✅ Swiper container found, initializing...');

  // Use dynamic import for better performance
  if (window.Swiper) {
    const swiper = new Swiper('.products-swiper', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      centeredSlides: true,
      grabCursor: true,
      
      // Enhanced autoplay
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      
      // Better performance
      lazy: {
        loadPrevNext: true,
        loadPrevNextAmount: 2
      },
      
      // Accessibility
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        firstSlideMessage: 'This is the first slide',
        lastSlideMessage: 'This is the last slide'
      },
      
      // Breakpoints for responsive design
      breakpoints: {
        640: {
          slidesPerView: 1.2,
          spaceBetween: 20
        },
        768: {
          slidesPerView: 1.5,
          spaceBetween: 30
        },
        1024: {
          slidesPerView: 2,
          spaceBetween: 40
        },
        1280: {
          slidesPerView: 2.5,
          spaceBetween: 50
        }
      },
      
      // Navigation
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      
      // Pagination
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true
      },
      
      // Effects
      effect: 'coverflow',
      coverflowEffect: {
        rotate: 20,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true
      }
    });
    
    console.log('✅ Swiper initialized successfully');
  } else {
    console.log('❌ Swiper library not loaded');
  }
}

/**
 * Modern scroll-based animations using Intersection Observer
 */
function initializeAnimations() {
  // Enhanced intersection observer with better performance
  const observerOptions = {
    threshold: [0, 0.1, 0.5, 1],
    rootMargin: '0px 0px -10% 0px'
  };

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
        entry.target.classList.add('in-view');
        
        // Stagger child animations
        const children = entry.target.querySelectorAll('.animate-on-scroll');
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('in-view');
          }, index * 150); // Slightly longer stagger for better effect
        });
        
        // Unobserve after animation to improve performance
        animationObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all animation targets
  document.querySelectorAll('.animate-on-scroll, .feature-card, .step-card, .testimonial-card, .footer-animate').forEach(el => {
    animationObserver.observe(el);
  });

  // Parallax effect for hero section (optional, performance-conscious)
  const heroSection = document.querySelector('.hero-section');
  if (heroSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    
    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = heroSection.querySelectorAll('.hero-floating');
      
      parallaxElements.forEach((el, index) => {
        const speed = 0.5 + (index * 0.1);
        el.style.transform = `translateY(${scrolled * speed}px)`;
      });
      
      ticking = false;
    };

    const requestParallaxUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
  }
}

/**
 * Enhanced tab system with better accessibility
 */
function initializeTabSystem() {
  const tabHeaders = document.querySelectorAll('.tab-header');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tabUnderline = document.querySelector('.tab-underline');
  const tabContainer = document.querySelector('.tab-headers');

  if (!tabHeaders.length || !tabContainer) return;

  // Enhanced underline positioning
  function updateUnderline(activeHeader) {
    if (!activeHeader || !tabUnderline) return;

    const headerRect = activeHeader.getBoundingClientRect();
    const containerRect = tabContainer.getBoundingClientRect();
    const leftOffset = headerRect.left - containerRect.left;

    tabUnderline.style.width = `${headerRect.width}px`;
    tabUnderline.style.left = `${leftOffset}px`;
  }

  // Initialize active tab
  const initialActiveHeader = document.querySelector('.tab-header.active');
  if (initialActiveHeader) {
    updateUnderline(initialActiveHeader);
  }

  // Enhanced tab switching with keyboard support
  tabHeaders.forEach((header, index) => {
    // Add ARIA attributes
    header.setAttribute('role', 'tab');
    header.setAttribute('tabindex', header.classList.contains('active') ? '0' : '-1');
    header.setAttribute('aria-selected', header.classList.contains('active') ? 'true' : 'false');

    header.addEventListener('click', () => switchTab(header, index));
    
    // Keyboard navigation
    header.addEventListener('keydown', (e) => {
      let newIndex = index;
      
      switch (e.key) {
        case 'ArrowLeft':
          newIndex = index > 0 ? index - 1 : tabHeaders.length - 1;
          break;
        case 'ArrowRight':
          newIndex = index < tabHeaders.length - 1 ? index + 1 : 0;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabHeaders.length - 1;
          break;
        default:
          return;
      }
      
      e.preventDefault();
      switchTab(tabHeaders[newIndex], newIndex);
      tabHeaders[newIndex].focus();
    });
  });

  function switchTab(targetHeader, targetIndex) {
    // Update headers
    tabHeaders.forEach((header, i) => {
      const isActive = i === targetIndex;
      header.classList.toggle('active', isActive);
      header.setAttribute('tabindex', isActive ? '0' : '-1');
      header.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Update panes
    const targetPaneId = targetHeader.dataset.tab;
    tabPanes.forEach(pane => {
      const isActive = pane.id === targetPaneId;
      pane.classList.toggle('active', isActive);
      pane.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    updateUnderline(targetHeader);
  }

  // Responsive underline update
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const activeHeader = document.querySelector('.tab-header.active');
      if (activeHeader) updateUnderline(activeHeader);
    }, 150);
  });
}

/**
 * Enhanced testimonial carousel with better touch support
 */
function initializeTestimonialCarousel() {
  const wrapper = document.querySelector('.testimonial-carousel-wrapper');
  if (!wrapper) return;

  const cards = Array.from(wrapper.children);
  const prevBtn = document.querySelector('.testimonial-carousel-nav.prev');
  const nextBtn = document.querySelector('.testimonial-carousel-nav.next');
  const dotsContainer = document.querySelector('.testimonial-carousel-dots');

  // If 3 or fewer cards, show them all statically
  if (cards.length <= 3) {
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.justifyContent = 'center';
    wrapper.style.gap = 'clamp(1rem, 4vw, 2.5rem)';
    wrapper.style.transform = 'none';
    
    cards.forEach(card => {
      card.className = 'testimonial-card active';
      card.style.margin = '0';
    });
    
    [prevBtn, nextBtn, dotsContainer].forEach(el => {
      if (el) el.style.display = 'none';
    });
    return;
  }

  // Full carousel implementation for more than 3 cards
  let currentIndex = 0;
  let isTransitioning = false;
  let autoplayInterval;

  // Clone cards for infinite loop
  const firstClone = cards[0].cloneNode(true);
  const lastClone = cards[cards.length - 1].cloneNode(true);
  
  wrapper.appendChild(firstClone);
  wrapper.insertBefore(lastClone, cards[0]);

  const allSlides = Array.from(wrapper.children);
  const slideWidth = 100 / allSlides.length;

  // Set initial position
  wrapper.style.transform = `translateX(-${slideWidth}%)`;
  wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // Create dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    cards.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });
  }

  function updateCarousel() {
    const translateX = -((currentIndex + 1) * slideWidth);
    wrapper.style.transform = `translateX(${translateX}%)`;

    // Update active states
    allSlides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentIndex + 1);
    });

    // Update dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    }
  }

  function goToSlide(index) {
    if (isTransitioning) return;
    currentIndex = index;
    updateCarousel();
  }

  function nextSlide() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    currentIndex++;
    updateCarousel();

    // Handle infinite loop
    if (currentIndex >= cards.length) {
      setTimeout(() => {
        wrapper.style.transition = 'none';
        currentIndex = 0;
        wrapper.style.transform = `translateX(-${slideWidth}%)`;
        setTimeout(() => {
          wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          isTransitioning = false;
        }, 50);
      }, 500);
    } else {
      setTimeout(() => { isTransitioning = false; }, 500);
    }
  }

  function prevSlide() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    currentIndex--;
    updateCarousel();

    // Handle infinite loop
    if (currentIndex < 0) {
      setTimeout(() => {
        wrapper.style.transition = 'none';
        currentIndex = cards.length - 1;
        wrapper.style.transform = `translateX(-${(currentIndex + 1) * slideWidth}%)`;
        setTimeout(() => {
          wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          isTransitioning = false;
        }, 50);
      }, 500);
    } else {
      setTimeout(() => { isTransitioning = false; }, 500);
    }
  }

  // Event listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
    nextBtn.setAttribute('aria-label', 'Next testimonial');
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
    prevBtn.setAttribute('aria-label', 'Previous testimonial');
  }

  // Touch/swipe support
  let startX = 0;
  let startY = 0;
  let isDragging = false;

  wrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  wrapper.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  }, { passive: false });

  wrapper.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = startX - endX;
    const deltaY = Math.abs(startY - endY);

    // Only process horizontal swipes
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, { passive: true });

  // Autoplay with pause on hover
  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  // Only autoplay if user prefers motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startAutoplay();
    
    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);
    wrapper.addEventListener('focusin', stopAutoplay);
    wrapper.addEventListener('focusout', startAutoplay);
  }

  // Keyboard navigation
  wrapper.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextSlide();
        break;
    }
  });

  // Initial update
  updateCarousel();
}

/**
 * Form enhancements for better UX
 */
function initializeFormEnhancements() {
  // Enhanced contact forms
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Add loading states
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !form.dataset.enhanced) {
        form.dataset.enhanced = 'true';
        
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        // Re-enable after 3 seconds if no redirect
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          form.dataset.enhanced = 'false';
        }, 3000);
      }
    });

    // Enhanced input interactions
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      // Add floating label effect
      const wrapper = input.closest('.wave-group') || input.parentElement;
      
      input.addEventListener('focus', () => {
        wrapper.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          wrapper.classList.remove('focused');
        }
      });
      
      // Check initial state
      if (input.value) {
        wrapper.classList.add('focused');
      }
    });
  });
}

/**
 * Performance optimizations
 */
function initializePerformanceOptimizations() {
  // Lazy load images that are not critical
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }

  // Prefetch important pages on hover
  const importantLinks = document.querySelectorAll('a[href^="/dashboard"], a[href^="/contact"], a[href^="/pricing"]');
  
  importantLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = link.href;
      document.head.appendChild(prefetchLink);
    }, { once: true });
  });

  // Service Worker registration (if available)
  if ('serviceWorker' in navigator && 'production' === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Error handling
window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
  
  // Send error to monitoring service in production
  if ('production' === 'production') {
    // Analytics or error reporting service integration
  }
});

// Performance mark
perfMark('js-end');

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeSwiper,
    initializeAnimations,
    initializeTabSystem,
    initializeTestimonialCarousel
  };
}
