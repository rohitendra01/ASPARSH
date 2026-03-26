document.addEventListener('DOMContentLoaded', () => {
    const productSwiper = new Swiper('.products-swiper', {
        slidesPerView: 'auto',
        spaceBetween: 30,
        centeredSlides: true,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        grabCursor: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 20,
                centeredSlides: true
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 25,
                centeredSlides: true
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30,
                centeredSlides: true
            },
            1200: {
                slidesPerView: 'auto',
                spaceBetween: 30,
                centeredSlides: true
            }
        },
        on: {
            init: function () {
                this.slides.forEach((slide, index) => {
                    slide.style.animationDelay = `${index * 0.1}s`;
                });
            }
        }
    });

    function initializeButtonInteractions() {
        const buyNowButtons = document.querySelectorAll('.buy-now-btn');
        const exploreMoreButtons = document.querySelectorAll('.explore-more-btn');

        buyNowButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                    window.location.href = `/contact?product=${productId}`;
                }, 150);
            });
        });

        exploreMoreButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                    window.location.href = `/home#product-${productId}`;
                }, 150);
            });
        });

        // Tab Switching Logic
        const tabHeaders = document.querySelectorAll('.tab-header');
        tabHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const container = this.closest('.index-product-description-container');
                const targetId = this.getAttribute('data-tab');
                
                // Remove active class from all headers and panes in this container
                container.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
                container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked header and corresponding pane
                this.classList.add('active');
                container.querySelector(`#${targetId}`).classList.add('active');
                
                // Move underline
                const underline = container.querySelector('.tab-underline');
                if (underline) {
                    underline.style.width = this.offsetWidth + 'px';
                    underline.style.left = this.offsetLeft + 'px';
                }
            });
        });
        
        // Initialize underlines
        document.querySelectorAll('.index-product-description-container').forEach(container => {
            const activeHeader = container.querySelector('.tab-header.active');
            const underline = container.querySelector('.tab-underline');
            if (activeHeader && underline) {
                underline.style.width = activeHeader.offsetWidth + 'px';
                underline.style.left = activeHeader.offsetLeft + 'px';
            }
        });
    }

    initializeButtonInteractions();

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            backgroundColor: type === 'success' ? '#4caf50' : '#2196f3',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    function addScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                    entry.target.style.animationDelay = '0.1s';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.index-product-card').forEach(card => {
            observer.observe(card);
        });
    }

    addScrollAnimations();

    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('tab-header')) {
            const tabs = Array.from(e.target.parentNode.querySelectorAll('.tab-header'));
            const currentIndex = tabs.indexOf(e.target);
            
            let nextIndex;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                    tabs[nextIndex].click();
                    tabs[nextIndex].focus();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                    tabs[nextIndex].click();
                    tabs[nextIndex].focus();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    e.target.click();
                    break;
            }
        }
    });

    document.querySelectorAll('.tab-header').forEach(tab => {
        tab.setAttribute('tabindex', '0');
        tab.setAttribute('role', 'tab');
    });

    initTestimonialCarousel();
});

const animationStyles = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .tab-pane {
        animation: none;
    }
    
    .tab-pane.active {
        animation: fadeInUp 0.3s ease-out;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

function initTestimonialCarousel() {
    const carousel = document.getElementById('testimonialsCarousel');
    const track = document.getElementById('testimonialsTrack');
    
    if (!carousel || !track) return;
    
    const cards = track.querySelectorAll('.testimonial-card');
    
    if (cards.length === 0) return;
    
    let currentSlide = 0;
    let cardsPerSlide = 3;
    let totalSlides = Math.ceil(cards.length / cardsPerSlide);
    let autoSlideInterval;
    
    function updateCardsPerSlide() {
        const width = window.innerWidth;
        if (width <= 768) {
            cardsPerSlide = 1;
        } else if (width <= 1024) {
            cardsPerSlide = 2;
        } else {
            cardsPerSlide = 3;
        }
        totalSlides = Math.ceil(cards.length / cardsPerSlide);
        
        if (currentSlide >= totalSlides) {
            currentSlide = 0;
        }
        goToSlide(currentSlide);
        
        if (autoSlideInterval) {
            stopAutoSlide();
            startAutoSlide();
        }
    }
    
    function goToSlide(slideIndex) {
        currentSlide = Math.max(0, Math.min(slideIndex, totalSlides - 1));
        const offset = -(currentSlide * (100 / cardsPerSlide));
        track.style.transform = `translateX(${offset}%)`;
        
        cards.forEach((card, index) => {
            const slideStart = currentSlide * cardsPerSlide;
            const slideEnd = slideStart + cardsPerSlide;
            const isVisible = index >= slideStart && index < slideEnd;
            card.setAttribute('aria-hidden', !isVisible);
        });
        
        updateDots();
    }
    
    function createDots() {
        const dotsContainer = document.getElementById('testimonialDots');
        if (!dotsContainer) return;
        
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            if (i === currentSlide) dot.classList.add('active');
            
            dot.addEventListener('click', () => {
                stopAutoSlide();
                goToSlide(i);
                startAutoSlide();
            });
            
            dotsContainer.appendChild(dot);
        }
    }
    
    function updateDots() {
        const dotsContainer = document.getElementById('testimonialDots');
        if (!dotsContainer) return;
        
        const dots = dotsContainer.querySelectorAll('span');
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    function startAutoSlide() {
        if (autoSlideInterval) return; 
        
        const isMobile = window.innerWidth <= 768;
        const intervalTime = isMobile ? 3500 : 4000; 
        
        autoSlideInterval = setInterval(() => {
            const nextSlide = (currentSlide + 1) % totalSlides;
            goToSlide(nextSlide);
        }, intervalTime);
    }
    
    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }
    function init() {
        updateCardsPerSlide();
        createDots();
        startAutoSlide();
        
        carousel.addEventListener('mouseenter', () => {
            stopAutoSlide();
        });
        
        carousel.addEventListener('mouseleave', () => {
            startAutoSlide();
        });
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                stopAutoSlide();
                updateCardsPerSlide();
                createDots();
                startAutoSlide();
            }, 150);
        });
        
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let hasMoved = false;
        
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            hasMoved = false;
            stopAutoSlide(); 
            track.style.transition = 'none';
        }, { passive: true });
        
        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);
            
            if (diffX > diffY && diffX > 10) {
                e.preventDefault();
                hasMoved = true;
            }
        }, { passive: false });
        
        track.addEventListener('touchend', (e) => {
            if (!isDragging || !hasMoved) {
                isDragging = false;
                setTimeout(() => {
                    startAutoSlide();
                }, 500);
                return;
            }
            
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            const threshold = window.innerWidth <= 768 ? 30 : 50; 
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    const nextSlide = (currentSlide + 1) % totalSlides;
                    goToSlide(nextSlide);
                } else {
                    const prevSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
                    goToSlide(prevSlide);
                }
            }
            
            isDragging = false;
            hasMoved = false;
            
            track.style.transition = 'transform var(--transition-slow) ease-in-out';
            
            setTimeout(() => {
                startAutoSlide();
            }, 1000);
        }, { passive: true });
        
        track.addEventListener('touchcancel', () => {
            isDragging = false;
            hasMoved = false;
            startAutoSlide();
        }, { passive: true });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoSlide();
            } else {
                startAutoSlide();
            }
        });
        
        console.log('Testimonial carousel initialized:', {
            totalCards: cards.length,
            totalSlides: totalSlides,
            cardsPerSlide: cardsPerSlide
        });
    }
    
    init();
}