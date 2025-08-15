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
  let cards = Array.from(wrapper.children);
  const prevBtn = document.querySelector('.testimonial-carousel-nav.prev');
  const nextBtn = document.querySelector('.testimonial-carousel-nav.next');
  const dotsContainer = document.querySelector('.testimonial-carousel-dots');

  if (cards.length <= 3) {
    // Stack cards in a row, remove carousel controls
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.justifyContent = 'center';
    wrapper.style.gap = '2.5rem';
    wrapper.style.transform = 'none';
    cards.forEach(card => {
      card.className = 'testimonial-card active';
      card.style.margin = '0';
    });
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (dotsContainer) dotsContainer.style.display = 'none';
    return;
  }

  // Clone first and last card for seamless loop
  const firstClone = cards[0].cloneNode(true);
  const lastClone = cards[cards.length - 1].cloneNode(true);
  firstClone.classList.add('clone');
  lastClone.classList.add('clone');
  wrapper.insertBefore(lastClone, cards[0]);
  wrapper.appendChild(firstClone);
  cards = Array.from(wrapper.children);

  let current = 1; // Start at the first real card
  let transitioning = false;

  function getVisibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }
  function getCardWidth() {
    if (!cards[0]) return 0;
    return cards[0].getBoundingClientRect().width;
  }
  function updateCarousel(animate = true) {
    cards.forEach((card, idx) => {
      card.className = 'testimonial-card';
      if (card.classList.contains('clone')) card.classList.add('clone');
      card.classList.remove('active');
    });
    const visibleCount = getVisibleCount();
    const total = cards.length - 2; // exclude clones
    let realIdx = current;
    if (current === 0) realIdx = total;
    if (current === cards.length - 1) realIdx = 1;
    if (realIdx > 0 && realIdx < cards.length - 1) {
      // Only the center card is 'active'
      cards[realIdx].classList.add('active');
      if (visibleCount > 1) {
        const leftIdx = (realIdx - 1 + cards.length - 2) % (cards.length - 2) + 1;
        const rightIdx = (realIdx + 1 - 1) % (cards.length - 2) + 1;
        cards[leftIdx].classList.add('left');
        cards[leftIdx].classList.remove('active');
        cards[rightIdx].classList.add('right');
        cards[rightIdx].classList.remove('active');
      }
    }
    let cardWidth = getCardWidth();
    let offset = cardWidth * current;
    if (animate) {
      wrapper.style.transition = 'transform 1s cubic-bezier(.77,0,.18,1)';
    } else {
      wrapper.style.transition = 'none';
    }
    wrapper.style.transform = `translateX(${-offset}px)`;
    // Dots
    dotsContainer.innerHTML = '';
    for (let i = 0; i < cards.length - 2; i++) {
      const dot = document.createElement('div');
      dot.className = 'testimonial-carousel-dot' + (i + 1 === current ? ' active' : '');
      dot.addEventListener('click', () => {
        current = i + 1;
        updateCarousel();
      });
      dotsContainer.appendChild(dot);
    }
  }
  function handleTransitionEnd() {
    if (current === 0) {
      current = cards.length - 2;
      updateCarousel(false);
    } else if (current === cards.length - 1) {
      current = 1;
      updateCarousel(false);
    }
    transitioning = false;
  }
  function prev() {
    if (transitioning) return;
    transitioning = true;
    current--;
    updateCarousel();
  }
  function next() {
    if (transitioning) return;
    transitioning = true;
    current++;
    updateCarousel();
  }
  wrapper.addEventListener('transitionend', handleTransitionEnd);
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
  window.addEventListener('resize', () => updateCarousel(false));
  let autoSlide = setInterval(next, 3000);
  wrapper.addEventListener('mouseenter', () => clearInterval(autoSlide));
  wrapper.addEventListener('mouseleave', () => autoSlide = setInterval(next, 2000));
  updateCarousel(false);
});