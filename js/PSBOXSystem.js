
class PSBOXSystem {
    constructor() {
        this.configManager = new ConfigManager();
        this.windowManager = new WindowManager();
        this.notificationManager = new NotificationController();
        this.quickMenuManager = new QuickMenuManager();
        this.carouselController = new CarouselController();
        this.gameController = new GameController(this.windowManager, this.notificationManager);
        this.inputController = new InputController();
        this.modalController = new ModalController(this.configManager, this.notificationManager);
        this.games = [];
        this.isInitialized = false;
        this.timeInterval = null;
    }

    
    async init() {
        console.log('🎮 Initializing PSBOX System...');
        await this.loadConfiguration();
        this.setupUI();
        this.setupInputHandling();
        this.setupQuickMenu();
        this.setupCarousel();
        this.setupModalCallbacks();
        this.startTimeUpdate();
        this.windowManager.enterFullscreen();

        this.isInitialized = true;
        console.log('✅ PSBOX System initialized successfully');
    }

    
    async loadConfiguration() {
        const config = await this.configManager.load();
        this.games = config.games || [];
        const controlMode = this.configManager.getControlMode();
        if (controlMode === 'keyboard') {
            this.inputController.setKeyboardMode();
        } else {
            this.inputController.setGamepadMode();
        }

        console.log(`Loaded ${this.games.length} games from configuration`);
    }

    
    setupUI() {
        this.updateControlModeIndicator();
    }

    
    setupInputHandling() {
        this.inputController.initGamepad();
        this.inputController.setCallbacks({
            onNavigateLeft: () => this.handleNavigateLeft(),
            onNavigateRight: () => this.handleNavigateRight(),
            onNavigateUp: () => this.handleNavigateUp(),
            onNavigateDown: () => this.handleNavigateDown(),
            onConfirm: () => this.handleConfirm(),
            onCancel: () => this.handleCancel(),
            onMenu: () => this.handleMenu()
        });
        setInterval(() => {
            this.inputController.pollGamepad();
        }, 16);
    }

    
    setupQuickMenu() {
        const menuItems = [
            {
                icon: '⚙️',
                label: 'Configuración',
                action: () => this.modalController.openConfigModal()
            },
            {
                icon: '➕',
                label: 'Agregar Juego',
                action: () => this.modalController.openAddGameModal()
            },
            {
                icon: '🔄',
                label: this.inputController.getControlMode() === 'gamepad'
                    ? 'Cambiar a Teclado/Ratón'
                    : 'Cambiar a Mando',
                action: () => this.changeControlMode()
            },
            {
                icon: '🔙',
                label: 'Restaurar Ventana PSBOX',
                action: () => this.windowManager.restoreWindow()
            },
            {
                icon: 'ℹ️',
                label: 'Acerca de PSBOX',
                action: () => this.showAbout()
            },
            {
                icon: '❌',
                label: 'Cerrar PSBOX',
                action: () => this.windowManager.closeApp()
            }
        ];

        this.quickMenuManager.setup(menuItems);
    }

    
    setupCarousel() {
        this.carouselController.setup(this.games);
        this.carouselController.render(this.games, {
            onConfigClick: () => this.modalController.openConfigModal(),
            onAddGameClick: () => this.modalController.openAddGameModal(),
            onGameClick: (game) => this.launchGame(game)
        });
    }

    
    setupModalCallbacks() {
        this.modalController.setOnGameAddedCallback((game) => {
            this.games.push(game);
            this.setupCarousel();
        });
    }

    
    startTimeUpdate() {
        this.updateTime();
        this.timeInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    
    updateTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    
    updateControlModeIndicator() {
        const controlModeElement = document.getElementById('controlMode');
        const controlModeText = document.getElementById('controlModeText');

        const mode = this.inputController.getControlMode();

        if (controlModeElement) {
            controlModeElement.classList.remove('gamepad', 'keyboard');
            controlModeElement.classList.add(mode);

            const icon = mode === 'gamepad' ? '🎮' : '⌨️';
            const text = mode === 'gamepad' ? 'Modo: Mando' : 'Modo: Teclado/Ratón';

            controlModeElement.innerHTML = `<span class="mode-icon">${icon}</span><span>${text}</span>`;
        }

        if (controlModeText) {
            controlModeText.textContent = mode === 'gamepad'
                ? 'Cambiar a Teclado/Ratón'
                : 'Cambiar a Mando';
        }
    }

    handleNavigateLeft() {
        if (this.quickMenuManager.getIsOpen()) {
            return;
        }

        if (!this.isModalOpen()) {
            this.carouselController.navigateLeft();
        }
    }

    handleNavigateRight() {
        if (this.quickMenuManager.getIsOpen()) {
            return;
        }

        if (!this.isModalOpen()) {
            this.carouselController.navigateRight();
        }
    }

    handleNavigateUp() {
        if (this.quickMenuManager.getIsOpen()) {
            this.quickMenuManager.navigateUp();
        }
    }

    handleNavigateDown() {
        if (this.quickMenuManager.getIsOpen()) {
            this.quickMenuManager.navigateDown();
        }
    }

    handleConfirm() {
        if (this.quickMenuManager.getIsOpen()) {
            this.quickMenuManager.performAction();
            return;
        }

        if (!this.isModalOpen()) {
            const centerItem = this.carouselController.getCenterItem();
            if (centerItem) {
                centerItem.click();
            }
        }
    }

    handleCancel() {
        if (this.quickMenuManager.getIsOpen()) {
            this.quickMenuManager.close();
            return;
        }
        if (this.isModalOpen()) {
            this.modalController.closeAddGameModal();
            this.modalController.closeConfigModal();
        }
    }

    handleMenu() {
        this.quickMenuManager.toggle();
    }

    isModalOpen() {
        const addGameModal = document.getElementById('addGameModal');
        const configModal = document.getElementById('configModal');

        return (addGameModal && addGameModal.style.display === 'flex') ||
            (configModal && configModal.style.display === 'flex');
    }

    
    async launchGame(game) {
        console.log('Launching game:', game.name);
        await this.gameController.launchGame(game);
        game.lastPlayed = new Date().toISOString();
        await this.saveConfiguration();
    }

    
    async saveConfiguration() {
        this.configManager.setGames(this.games);
        await this.configManager.save(this.configManager.config);
    }

    
    async changeControlMode() {
        this.inputController.toggleControlMode();
        const mode = this.inputController.getControlMode();
        this.configManager.setControlMode(mode);
        await this.configManager.save(this.configManager.config);
        this.updateControlModeIndicator();
        this.setupQuickMenu();

        this.notificationManager.info(
            'Modo Cambiado',
            mode === 'gamepad' ? 'Modo Mando activado' : 'Modo Teclado/Ratón activado'
        );
    }

    
    async showAbout() {
        let systemInfo = {
            version: '1.0.0',
            platform: 'Unknown',
            arch: 'Unknown'
        };

        if (window.psboxAPI && psboxAPI.getSystemInfo) {
            systemInfo = await psboxAPI.getSystemInfo();
        }

        const aboutHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(20px);">
                <div style="background:linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,102,204,0.3));border:2px solid #00a8ff;border-radius:20px;padding:40px;max-width:600px;width:90%;color:white;text-align:center;box-shadow:0 20px 60px rgba(0,168,255,0.4);">
                    <div style="font-size:64px;margin-bottom:20px;color:#00a8ff;">🎮</div>
                    <h1 style="color:#00a8ff;margin-bottom:10px;font-size:36px;">PSBOX</h1>
                    <p style="margin-bottom:30px;opacity:0.8;font-size:18px;">PlayStation-Style Game Launcher</p>
                    <div style="background:rgba(0,102,204,0.15);border-radius:12px;padding:25px;margin-bottom:30px;text-align:left;">
                        <div style="margin-bottom:12px;"><strong style="color:#00a8ff;">Versión:</strong> ${systemInfo.version}</div>
                        <div style="margin-bottom:12px;"><strong style="color:#00a8ff;">Plataforma:</strong> ${systemInfo.platform}</div>
                        <div style="margin-bottom:12px;"><strong style="color:#00a8ff;">Sistema:</strong> ${systemInfo.os || 'N/A'}</div>
                        <div><strong style="color:#00a8ff;">Arquitectura:</strong> ${systemInfo.arch}</div>
                    </div>
                    <p style="margin-bottom:25px;line-height:1.6;opacity:0.9;">
                        PSBOX es un lanzador de juegos con interfaz estilo PlayStation 4, 
                        diseñado para una experiencia de navegación fluida con mando o teclado.
                    </p>
                    <button onclick="this.parentElement.parentElement.remove()" style="background:linear-gradient(135deg,#0066cc,#00a8ff);color:white;border:none;padding:15px 40px;border-radius:10px;font-size:16px;font-weight:bold;cursor:pointer;transition:all 0.3s;">
                        CERRAR
                    </button>
                </div>
            </div>
        `;

        const aboutDiv = document.createElement('div');
        aboutDiv.innerHTML = aboutHTML;
        document.body.appendChild(aboutDiv);
    }

    
    destroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }

        this.inputController.disableKeyboardNavigation();

        console.log('PSBOX System destroyed');
    }
}
