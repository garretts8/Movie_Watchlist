// Modal elements
const modal = document.getElementById('loginModal');
const userIcon = document.getElementById('userIcon');
const ctaButton = document.getElementById('ctaButton');
const closeBtn = document.querySelector('.close');
const googleLoginBtn = document.getElementById('googleLoginBtn');

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

// Check login status from cookies
function checkLoginStatus() {
  const isLoggedIn = document.cookie
    .split('; ')
    .find((row) => row.startsWith('isLoggedIn='));
  const userName = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userName='));

  if (isLoggedIn && isLoggedIn.split('=')[1] === 'true') {
    updateUIForLoggedInUser(userName ? userName.split('=')[1] : 'User');
    return true;
  }
  return false;
}

// Update UI for logged in user
function updateUIForLoggedInUser(userName) {
  if (userIcon) {
    userIcon.classList.add('logged-in');
    userIcon.title = `Logged in as ${userName}`;
  }
  addLogoutButton();
}

// Add logout button
function addLogoutButton() {
  const navIcons = document.querySelector('.nav-icons');
  if (!navIcons || document.getElementById('logoutIcon')) return;

  const logoutIcon = document.createElement('i');
  logoutIcon.id = 'logoutIcon';
  logoutIcon.className = 'fas fa-sign-out-alt';
  logoutIcon.title = 'Logout';

  logoutIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = '/auth/logout';
  });

  navIcons.appendChild(logoutIcon);
}

// Open modal
function openModal() {
  if (checkLoginStatus()) {
    alert('You are already logged in!');
    return;
  }
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Event listeners
if (userIcon) userIcon.addEventListener('click', openModal);
if (ctaButton) ctaButton.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);

// Close modal on outside click
window.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

// Google OAuth - PRESERVED
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = '/auth/google';
  });
}

// Mobile menu toggle
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
  });
}

// Close mobile menu on link click
document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    if (navMenu && window.innerWidth <= 768) {
      navMenu.classList.remove('active');
      const icon = menuToggle?.querySelector('i');
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    }
  });
});

// Initialize
document.addEventListener('DOMContentLoaded', checkLoginStatus);