const perfMark = (name) => {
  if ('performance' in window) {
    performance.mark(name);
  }
};


document.addEventListener('DOMContentLoaded', () => {
  perfMark('dom-ready');

  const waitForSwiper = (timeout = 5000) => {
    return new Promise((resolve, reject) => {
      if (window.Swiper) return resolve();

      const scripts = Array.from(document.getElementsByTagName('script'));
      const swiperScript = scripts.find(s => s.src && /swiper/i.test(s.src));
      if (swiperScript) {
        const onLoad = () => {
          swiperScript.removeEventListener('load', onLoad);
          swiperScript.removeEventListener('error', onErr);
          requestAnimationFrame(() => resolve());
        };
        const onErr = () => {
          swiperScript.removeEventListener('load', onLoad);
          swiperScript.removeEventListener('error', onErr);
        };
        swiperScript.addEventListener('load', onLoad);
        swiperScript.addEventListener('error', onErr);
      }

      const start = (performance && performance.now) ? performance.now() : Date.now();
      const check = () => {
        if (window.Swiper) return resolve();
        const now = (performance && performance.now) ? performance.now() : Date.now();
        if (now - start >= timeout) return reject(new Error('Timed out waiting for Swiper'));
        requestAnimationFrame(check);
      };
      check();
    });
  };

  waitForSwiper(5000).then(() => {
    initializeApp();
  }).catch((err) => {
    // If Swiper never appears, initialize anyway to avoid blocking the app
    console.warn('Swiper not available after timeout, continuing initialization', err && err.message);
    initializeApp();
  });
});

window.addEventListener('load', () => {
  if (!window.asparshInitialized) {
    initializeApp();
  }
});

function initializeApp() {
  if (window.asparshInitialized) {
    return;
  }
  
  
  initializeSwiper();
  initializeAnimations();
  initializeTabSystem();
  initializeTestimonialCarousel();
  initializeFormEnhancements();
  initializePerformanceOptimizations();
  
  window.asparshInitialized = true;
  perfMark('app-initialized');
  

}

function initializeSwiper() {
  const swiperContainer = document.querySelector('.products-swiper');
  if (!swiperContainer) {
    return;
  }


    const swiper = new Swiper('.products-swiper', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      centeredSlides: true,
      grabCursor: true,
      
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      
      lazy: {
        loadPrevNext: true,
        loadPrevNextAmount: 2
      },
      
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        firstSlideMessage: 'This is the first slide',
        lastSlideMessage: 'This is the last slide'
      },
      
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
      
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true
      },
      
      effect: 'coverflow',
      coverflowEffect: {
        rotate: 20,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true
      }
    });
    
}

function initializeAnimations() {
  const observerOptions = {
    threshold: [0, 0.1, 0.5, 1],
    rootMargin: '0px 0px -10% 0px'
  };

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
        entry.target.classList.add('in-view');
        
        const children = entry.target.querySelectorAll('.animate-on-scroll');
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('in-view');
          }, index * 150);
        });
        
        animationObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll, .feature-card, .step-card, .testimonial-card, .footer-animate').forEach(el => {
    animationObserver.observe(el);
  });

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

