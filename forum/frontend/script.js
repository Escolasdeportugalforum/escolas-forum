let currentUser = null;
let forumData = {};

// Загружаем данные с сервера
async function loadForumData() {
    try {
        const response = await fetch('/api/data');
        forumData = await response.json();
        renderCategories();
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }
}

// Показываем города (категории)
function renderCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;

    container.innerHTML = forumData.categories.map(cat => `
        <div class="category-card">
            <h3>${cat.name}</h3>
            <p>Tópicos: ${forumData.topics.filter(t => t.categoryId === cat.id).length}</p>
            <button onclick="viewCategory(${cat.id})">Ver Tópicos</button>
        </div>
    `).join('');
}

// Вход/регистрация
async function handleAuth(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const user = await response.json();
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUI();
        closeLoginForm();
    } catch (error) {
        document.getElementById('auth-message').textContent = error.message;
    }
}

// Обновляем интерфейс
function updateUI() {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const adminBtn = document.getElementById('admin-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUser) {
        userInfo.textContent = `Olá, ${currentUser.username}!`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        if (currentUser.isAdmin) {
            adminBtn.style.display = 'inline-block';
        }
    }
}

// Выход
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
}

// Загрузка при старте
window.onload = function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    loadForumData().then(() => {
        updateUI();
    });
};
