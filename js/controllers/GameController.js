
class GameController {
    constructor(windowManager, notificationManager) {
        this.windowManager = windowManager;
        this.notificationManager = notificationManager;

        this.currentRunningGame = null;
        this.isMonitoringGame = false;
        this.gameMonitorInterval = null;
        this.isLoading = false;
        this.loadingProgress = 0;
        this.loadingInterval = null;
    }

    async launchGame(game) {
        if (this.isLoading) {
            console.log('Already loading a game');
            return;
        }

        console.log('Launching game:', game.name);
        this.currentRunningGame = game;
        this.isLoading = true;
        this.showLoadingScreen(game);
        this.startLoadingProgress();

        try {
            if (window.psboxAPI && psboxAPI.launchProgram) {
                const result = await psboxAPI.launchProgram({
                    path: game.path,
                    name: game.name
                });

                if (result.success) {
                    console.log('Game launched successfully');
                    this.loadingProgress = 100;
                    document.getElementById('loadingProgress').style.width = '100%';
                    document.getElementById('loadingText').textContent = 'Iniciando...';

                    setTimeout(() => {
                        this.hideLoadingScreen();
                        this.windowManager.hideWindow();
                        this.startGameMonitoring(game);
                    }, 1500);

                } else {
                    throw new Error(result.error || 'Failed to launch game');
                }
            } else {
                throw new Error('PSBOX API not available');
            }
        } catch (error) {
            console.error('Error launching game:', error);
            this.hideLoadingScreen();
            this.isLoading = false;
            this.notificationManager.show('Error', `No se pudo ejecutar: ${error.message}`, 'error');
        }
    }

    showLoadingScreen(game) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingTitle = document.getElementById('loadingGameTitle');
        const loadingCover = document.getElementById('loadingFullscreenCover');

        if (loadingScreen) {
            loadingTitle.textContent = game.name;
            if (game.loadingImage) {
                loadingCover.style.backgroundImage = `url(${game.loadingImage})`;
            } else if (game.cover) {
                loadingCover.style.backgroundImage = `url(${game.cover})`;
            } else {
                loadingCover.style.backgroundImage = 'none';
            }

            loadingScreen.classList.add('active');
            this.loadingProgress = 0;
            document.getElementById('loadingProgress').style.width = '0%';
            document.getElementById('loadingText').textContent = 'Preparando el juego...';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
        this.stopLoadingProgress();
        this.isLoading = false;
    }

    startLoadingProgress() {
        this.loadingProgress = 0;
        const progressBar = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');

        const stages = [
            { progress: 20, text: 'Verificando archivos...' },
            { progress: 40, text: 'Cargando recursos...' },
            { progress: 60, text: 'Iniciando motor gráfico...' },
            { progress: 80, text: 'Preparando experiencia...' },
        ];

        let stageIndex = 0;

        this.loadingInterval = setInterval(() => {
            if (this.loadingProgress < 90) {
                this.loadingProgress += Math.random() * 10;

                if (stageIndex < stages.length && this.loadingProgress >= stages[stageIndex].progress) {
                    loadingText.textContent = stages[stageIndex].text;
                    stageIndex++;
                }

                progressBar.style.width = `${Math.min(this.loadingProgress, 90)}%`;
            }
        }, 300);
    }

    stopLoadingProgress() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }
    }

    cancelLoading() {
        console.log('Loading cancelled');
        this.hideLoadingScreen();
        this.currentRunningGame = null;
    }

    startGameMonitoring(game) {
        console.log('Starting game monitoring for:', game.name);
        this.isMonitoringGame = true;
        const focusHandler = () => {
            if (this.isMonitoringGame && document.visibilityState === 'visible') {
                console.log('Window focused - game likely closed');
                setTimeout(() => {
                    this.onGameClosed();
                }, 300);
            }
        };

        window.addEventListener('focus', focusHandler);
        this.gameFocusHandler = focusHandler;
    }

    onGameClosed() {
        if (!this.isMonitoringGame) return;

        console.log('Game closed, restoring PSBOX');
        this.isMonitoringGame = false;
        if (this.gameFocusHandler) {
            window.removeEventListener('focus', this.gameFocusHandler);
            this.gameFocusHandler = null;
        }
        this.windowManager.restoreWindow();
        if (this.currentRunningGame) {
            this.notificationManager.show(
                'Juego Cerrado',
                `${this.currentRunningGame.name} se ha cerrado`,
                'info'
            );
        }

        this.currentRunningGame = null;
    }

    isGameRunning() {
        return this.isMonitoringGame;
    }

    getCurrentGame() {
        return this.currentRunningGame;
    }
}
