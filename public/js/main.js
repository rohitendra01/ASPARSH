console.log("Its working");

window.addEventListener('scroll', function() {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 10) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const userDropdown = document.getElementById('userDropdown'); // The main container for trigger and content
    const dropdownContent = document.getElementById('dropdownContent'); // The login form div

    let hideDropdownTimeout; 
    const HIDE_DELAY = 200; 

    function showDropdown() {
        if (hideDropdownTimeout) {
            clearTimeout(hideDropdownTimeout);
        }
        dropdownContent.classList.add('show');
    }

    function hideDropdown() {
        hideDropdownTimeout = setTimeout(() => {
            dropdownContent.classList.remove('show');
        }, HIDE_DELAY);
    }

    userDropdown.addEventListener('mouseenter', showDropdown);
    userDropdown.addEventListener('mouseleave', hideDropdown);

    const dropdownTrigger = document.getElementById('dropdownTrigger');
    dropdownTrigger.addEventListener('click', function(e) {
        e.stopPropagation(); 
        if (dropdownContent.classList.contains('show')) {
            if (hideDropdownTimeout) clearTimeout(hideDropdownTimeout);
            dropdownContent.classList.remove('show');
        } else {
            showDropdown();
        }
    });

    document.addEventListener('click', function (e) {
        if (!userDropdown.contains(e.target)) {
            if (hideDropdownTimeout) clearTimeout(hideDropdownTimeout);
            dropdownContent.classList.remove('show');
        }
    });
});