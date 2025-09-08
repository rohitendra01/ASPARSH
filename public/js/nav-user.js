document.addEventListener('DOMContentLoaded', function () {
    const userDropdown = document.getElementById('userDropdown'); // The main container for trigger and content
    const dropdownContent = document.getElementById('dropdownContent'); // The login form div

    let hideDropdownTimeout; 
    const HIDE_DELAY = 200; 

    function showDropdown() {
        if (!dropdownContent) return;
        if (hideDropdownTimeout) {
            clearTimeout(hideDropdownTimeout);
        }
        dropdownContent.classList.add('show');
    }

    function hideDropdown() {
        if (!dropdownContent) return;
        hideDropdownTimeout = setTimeout(() => {
            dropdownContent.classList.remove('show');
        }, HIDE_DELAY);
    }

    if (userDropdown) {
        userDropdown.addEventListener('mouseenter', showDropdown);
        userDropdown.addEventListener('mouseleave', hideDropdown);

        const dropdownTrigger = document.getElementById('dropdownTrigger');
        if (dropdownTrigger) {
            dropdownTrigger.addEventListener('click', function(e) {
                e.stopPropagation(); 
                if (!dropdownContent) return;
                if (dropdownContent.classList.contains('show')) {
                    if (hideDropdownTimeout) clearTimeout(hideDropdownTimeout);
                    dropdownContent.classList.remove('show');
                } else {
                    showDropdown();
                }
            });
        }

        document.addEventListener('click', function (e) {
            if (!userDropdown.contains(e.target)) {
                if (hideDropdownTimeout) clearTimeout(hideDropdownTimeout);
                if (dropdownContent) dropdownContent.classList.remove('show');
            }
        });
    }

    // Mobile menu toggle
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    function openMobileMenu() {
        if (!mobileMenu || !hamburgerBtn) return;
        mobileMenu.classList.add('open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // prevent body scroll when menu open
    }

    function closeMobileMenu() {
        if (!mobileMenu || !hamburgerBtn) return;
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; 
    }

    if (hamburgerBtn && mobileMenu) {
        function toggleMobileMenu(e) {
            e.stopPropagation();
            if (mobileMenu.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }

        hamburgerBtn.addEventListener('click', toggleMobileMenu);
        // improve responsiveness on touch devices
        hamburgerBtn.addEventListener('touchstart', function (e) {
            // prevent the synthetic mouse event from also firing
            e.preventDefault();
            toggleMobileMenu(e);
        }, { passive: false });

        // close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // close menu on ESC
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMobileMenu();
        });
    }

    // Header scroll effect
    const header = document.querySelector('.site-header, header');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeaderOnScroll() {
        const scrollY = window.scrollY;
        
        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        lastScrollY = scrollY;
        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateHeaderOnScroll);
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
});