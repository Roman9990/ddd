// Telegram Web App initialization
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Theme detection
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('theme-dark');
    }

    // Apply Telegram theme colors
    if (tg.themeParams) {
        const root = document.documentElement;
        Object.keys(tg.themeParams).forEach(key => {
            root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, tg.themeParams[key]);
        });
    }
}

// Global state
let adminsData = [];
let selectedAdmin = null;
let currentFilter = 'all';
let selectedRating = 0;

// DOM Elements
const loadingElement = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const adminsList = document.getElementById('adminsList');
const noAdmins = document.getElementById('noAdmins');
const ratingModal = document.getElementById('ratingModal');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadAdmins();
});

// Event Listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setActiveFilter(this.dataset.filter);
        });
    });

    // Rating stars
    document.querySelectorAll('.rating-stars .star').forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            setRating(rating);
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });

    // Reset star highlighting on mouse leave
    document.querySelector('.rating-stars').addEventListener('mouseleave', function() {
        highlightStars(selectedRating);
    });

    // Modal backdrop click
    document.querySelector('.modal-backdrop').addEventListener('click', closeRatingModal);
}

// Load admins data
async function loadAdmins() {
    try {
        showLoading(true);

        // Fetch from GitHub or use mock data for demo
        const response = await fetch('https://roman9990.github.io/zzx/admins.json');
        let data;

        if (response.ok) {
            data = await response.json();
        } else {
            // Fallback mock data
            data = {
                admins: [
                    {
                        id: "123456789",
                        tag: "support_master",
                        role: "Техподдержка",
                        rating: 4.8,
                        status: "available",
                        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                        dialogs_count: 245,
                        response_time: "2 мин",
                        specialization: "Технические вопросы"
                    },
                    {
                        id: "987654321",
                        tag: "helper_anna",
                        role: "Консультант",
                        rating: 4.9,
                        status: "online",
                        avatar: "https://images.unsplash.com/photo-1494790108755-2616b25082ba?w=150&h=150&fit=crop&crop=face",
                        dialogs_count: 189,
                        response_time: "1 мин",
                        specialization: "Общие вопросы"
                    },
                    {
                        id: "555666777",
                        tag: "expert_pro",
                        role: "Эксперт",
                        rating: 4.7,
                        status: "busy",
                        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                        dialogs_count: 156,
                        response_time: "5 мин",
                        specialization: "Сложные вопросы"
                    }
                ],
                unavailable_admins: []
            };
        }

        adminsData = data.admins || [];
        displayAdmins();

    } catch (error) {
        console.error('Error loading admins:', error);
        showError('Ошибка загрузки данных');
    } finally {
        showLoading(false);
    }
}

// Display admins
function displayAdmins() {
    const filteredAdmins = filterAdmins();

    if (filteredAdmins.length === 0) {
        adminsList.innerHTML = '';
        noAdmins.classList.remove('hidden');
        return;
    }

    noAdmins.classList.add('hidden');

    adminsList.innerHTML = filteredAdmins.map((admin, index) => `
        <div class="admin-card" onclick="selectAdmin('${admin.tag}')" style="animation-delay: ${index * 0.1}s">
            <div class="admin-header">
                <div class="admin-avatar">
                    <img src="${admin.avatar}" alt="${admin.tag}" onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'">
                    <div class="admin-status ${admin.status}"></div>
                </div>
                <div class="admin-info">
                    <div class="admin-tag">${admin.tag}</div>
                    <div class="admin-role">${admin.role}</div>
                </div>
            </div>

            <div class="admin-details">
                <div class="admin-stat">
                    <i class="fas fa-star"></i>
                    <div class="rating-stars">
                        ${generateStars(admin.rating)}
                    </div>
                    <span class="rating-value">${admin.rating.toFixed(1)}</span>
                </div>

                <div class="admin-stat">
                    <i class="fas fa-comments"></i>
                    <span class="dialogs-count">${admin.dialogs_count} диалогов</span>
                </div>

                <div class="admin-stat">
                    <i class="fas fa-clock"></i>
                    <span class="response-time">~${admin.response_time}</span>
                </div>

                <div class="admin-stat">
                    <i class="fas fa-circle status-${admin.status}"></i>
                    <span>${getStatusText(admin.status)}</span>
                </div>

                <div class="specialization">
                    <i class="fas fa-tags"></i>
                    ${admin.specialization}
                </div>
            </div>
        </div>
    `).join('');
}

// Filter admins
function filterAdmins() {
    if (currentFilter === 'all') {
        return adminsData;
    }
    return adminsData.filter(admin => admin.status === currentFilter);
}

