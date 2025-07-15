    (function() {
        const sliderContainer = document.querySelector('.slider-container');
        if (!sliderContainer) return;

        const tracker = sliderContainer.querySelector('.slider-tracker');
        const slides = tracker.querySelectorAll('.slide');
        const prevBtn = sliderContainer.querySelector('.prev-btn');
        const nextBtn = sliderContainer.querySelector('.next-btn');
        if (slides.length === 0) return;
        const slideCount = slides.length;
        let currentIndex = 0;

        function goToSlide(index) {
            if (index < 0) {
                index = slideCount - 1;
            } else if (index >= slideCount) {
                index = 0;
            }
            tracker.style.transform = `translateX(-${index * 100}%)`;
            currentIndex = index;
        }

        nextBtn.addEventListener('click', function() {
            goToSlide(currentIndex + 1);
        });

        prevBtn.addEventListener('click', function() {
            goToSlide(currentIndex - 1);
        });

        setInterval(function() {
            goToSlide(currentIndex + 1);
        }, 4000);
    })();




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