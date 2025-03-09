// Sistema de autenticação
const AUTH_SYSTEM = {
    checkSession: function() {
        return localStorage.getItem('minao_session') !== null;
    },
    saveSession: function() {
        localStorage.setItem('minao_session', Date.now().toString());
    },
    clearSession: function() {
        localStorage.removeItem('minao_session');
    }
};

// Verificação de conexão
function checkConnectionAndInit() {
    const noConnectionOverlay = document.getElementById('noConnectionOverlay');
    const loginOverlay = document.getElementById('loginOverlay');
    const mainContent = document.getElementById('mainContent');

    if (!navigator.onLine) {
        noConnectionOverlay.style.display = 'flex';
        loginOverlay.style.display = 'none';
        mainContent.style.display = 'none';
        return false;
    }

    noConnectionOverlay.style.display = 'none';
    
    if (AUTH_SYSTEM.checkSession()) {
        loginOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        init();
    } else {
        loginOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
    }
    
    return true;
}

// Inicialização
window.addEventListener('load', function() {
    createLoginStars();
    checkConnectionAndInit();
});

// Eventos de conexão
window.addEventListener('online', function() {
    checkConnectionAndInit();
    logToConsole('✅ Conexão com internet restaurada', 'success');
});

window.addEventListener('offline', function() {
    document.getElementById('noConnectionOverlay').style.display = 'flex';
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    logToConsole('❌ Conexão com internet perdida', 'error');
});

// Funções do jogo
function startGame() {
    const airplane = document.querySelector('.airplane');
    airplane.classList.add('flying');
    // Lógica do jogo
}

function stopGame() {
    const airplane = document.querySelector('.airplane');
    airplane.classList.remove('flying');
    // Lógica de parada
}

// Utilitários
function logToConsole(message, type = 'info') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    console.log(
        `%c${message}`,
        `color: ${colors[type]}; font-weight: bold; font-size: 12px;`
    );
}

// Login com Google
function loginWithGoogle() {
    if (!checkConnectionAndInit()) return;
    
    if (window.plugins && window.plugins.googleplus) {
        window.plugins.googleplus.login(
            {
                'webClientId': 'YOUR_CLIENT_ID.apps.googleusercontent.com',
                'offline': true
            },
            function (obj) {
                logToConsole('✅ Login com Google realizado com sucesso', 'success');
                
                const googleUser = {
                    id: obj.userId,
                    email: obj.email,
                    name: obj.displayName,
                    imageUrl: obj.imageUrl,
                    accessToken: obj.accessToken
                };
                
                localStorage.setItem('minao_google_user', JSON.stringify(googleUser));
                AUTH_SYSTEM.saveSession();
                
                showWelcomeMessage(obj.displayName);
            },
            function (msg) {
                logToConsole('❌ Erro no login com Google: ' + msg, 'error');
                showLoginError('Erro ao conectar com Google. Tente novamente.');
            }
        );
    }
}

// Funções auxiliares
function showWelcomeMessage(name) {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(40, 167, 69, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        font-weight: bold;
        z-index: 9999;
        animation: fadeInOut 3s forwards;
    `;
    welcomeMessage.textContent = `👋 Bem-vindo(a), ${name}!`;
    document.body.appendChild(welcomeMessage);
    
    setTimeout(() => {
        welcomeMessage.remove();
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        init();
    }, 3000);
}

function showLoginError(message) {
    const loginError = document.getElementById('loginError');
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Service Worker para cache offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.log('Erro no registro do ServiceWorker:', error);
            });
    });
}

// Sistema de cache e conexão
const NETWORK = {
    isOnline: () => navigator.onLine,
    checkSpeed: async () => {
        try {
            const startTime = performance.now();
            await fetch('https://www.google.com/favicon.ico');
            const endTime = performance.now();
            return endTime - startTime;
        } catch {
            return 9999;
        }
    },
    getConnectionType: () => {
        if (!navigator.connection) return 'unknown';
        return navigator.connection.effectiveType; // 4g, 3g, 2g, slow-2g
    },
    init: async function() {
        // Verificar tipo de conexão
        const connectionType = this.getConnectionType();
        const isOnline = this.isOnline();
        const connectionSpeed = await this.checkSpeed();

        // Ajustar qualidade baseado na conexão
        if (connectionType === '4g' || connectionSpeed < 500) {
            // Conexão boa - carregar tudo
            loadHighQualityAssets();
        } else {
            // Conexão ruim - modo econômico
            loadLowQualityAssets();
        }

        // Monitorar mudanças na conexão
        window.addEventListener('online', () => {
            showToast('Conexão restaurada! 🌐');
            checkConnectionAndInit();
        });

        window.addEventListener('offline', () => {
            showToast('Modo offline ativado 📱');
            enableOfflineMode();
        });
    }
};

// Funções de otimização
function loadHighQualityAssets() {
    // Carregar imagens em alta qualidade
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
    });
}

function loadLowQualityAssets() {
    // Carregar imagens em baixa qualidade
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.lowsrc || img.dataset.src;
    });
}

function enableOfflineMode() {
    // Ativar modo offline
    document.body.classList.add('offline-mode');
    
    // Usar dados em cache
    useOfflineData();
}

function useOfflineData() {
    // Recuperar dados salvos
    const cachedData = localStorage.getItem('minao_cached_data');
    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            updateUIWithData(data);
        } catch (e) {
            console.error('Erro ao carregar dados offline:', e);
        }
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Inicializar sistema de rede
NETWORK.init(); 