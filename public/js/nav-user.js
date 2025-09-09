if (window.__navUserInitialized) {
} else {
    window.__navUserInitialized = true;

    function initNavUser() {
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
    let hamburgerBtn = document.getElementById('hamburgerBtn');
    let mobileMenu = document.getElementById('mobileMenu');

    function openMobileMenu() {
        hamburgerBtn = hamburgerBtn || document.getElementById('hamburgerBtn');
        mobileMenu = mobileMenu || document.getElementById('mobileMenu');
        if (!mobileMenu || !hamburgerBtn) return;
    mobileMenu.classList.add('open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // prevent body scroll when menu open
    }

    function closeMobileMenu() {
        hamburgerBtn = hamburgerBtn || document.getElementById('hamburgerBtn');
        mobileMenu = mobileMenu || document.getElementById('mobileMenu');
        if (!mobileMenu || !hamburgerBtn) return;
    mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; 
    }

    function toggleMobileMenu(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        mobileMenu = mobileMenu || document.getElementById('mobileMenu');
        if (!mobileMenu) return;
        if (mobileMenu.classList.contains('open')) closeMobileMenu(); else openMobileMenu();
    }

    function ensureHamburgerReady() {
        hamburgerBtn = hamburgerBtn || document.getElementById('hamburgerBtn');
        if (!hamburgerBtn) return;
        hamburgerBtn.setAttribute('role', 'button');
        hamburgerBtn.tabIndex = 0;
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
        hamburgerBtn.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                toggleMobileMenu(ev);
            }
        });
    }

    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.hamburger')) {
            toggleMobileMenu(e);
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('.hamburger')) return;
        hamburgerBtn = hamburgerBtn || document.getElementById('hamburgerBtn');
        mobileMenu = mobileMenu || document.getElementById('mobileMenu');
        if (!mobileMenu || !hamburgerBtn) return;
        if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            closeMobileMenu();
        }
    });

    (function attachBackdropHandler() {
        mobileMenu = mobileMenu || document.getElementById('mobileMenu');
        if (!mobileMenu) return;
        mobileMenu.addEventListener('click', function (e) {
            if (e.target === mobileMenu) closeMobileMenu();
        });
    })();

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMobileMenu();
    });

    ensureHamburgerReady();

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

        const headerUserImage = document.querySelector('.header-user-image');
        if (headerUserImage) {
            headerUserImage.addEventListener('click', function (e) {
                window.location.href = '/dashboard';
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavUser);
    } else {
        initNavUser();
    }
}