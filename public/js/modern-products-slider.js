
function initializeModernProductsSlider() {
  const swiperEl = document.querySelector('.products-swiper.swiper');
  if (!swiperEl) return; // guard

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const wrapper = swiperEl.querySelector('.swiper-wrapper');
  if (!wrapper) return;

  // we will re-query slides when needed (do not capture once-only)
  const nextEl = swiperEl.querySelector('.swiper-button-next');
  const prevEl = swiperEl.querySelector('.swiper-button-prev');

  function calcSlidesPerView() {
  return 1;
  }

  // Calculate spacing between slides
  function calcSpaceBetween() {
    const w = window.innerWidth;
    if (w >= 1024) return 32;      
    if (w >= 768) return 24;       
    return 16;                      
  }

  // Determine if we should use loop (avoid loop issues when slides <= visible)
  function shouldLoop(slidesCount) {
    return slidesCount > 1;
  }

  // Get initial configuration
  let slidesPerView = 1;
  let spaceBetween = calcSpaceBetween();
  let slides = Array.from(wrapper.querySelectorAll('.swiper-slide'));
  let loop = shouldLoop(slides.length);

  const swiperOptions = {
    // Core settings
    slidesPerView,
    spaceBetween,
  // keep the single visible card centered
  centeredSlides: true,
    grabCursor: true,
    
    // Loop configuration - only when safe
  loop,
  loopedSlides: loop ? Math.max(slides.length, 1) : 0,
    
    // Autoplay configuration
    autoplay: prefersReducedMotion ? false : {
      delay: 4000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
      waitForTransition: true
    },

    // Smooth transitions
    speed: prefersReducedMotion ? 0 : 600,
    effect: 'slide',
    
    // Navigation (hidden but functional for keyboard/screen readers)
    navigation: {
      nextEl: nextEl || null,
      prevEl: prevEl || null,
    },

    pagination: false,

    breakpoints: {
      640: { spaceBetween: 16 },
      768: { spaceBetween: 24 },
      1024: { spaceBetween: 32 },
      1200: { spaceBetween: 36 }
    },

    lazy: {
      loadPrevNext: true,
      loadPrevNextAmount: 2,
      elementClass: 'swiper-lazy',
      loadingClass: 'swiper-lazy-loading'
    },
    
    a11y: {
      enabled: true,
      prevSlideMessage: 'Previous product',
      nextSlideMessage: 'Next product',
      firstSlideMessage: 'This is the first product',
      lastSlideMessage: 'This is the last product',
    },

    observer: true,
    observeParents: true,
    observeSlideChildren: true,
    
    watchOverflow: true,
    preventInteractionOnTransition: true,
    
    on: {
      init() {
        this.slides.forEach((slide, index) => {
          slide.setAttribute('aria-label', `Product ${index + 1} of ${this.slides.length}`);
        });
        
        this.el.setAttribute('tabindex', '0');
        this.el.setAttribute('role', 'region');
        this.el.setAttribute('aria-label', 'Product showcase - use arrow keys to navigate');
        
      },
      
      beforeTransitionStart() {
        this.slides.forEach(slide => {
          slide.style.willChange = 'transform';
        });
      },
      
      transitionEnd() {
        this.slides.forEach(slide => {
          slide.style.willChange = 'auto';
        });
      },

      slideChange() {
        const currentSlide = this.slides[this.activeIndex];
        if (currentSlide) {
          const slideText = currentSlide.querySelector('.product-title')?.textContent || '';
          if (slideText) {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = `Now showing: ${slideText}`;
            document.body.appendChild(announcement);
            
            setTimeout(() => {
              document.body.removeChild(announcement);
            }, 1000);
          }
        }
      }
    }
  };

  const existingInstance = swiperEl.__swiperInstance || swiperEl.swiper || null;
  if (existingInstance) {
    try {
      existingInstance.destroy(true, true);
    } catch (e) {
      console.warn('Error destroying previous Swiper instance:', e);
    }
    try { swiperEl.__swiperInstance = null; } catch (e) {}
    try { swiperEl.swiper = undefined; } catch (e) {}
  }

  let swiper;
  try {
    swiper = new Swiper(swiperEl, swiperOptions);
    try { swiperEl.__swiperInstance = swiper; } catch (e) {}
    try { swiperEl.swiper = swiper; } catch (e) {}
  } catch (err) {
    console.warn('Swiper initialization failed:', err);
    
    if (wrapper) {
      wrapper.style.display = 'flex';
      wrapper.style.flexWrap = 'wrap';
      wrapper.style.gap = '1rem';
      slides.forEach(slide => {
        slide.style.flex = '0 0 auto';
        slide.style.width = 'auto';
        slide.style.maxWidth = '400px';
      });
    }
    return;
  }

  function safeAutoplayPause(sw) {
    try { if (sw.autoplay && typeof sw.autoplay.pause === 'function') return sw.autoplay.pause(); } catch (e) {}
    try { if (sw.autoplay && typeof sw.autoplay.stop === 'function') return sw.autoplay.stop(); } catch (e) {}
  }
  function safeAutoplayResume(sw) {
    try { if (sw.autoplay && typeof sw.autoplay.resume === 'function') return sw.autoplay.resume(); } catch (e) {}
    try { if (sw.autoplay && typeof sw.autoplay.start === 'function') return sw.autoplay.start(); } catch (e) {}
  }

  const pauseTargets = [swiperEl, nextEl, prevEl].filter(Boolean);
  
  pauseTargets.forEach(el => {
  el.addEventListener('mouseenter', () => safeAutoplayPause(swiper));
  el.addEventListener('focusin', () => safeAutoplayPause(swiper), { passive: true });
  el.addEventListener('mouseleave', () => { if (!prefersReducedMotion) safeAutoplayResume(swiper); });
  el.addEventListener('focusout', () => { if (!prefersReducedMotion) safeAutoplayResume(swiper); }, { passive: true });
  });

  swiperEl.addEventListener('touchstart', () => safeAutoplayPause(swiper), { passive: true });
  swiperEl.addEventListener('touchend', () => {
    if (!prefersReducedMotion) setTimeout(() => safeAutoplayResume(swiper), 900);
  }, { passive: true });

  swiperEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      swiper.slidePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      swiper.slideNext();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (swiper.autoplay) {
        if (swiper.autoplay.running) {
          swiper.autoplay.pause();
        } else if (!prefersReducedMotion) {
          swiper.autoplay.resume();
        }
      }
    }
  });

  let resizeTimer = null;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!swiper || swiper.destroyed) return;

      const newSlidesPerView = calcSlidesPerView();
      const newSpaceBetween = calcSpaceBetween();
      slides = Array.from(wrapper.querySelectorAll('.swiper-slide'));
      const newLoop = shouldLoop(slides.length);

      if (newLoop !== !!swiper.params.loop) {
        try {
          swiper.destroy(true, true);
          swiperEl.__swiperInstance = null;
        } catch (e) {
          console.warn('Error destroying Swiper during resize reinit:', e);
        }

        setTimeout(() => {
          try {
            initializeModernProductsSlider();
          } catch (e) {
            console.warn('Error reinitializing slider after resize:', e);
          }
        }, 80);

        return; 
      }

      if (newSlidesPerView !== swiper.params.slidesPerView || newSpaceBetween !== swiper.params.spaceBetween) {
        swiper.params.slidesPerView = newSlidesPerView;
        swiper.params.spaceBetween = newSpaceBetween;
        try { swiper.update(); } catch (e) { console.warn('Error updating swiper params:', e); }
      }
    }, 150);
  };

  window.addEventListener('resize', handleResize, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === swiperEl) {
          if (entry.isIntersecting) {
            if (swiper.autoplay && !prefersReducedMotion) {
              swiper.autoplay.resume();
            }
          } else {
            if (swiper.autoplay && swiper.autoplay.running) {
              swiper.autoplay.pause();
            }
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '100px 0px'
    });
    
    observer.observe(swiperEl);
  }

  document.addEventListener('visibilitychange', () => {
    if (!swiper || swiper.destroyed) return;
    
    if (document.hidden) {
      if (swiper.autoplay && swiper.autoplay.running) {
        swiper.autoplay.pause();
      }
    } else {
      if (swiper.autoplay && !prefersReducedMotion) {
        swiper.autoplay.resume();
      }
    }
  });

  return swiper;
}

document.addEventListener('DOMContentLoaded', () => {
  const waitForSwiper = (timeout = 5000) => {
    return new Promise((resolve, reject) => {
      if (typeof Swiper !== 'undefined') {
        resolve();
        return;
      }

      const interval = setInterval(() => {
        if (typeof Swiper !== 'undefined') {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Swiper library not loaded within timeout'));
      }, timeout);
    });
  };

  waitForSwiper().then(() => {
    initializeModernProductsSlider();
  }).catch((err) => {
    console.warn('Swiper library not available, using fallback display:', err.message);
    
    const wrapper = document.querySelector('.products-swiper .swiper-wrapper');
    if (wrapper) {
      wrapper.style.display = 'grid';
      wrapper.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
      wrapper.style.gap = '1.5rem';
      wrapper.style.padding = '1rem';
      
      const slides = wrapper.querySelectorAll('.swiper-slide');
      slides.forEach(slide => {
        slide.style.width = 'auto';
        slide.style.display = 'block';
      });
    }
  });
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeModernProductsSlider };
}