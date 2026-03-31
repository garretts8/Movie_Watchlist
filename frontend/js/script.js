// Modal elements
const modal = document.getElementById('loginModal');
const userIcon = document.getElementById('userIcon');
const ctaButton = document.getElementById('ctaButton');
const closeBtn = document.querySelector('.close');
const googleLoginBtn = document.getElementById('googleLoginBtn');

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

// Track login state to avoid repeated checks
let isUserLoggedIn = false;

// Check login status from cookies
function checkLoginStatus() {
  const isLoggedIn = document.cookie
    .split('; ')
    .find((row) => row.startsWith('isLoggedIn='));
  const userName = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userName='));

  if (isLoggedIn && isLoggedIn.split('=')[1] === 'true') {
    isUserLoggedIn = true;
    updateUIForLoggedInUser(userName ? decodeURIComponent(userName.split('=')[1]) : 'User');
    return true;
  }
  isUserLoggedIn = false;
  updateUIForLoggedOutUser();
  return false;
}

// Update UI for logged in user
function updateUIForLoggedInUser(userName) {
  if (userIcon) {
    userIcon.classList.add('logged-in');
    userIcon.title = `Logged in as ${userName}`;
    // Remove click handler that opens modal when logged in
    userIcon.onclick = null;
  }
  addLogoutButton();
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
  if (userIcon) {
    userIcon.classList.remove('logged-in');
    userIcon.title = 'Login';
    // Add click handler to open modal when logged out
    userIcon.onclick = openModal;
  }
  
  // Remove logout button if exists
  const logoutIcon = document.getElementById('logoutIcon');
  if (logoutIcon) {
    logoutIcon.remove();
  }
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
  if (isUserLoggedIn) {
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
if (ctaButton) ctaButton.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);

// Close modal on outside click
window.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

// Google OAuth
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
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
});