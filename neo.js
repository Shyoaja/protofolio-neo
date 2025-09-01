document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = navMenu.querySelectorAll('a');
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const greetingElement = document.getElementById('dynamic-greeting');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.add('is-open');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            navMenu.classList.remove('is-open');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('is-open')) {
                navMenu.classList.remove('is-open');
            }
        });
    });

    function updateClock(element) {
        if (!element) return;
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[now.getDay()];
        const date = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        if (element.classList.contains('realtime-clock-chat')) {
             element.innerHTML = `${hours}:${minutes}:${seconds}`;
        } else {
             element.innerHTML = `${dayName}, ${date}/${month}/${year}<br>${hours}:${minutes}:${seconds}`;
        }
    }

    const clockPortfolio = document.querySelector('.realtime-clock');
    const clockChat = document.querySelector('.realtime-clock-chat');

    if (clockPortfolio) {
        setInterval(() => updateClock(clockPortfolio), 1000);
        updateClock(clockPortfolio);
    }
    if (clockChat) {
        setInterval(() => updateClock(clockChat), 1000);
        updateClock(clockChat);
    }

    if (greetingElement) {
        const now = new Date();
        const currentHour = now.getHours();
        let greetingText;

        if (currentHour >= 5 && currentHour < 12) {
            greetingText = "Ohayou!";
        } else if (currentHour >= 12 && currentHour < 18) {
            greetingText = "Konnichiwa!";
        } else {
            greetingText = "Konbanwa!";
        }
        greetingElement.innerText = greetingText;
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const data = new FormData(form);
            
            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    formStatus.innerHTML = "Thanks for your submission!";
                    formStatus.className = 'form-status-success';
                    form.reset();
                } else {
                    const responseData = await response.json();
                    if (Object.hasOwn(responseData, 'errors')) {
                        formStatus.innerHTML = responseData["errors"].map(error => error["message"]).join(", ");
                    } else {
                        formStatus.innerHTML = "Oops! There was a problem submitting your form";
                    }
                    formStatus.className = 'form-status-error';
                }
            } catch (error) {
                formStatus.innerHTML = "Oops! There was a problem submitting your form";
                formStatus.className = 'form-status-error';
            }
            
            setTimeout(() => {
                if (formStatus) {
                    formStatus.innerHTML = '';
                    formStatus.className = '';
                }
            }, 5000);
        });
    }
});