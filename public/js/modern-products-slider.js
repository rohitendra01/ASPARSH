/**
 * Modern Products Slider - Enhanced Product Carousel with Tab Functionality
 * Handles product carousel, tab switching, and interactive animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Swiper for product carousel
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
                // Add fade-in animation to slides
                this.slides.forEach((slide, index) => {
                    slide.style.animationDelay = `${index * 0.1}s`;
                });
            }
        }
    });

    // Enhanced Tab Functionality for Product Cards
    function initializeProductTabs() {
        // Get all product cards
        const productCards = document.querySelectorAll('.index-product-card');
        
        productCards.forEach((card, cardIndex) => {
            const tabHeaders = card.querySelectorAll('.tab-header');
            const tabHeaderContainer = card.querySelector('.tab-headers');
            const tabUnderline = card.querySelector('.tab-underline');
            
            function updateUnderline(activeHeader) {
                if (!activeHeader || !tabHeaderContainer || !tabUnderline) return;
                
                const headerRect = activeHeader.getBoundingClientRect();
                const containerRect = tabHeaderContainer.getBoundingClientRect();
                const leftOffset = headerRect.left - containerRect.left;
                
                tabUnderline.style.width = `${headerRect.width}px`;
                tabUnderline.style.left = `${leftOffset}px`;
                tabUnderline.style.opacity = '1';
            }

            // Initialize underline position for the first active tab
            const initialActiveHeader = card.querySelector('.tab-header.active');
            if (initialActiveHeader) {
                setTimeout(() => updateUnderline(initialActiveHeader), 100);
            }

            // Add click handlers for tab switching
            tabHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    // Remove active class from all tabs in this card
                    const currentActiveHeader = card.querySelector('.tab-header.active');
                    if (currentActiveHeader) {
                        currentActiveHeader.classList.remove('active');
                    }

                    const currentActivePane = card.querySelector('.tab-pane.active');
                    if (currentActivePane) {
                        currentActivePane.style.opacity = '0';
                        currentActivePane.style.transform = 'translateY(-10px)';
                        
                        setTimeout(() => {
                            currentActivePane.classList.remove('active');
                        }, 150);
                    }

                    // Add active class to clicked tab
                    header.classList.add('active');

                    const targetPaneId = header.dataset.tab;
                    const targetPane = card.querySelector(`#${targetPaneId}`);
                    if (targetPane) {
                        setTimeout(() => {
                            targetPane.classList.add('active');
                            targetPane.style.opacity = '0';
                            targetPane.style.transform = 'translateY(10px)';
                            
                            requestAnimationFrame(() => {
                                targetPane.style.opacity = '1';
                                targetPane.style.transform = 'translateY(0)';
                            });
                        }, 150);
                    }

                    updateUnderline(header);
                });

                header.addEventListener('mouseenter', () => {
                    if (!header.classList.contains('active')) {
                        header.style.transform = 'translateY(-2px)';
                    }
                });

                header.addEventListener('mouseleave', () => {
                    if (!header.classList.contains('active')) {
                        header.style.transform = 'translateY(0)';
                    }
                });
            });

            window.addEventListener('resize', () => {
                const activeHeader = card.querySelector('.tab-header.active');
                if (activeHeader) {
                    updateUnderline(activeHeader);
                }
            });
        });
    }

    setTimeout(initializeProductTabs, 200);

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
                }, 150);

                console.log(`Buy Now clicked for product ${productId}`);
                
                showNotification('Added to cart!', 'success');
            });
        });

        exploreMoreButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 150);

                console.log(`Explore More clicked for product ${productId}`);
                
            });
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