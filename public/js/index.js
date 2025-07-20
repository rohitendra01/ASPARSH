console.log('Index JS Loaded'  );


document.addEventListener('DOMContentLoaded', () => {
  new Swiper('.swiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    freeMode: true,
    loop: true,
    autoplay: { delay: 4000, disableOnInteraction: false },
    grabCursor: true,
    centeredSlides: true
  });
});


    document.addEventListener('DOMContentLoaded', () => {
    const tabHeaders = document.querySelectorAll('.tab-header');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabUnderline = document.querySelector('.tab-underline');
    const tabHeaderContainer = document.querySelector('.tab-headers'); // Get the container for correct offset

    function updateUnderline(activeHeader) {
        if (!activeHeader) return;

        const headerRect = activeHeader.getBoundingClientRect();
        const containerRect = tabHeaderContainer.getBoundingClientRect(); // Get container's position

        const leftOffset = headerRect.left - containerRect.left;

        tabUnderline.style.width = `${headerRect.width}px`;
        tabUnderline.style.left = `${leftOffset}px`;
    }
    const initialActiveHeader = document.querySelector('.tab-header.active');
    if (initialActiveHeader) {
        updateUnderline(initialActiveHeader);
    }

    tabHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentActiveHeader = document.querySelector('.tab-header.active');
            if (currentActiveHeader) {
                currentActiveHeader.classList.remove('active');
            }

            const currentActivePane = document.querySelector('.tab-pane.active');
            if (currentActivePane) {
                currentActivePane.classList.remove('active');
            }

            header.classList.add('active');

            const targetPaneId = header.dataset.tab;
            const targetPane = document.getElementById(targetPaneId);

            if (targetPane) {
                targetPane.classList.add('active');
            }

            updateUnderline(header);
        });
    });

    window.addEventListener('resize', () => {
        const activeHeader = document.querySelector('.tab-header.active');
        if (activeHeader) {
            updateUnderline(activeHeader);
        }
    });
});


document.addEventListener('DOMContentLoaded', function () {
  const wrapper = document.querySelector('.testimonial-carousel-wrapper');
  if (!wrapper) return;
  const cards = Array.from(wrapper.children);
  const prevBtn = document.querySelector('.testimonial-carousel-nav.prev');
  const nextBtn = document.querySelector('.testimonial-carousel-nav.next');
  const dotsContainer = document.querySelector('.testimonial-carousel-dots');
  let current = 1;

  function getVisibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getCardWidth() {
    if (!cards[0]) return 0;
    return cards[0].getBoundingClientRect().width;
  }

  function updateCarousel() {
    cards.forEach(card => card.className = 'testimonial-card');
    const visibleCount = getVisibleCount();
    const total = cards.length;

    cards.forEach((card, idx) => {
      if (idx === current) {
        card.classList.add('active');
      } else if (visibleCount > 1 && idx === (current - 1 + total) % total) {
        card.classList.add('left');
      } else if (visibleCount > 1 && idx === (current + 1) % total) {
        card.classList.add('right');
      }
    });

    let cardWidth = getCardWidth();
    let offset = 0;
    if (visibleCount === 3) {
      offset = cardWidth * (current - 1);
    } else if (visibleCount === 2) {
      offset = cardWidth * (current - 0.5);
    } else {
      offset = cardWidth * current;
    }
    wrapper.style.transform = `translateX(${-offset}px)`;

    // Dots
    dotsContainer.innerHTML = '';
    cards.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = 'testimonial-carousel-dot' + (idx === current ? ' active' : '');
      dot.addEventListener('click', () => {
        current = idx;
        updateCarousel();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function prev() {
    current = (current - 1 + cards.length) % cards.length;
    updateCarousel();
  }
  function next() {
    current = (current + 1) % cards.length;
    updateCarousel();
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Touch/Swipe support
  let startX = 0;
  wrapper.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });
  wrapper.addEventListener('touchend', e => {
    let dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) prev();
    else if (dx < -50) next();
  });

  window.addEventListener('resize', updateCarousel);

  let autoSlide = setInterval(next, 3000);
  wrapper.addEventListener('mouseenter', () => clearInterval(autoSlide));
  wrapper.addEventListener('mouseleave', () => autoSlide = setInterval(next, 2000));

  updateCarousel();
});