document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("main > div");
  let isScrolling = false;

  let observerOptions = {
    root: null,
    threshold: 0.6,
  };

  let observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isScrolling) {
        isScrolling = true;
        entry.target.scrollIntoView({ behavior: "smooth" });

        setTimeout(() => {
          isScrolling = false;
        }, 800); // delay between scrolls
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
});