// Set active filter
function setActiveFilter(filter) {
    currentFilter = filter;

    // Update UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    // Re-render admins
    displayAdmins();
}

// Select admin
function selectAdmin(adminTag) {
    const admin = adminsData.find(a => a.tag === adminTag);
    if (!admin) return;

    selectedAdmin = admin;

    // Добавляем вибрацию если доступна
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    // Highlight selected card
    document.querySelectorAll('.admin-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Show rating modal or send directly
    if (admin.status === 'available' || admin.status === 'online') {
        // Directly send selection to bot
        setTimeout(() => {
            sendAdminSelection(admin);
        }, 300);
    } else {
        // Show rating modal for busy/offline admins
        showRatingModal(admin);
    }
}

// Show rating modal
function showRatingModal(admin) {
    selectedAdmin = admin;
    selectedRating = 0;

    // Fill modal data
    document.getElementById('modalAdminAvatar').src = admin.avatar;
    document.getElementById('modalAdminTag').textContent = '@' + admin.tag;
    document.getElementById('modalAdminRole').textContent = admin.role;

    // Reset rating
    highlightStars(0);
    document.getElementById('ratingText').textContent = 'Выберите оценку';
    document.getElementById('submitRating').disabled = true;

    // Show modal
    ratingModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close rating modal
function closeRatingModal() {
    ratingModal.classList.add('hidden');
    document.body.style.overflow = '';
    selectedAdmin = null;
    selectedRating = 0;
}

// Set rating
function setRating(rating) {
    selectedRating = rating;
    highlightStars(rating);

    const ratingTexts = {
        1: 'Очень плохо',
        2: 'Плохо', 
        3: 'Нормально',
        4: 'Хорошо',
        5: 'Отлично'
    };

    document.getElementById('ratingText').textContent = ratingTexts[rating];
    document.getElementById('submitRating').disabled = false;
}

// Highlight stars
function highlightStars(rating) {
    document.querySelectorAll('.rating-stars .star').forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

// Submit rating
function submitRating() {
    if (!selectedAdmin || selectedRating === 0) return;

    // Здесь можно отправить рейтинг на сервер
    console.log('Rating submitted:', {
        admin: selectedAdmin.tag,
        rating: selectedRating
    });

    // Send selection to bot
    sendAdminSelection(selectedAdmin);

    closeRatingModal();
}

// Send admin selection to bot
function sendAdminSelection(admin) {
    const selectionData = {
        action: 'select_admin',
        admin_tag: admin.tag,
        admin_id: admin.id,
        timestamp: Date.now()
    };

    // Send via Telegram WebApp
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify(selectionData));
    } else {
        // Fallback for testing
        console.log('Selected admin:', selectionData);
        alert(`Выбран администратор: @${admin.tag} (${admin.role})`);
    }
}

// Generate stars HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

// Get status text
function getStatusText(status) {
    const statusTexts = {
        available: 'Доступен',
        online: 'Онлайн',
        busy: 'Занят',
        offline: 'Оффлайн'
    };
    return statusTexts[status] || 'Неизвестно';
}

// Show/hide loading
function showLoading(show) {
    if (show) {
        loadingElement.classList.remove('hidden');
        mainContent.classList.add('hidden');
    } else {
        loadingElement.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }
}

// Show error
function showError(message) {
    adminsList.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ошибка</h3>
            <p>${message}</p>
            <button onclick="loadAdmins()" class="btn btn-primary">Попробовать снова</button>
        </div>
    `;
    noAdmins.classList.add('hidden');
}

// Refresh admins
function refreshAdmins() {
    // Add rotation animation to FAB
    const fabButton = document.querySelector('.fab-button');
    fabButton.style.transform = 'rotate(360deg)';

    setTimeout(() => {
        fabButton.style.transform = '';
    }, 500);

    // Reload data
    loadAdmins();
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scroll utility
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Add CSS for error message
const errorStyles = `
.error-message {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--surface-color);
    border-radius: 16px;
    margin: 1rem;
}

.error-message i {
    font-size: 3rem;
    color: var(--danger-color);
    margin-bottom: 1rem;
}

.error-message h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.error-message p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
}

.status-available { color: var(--success-color); }
.status-online { color: var(--success-color); }  
.status-busy { color: var(--warning-color); }
.status-offline { color: var(--danger-color); }
`;

// Inject error styles
const style = document.createElement('style');
style.textContent = errorStyles;
document.head.appendChild(style);