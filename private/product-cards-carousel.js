document.addEventListener('DOMContentLoaded', function () {
  const sliders = document.querySelectorAll('.image-slider');
  sliders.forEach(slider => {
    const slides = slider.querySelectorAll('.image-slide');
    let current = 0;
    let prev = slides.length - 1;
    let next = 1;

    function updateSlides() {
      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev', 'next');
        if (i === current) {
          slide.classList.add('active');
        } else if (i === (current === 0 ? slides.length - 1 : current - 1)) {
          slide.classList.add('prev');
        } else if (i === (current === slides.length - 1 ? 0 : current + 1)) {
          slide.classList.add('next');
        }
      });
    }
    updateSlides();
    setInterval(() => {
      prev = current;
      current = (current + 1) % slides.length;
      next = (current + 1) % slides.length;
      updateSlides();
    }, 4000);
  });
});