function initializeTabSystem() {
  const tabHeaders = document.querySelectorAll('.tab-header');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tabUnderline = document.querySelector('.tab-underline');
  const tabContainer = document.querySelector('.tab-headers');

  if (!tabHeaders.length || !tabContainer) return;

  function updateUnderline(activeHeader) {
    if (!activeHeader || !tabUnderline) return;

    const headerRect = activeHeader.getBoundingClientRect();
    const containerRect = tabContainer.getBoundingClientRect();
    const leftOffset = headerRect.left - containerRect.left;

    tabUnderline.style.width = `${headerRect.width}px`;
    tabUnderline.style.left = `${leftOffset}px`;
  }

  const initialActiveHeader = document.querySelector('.tab-header.active');
  if (initialActiveHeader) {
    updateUnderline(initialActiveHeader);
  }

  tabHeaders.forEach((header, index) => {
    header.setAttribute('role', 'tab');
    header.setAttribute('tabindex', header.classList.contains('active') ? '0' : '-1');
    header.setAttribute('aria-selected', header.classList.contains('active') ? 'true' : 'false');

    header.addEventListener('click', () => switchTab(header, index));
    
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
    tabHeaders.forEach((header, i) => {
      const isActive = i === targetIndex;
      header.classList.toggle('active', isActive);
      header.setAttribute('tabindex', isActive ? '0' : '-1');
      header.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const targetPaneId = targetHeader.dataset.tab;
    tabPanes.forEach(pane => {
      const isActive = pane.id === targetPaneId;
      pane.classList.toggle('active', isActive);
      pane.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    updateUnderline(targetHeader);
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const activeHeader = document.querySelector('.tab-header.active');
      if (activeHeader) updateUnderline(activeHeader);
    }, 150);
  });
}

function initializeTestimonialCarousel() {
  const wrapper = document.querySelector('.testimonial-carousel-wrapper');
  if (!wrapper) return;

  const cards = Array.from(wrapper.children);
  const prevBtn = document.querySelector('.testimonial-carousel-nav.prev');
  const nextBtn = document.querySelector('.testimonial-carousel-nav.next');
  const dotsContainer = document.querySelector('.testimonial-carousel-dots');

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

  let currentIndex = 0;
  let isTransitioning = false;
  let autoplayInterval;

  const firstClone = cards[0].cloneNode(true);
  const lastClone = cards[cards.length - 1].cloneNode(true);
  
  wrapper.appendChild(firstClone);
  wrapper.insertBefore(lastClone, cards[0]);

  const allSlides = Array.from(wrapper.children);
  
  // Each slide should be 100% width, translate by 100% increments
  wrapper.style.transform = `translateX(-100%)`;
  wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

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
    // Translate by 100% for each slide position
    const translateX = -((currentIndex + 1) * 100);
    wrapper.style.transform = `translateX(${translateX}%)`;

    allSlides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentIndex + 1);
    });

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

    if (currentIndex >= cards.length) {
      setTimeout(() => {
        wrapper.style.transition = 'none';
        currentIndex = 0;
        wrapper.style.transform = `translateX(-100%)`;
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

    if (currentIndex < 0) {
      setTimeout(() => {
        wrapper.style.transition = 'none';
        currentIndex = cards.length - 1;
        wrapper.style.transform = `translateX(-${(currentIndex + 1) * 100}%)`;
        setTimeout(() => {
          wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          isTransitioning = false;
        }, 50);
      }, 500);
    } else {
      setTimeout(() => { isTransitioning = false; }, 500);
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
    nextBtn.setAttribute('aria-label', 'Next testimonial');
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
    prevBtn.setAttribute('aria-label', 'Previous testimonial');
  }

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
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const curX = touch.clientX;
    const curY = touch.clientY;
    const deltaX = curX - startX;
    const deltaY = curY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const threshold = 10;

    if (absX > absY && absX > threshold) {
      e.preventDefault();
    } else {
      return;
    }
  }, { passive: false });

  wrapper.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = startX - endX;
    const deltaY = Math.abs(startY - endY);

    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, { passive: true });

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startAutoplay();
    
    wrapper.addEventListener('mouseenter', stopAutoplay);
    wrapper.addEventListener('mouseleave', startAutoplay);
    wrapper.addEventListener('focusin', stopAutoplay);
    wrapper.addEventListener('focusout', startAutoplay);
  }

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

  updateCarousel();
}

