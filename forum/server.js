let currentUser = null;
let forumData = {};

function showLoginForm() {
    document.getElementById('login-modal').style.display = 'block';
}

function closeLoginForm() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('auth-message').textContent = '';
}

async function loadForumData() {
    try {
        const response = await fetch('/api/data');
        forumData = await response.json();
        console.log('Data loaded:', forumData); // debug
        renderCategories();
    } catch (error) {
        console.error("Erro a carregar dados:", error);
        // Покажем заглушку если данные не загрузились
        renderFallbackCategories();
    }
}

function renderFallbackCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;

    container.innerHTML = `
        <div class="category-card">
            <h3>Porto</h3>
            <p>Tópicos: 0</p>
            <button onclick="viewCategory('porto')">Ver Tópicos</button>
        </div>
        <div class="category-card">
            <h3>Lisboa</h3>
            <p>Tópicos: 0</p>
            <button onclick="viewCategory('lisboa')">Ver Tópicos</button>
        </div>
        <div class="category-card">
            <h3>Coimbra</h3>
            <p>Tópicos: 0</p>
            <button onclick="viewCategory('coimbra')">Ver Tópicos</button>
        </div>
        <div class="category-card">
            <h3>Outras</h3>
            <p>Tópicos: 0</p>
            <button onclick="viewCategory('outras')">Ver Tópicos</button>
        </div>
    `;
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;

    // Если категории есть в данных - используем их
    if (forumData.categories && forumData.categories.length > 0) {
        container.innerHTML = forumData.categories.map(cat => `
            <div class="category-card">
                <h3>${cat.name}</h3>
                <p>Tópicos: ${forumData.topics ? forumData.topics.filter(t => t.categoryId === cat._id).length : 0}</p>
                <button onclick="viewCategory('${cat._id}')">Ver Tópicos</button>
            </div>
        `).join('');
    } else {
        // Если категорий нет - покажем заглушку
        renderFallbackCategories();
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();

    if (!username) {
        document.getElementById('auth-message').textContent = 'Por favor, insira um nome de utilizador';
        return;
    }

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
        alert(`Bem-vindo, ${username}!`);
    } catch (error) {
        document.getElementById('auth-message').textContent = error.message;
    }
}

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
    } else {
        userInfo.textContent = '';
        loginBtn.style.display = 'inline-block';
        adminBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
    alert('Até logo!');
}

function viewCategory(categoryId) {
    alert(`Categoria ${categoryId} selecionada! Funcionalidade em desenvolvimento.`);
}

// Функция для принудительной проверки данных
function debugData() {
    console.log("Forum data:", forumData);
    console.log("Categories:", forumData.categories);
    console.log("Users:", forumData.users);
    
    // Принудительно рендерим если данные есть
    if (forumData.categories && forumData.categories.length > 0) {
        renderCategories();
    } else {
        console.log("No categories in data, using fallback");
        renderFallbackCategories();
    }
}

window.onload = function() {
    console.log('Page loaded'); // debug
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('User from storage:', currentUser); // debug
        } catch (e) {
            console.error('Error parsing user:', e);
            localStorage.removeItem('currentUser');
        }
    }
    
    loadForumData().then(() => {
        debugData(); // Отладочная информация
        updateUI();
    }).catch(error => {
        console.error('Failed to load data:', error);
        renderFallbackCategories();
        updateUI();
    });
};