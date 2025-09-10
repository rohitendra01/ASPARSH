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
	const tabHeaderContainer = document.querySelector('.tab-headers');
	const tabUnderline = document.querySelector('.tab-underline');

	function updateUnderline(activeHeader) {
		if (!activeHeader || !tabHeaderContainer) return;
		const headerRect = activeHeader.getBoundingClientRect();
		const containerRect = tabHeaderContainer.getBoundingClientRect();
		const leftOffset = headerRect.left - containerRect.left;
		tabUnderline.style.width = `${headerRect.width}px`;
		tabUnderline.style.left = `${leftOffset}px`;
	}

	const initialActiveHeader = document.querySelector('.tab-header.active');
	if (initialActiveHeader) updateUnderline(initialActiveHeader);

	tabHeaders.forEach(header => {
		header.addEventListener('click', () => {
			const currentActiveHeader = document.querySelector('.tab-header.active');
			if (currentActiveHeader) currentActiveHeader.classList.remove('active');

			const currentActivePane = document.querySelector('.tab-pane.active');
			if (currentActivePane) currentActivePane.classList.remove('active');

			header.classList.add('active');

			const targetPaneId = header.dataset.tab;
			const targetPane = document.getElementById(targetPaneId);
			if (targetPane) targetPane.classList.add('active');

			updateUnderline(header);
		});
	});

	window.addEventListener('resize', () => {
		const activeHeader = document.querySelector('.tab-header.active');
		if (activeHeader) updateUnderline(activeHeader);
	});
});