function initializeFormEnhancements() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;

      if (form.dataset.submitting === 'true') {
        return;
      }

      form.dataset.submitting = 'true';
      form._originalSubmitText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      if (form._submitTimeout) {
        clearTimeout(form._submitTimeout);
        form._submitTimeout = null;
      }

      form._navigationInProgress = false;
      const onPageHide = () => { form._navigationInProgress = true; };
      const onBeforeUnload = () => { form._navigationInProgress = true; };
      window.addEventListener('pagehide', onPageHide, { once: true });
      window.addEventListener('beforeunload', onBeforeUnload, { once: true });

      if (!window.__asparshNetworkPatched) {
        window.__asparshNetworkPatched = true;

        if (window.fetch) {
          const _origFetch = window.fetch.bind(window);
          window.fetch = function(...args) {
            const p = _origFetch(...args);
            try {
              const f = window.__activeFormForSubmit;
              if (f) {
                f._pendingRequests = (f._pendingRequests || 0) + 1;
                p.finally(() => {
                  f._pendingRequests = Math.max(0, (f._pendingRequests || 1) - 1);
                  maybeFinalizeFormSubmission(f);
                });
              }
            } catch (e) {
            }
            return p;
          };
        }

        if (window.XMLHttpRequest) {
          const _origSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.send = function(...args) {
            try {
              const f = window.__activeFormForSubmit;
              if (f) {
                f._pendingRequests = (f._pendingRequests || 0) + 1;
                const onDone = () => {
                  try {
                    f._pendingRequests = Math.max(0, (f._pendingRequests || 1) - 1);
                    maybeFinalizeFormSubmission(f);
                  } catch (e) {}
                  this.removeEventListener('load', onDone);
                  this.removeEventListener('error', onDone);
                  this.removeEventListener('abort', onDone);
                };
                this.addEventListener('load', onDone);
                this.addEventListener('error', onDone);
                this.addEventListener('abort', onDone);
              }
            } catch (e) {}
            return _origSend.apply(this, args);
          };
        }
      }

      window.__activeFormForSubmit = form;
      form._pendingRequests = 0;

      form._submitTimeout = setTimeout(() => {
        if (form.dataset.submitting === 'true' && (!form._pendingRequests || form._pendingRequests === 0) && !form._navigationInProgress) {
          finalizeFormSubmission(form);
        }
        if (window.__activeFormForSubmit === form) window.__activeFormForSubmit = null;
      }, 30000);
    });

    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const wrapper = input.closest('.wave-group') || input.parentElement;
      
      input.addEventListener('focus', () => {
        wrapper.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          wrapper.classList.remove('focused');
        }
      });
      
      if (input.value) {
        wrapper.classList.add('focused');
      }
    });
  });
}

function initializePerformanceOptimizations() {
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
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }

  const importantLinks = document.querySelectorAll('a[href^="/dashboard"], a[href^="/contact"], a[href^="/pricing"]');
  
  importantLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = link.href;
      document.head.appendChild(prefetchLink);
    }, { once: true });
  });

  const isProduction = (() => {
    try {
      if (typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV === 'production') return true;
      if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.NODE_ENV === 'production') return true;
    } catch (e) {
    }
    try {
      if (typeof location !== 'undefined' && location.hostname) {
        const h = location.hostname;
        if (!/^(localhost|127(?:\.0\.0\.1)?|::1)$/.test(h)) return true;
      }
    } catch (e) {}
    return false;
  })();

  if ('serviceWorker' in navigator && isProduction) {
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

// Helpers to finalize form submission UI
function maybeFinalizeFormSubmission(form) {
  try {
    if (!form) return;
    // If navigation is in progress, do nothing
    if (form._navigationInProgress) return;
    // If still submitting but there are no pending requests, finalize
    if (form.dataset.submitting === 'true' && (!form._pendingRequests || form._pendingRequests === 0)) {
      finalizeFormSubmission(form);
    }
  } catch (e) { console.warn('maybeFinalizeFormSubmission error', e && e.message); }
}

function finalizeFormSubmission(form) {
  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (form._submitTimeout) {
      clearTimeout(form._submitTimeout);
      form._submitTimeout = null;
    }
    // If navigation is happening, avoid re-enabling
    if (form._navigationInProgress) return;
    if (submitBtn) {
      submitBtn.textContent = form._originalSubmitText || submitBtn.textContent;
      submitBtn.disabled = false;
    }
    form.dataset.submitting = 'false';
    // Clear active form pointer when done
    if (window.__activeFormForSubmit === form) window.__activeFormForSubmit = null;
  } catch (e) { console.warn('finalizeFormSubmission error', e && e.message); }
}

perfMark('js-end');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeSwiper,
    initializeAnimations,
    initializeTabSystem,
    initializeTestimonialCarousel
  };
}
