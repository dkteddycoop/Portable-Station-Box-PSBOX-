
class ModalController {
    constructor(configManager, notificationManager) {
        this.configManager = configManager;
        this.notificationManager = notificationManager;

        this.currentCoverFile = null;
        this.currentLoadingImageFile = null;
        this.currentGamePath = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const coverFile = document.getElementById('coverFile');
        if (coverFile) {
            coverFile.addEventListener('change', (e) => this.handleCoverFileChange(e));
        }
        const loadingImageFile = document.getElementById('loadingImageFile');
        if (loadingImageFile) {
            loadingImageFile.addEventListener('change', (e) => this.handleLoadingImageChange(e));
        }
        const addGameButton = document.getElementById('addGameButton');
        if (addGameButton) {
            addGameButton.addEventListener('click', () => this.handleAddGame());
        }
    }

    handleCoverFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('coverPreview');
                if (preview) {
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    preview.innerHTML = '';
                    this.currentCoverFile = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    handleLoadingImageChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('loadingImagePreview');
                if (preview) {
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    preview.innerHTML = '';
                    this.currentLoadingImageFile = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    async browseForGame() {
        if (window.psboxAPI && psboxAPI.showOpenDialog) {
            const result = await psboxAPI.showOpenDialog({
                title: 'Seleccionar Ejecutable del Juego',
                filters: [
                    { name: 'Ejecutables', extensions: ['exe', 'bat', 'cmd', 'lnk'] },
                    { name: 'Todos los archivos', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const gamePath = result.filePaths[0];
                document.getElementById('gamePath').value = gamePath;
                this.currentGamePath = gamePath;
                const gameNameInput = document.getElementById('gameName');
                if (!gameNameInput.value) {
                    const fileName = gamePath.split('\\').pop().split('/').pop();
                    const gameName = fileName.replace(/\.(exe|bat|cmd|lnk)$/i, '');
                    gameNameInput.value = gameName;
                }
                if (!this.currentCoverFile && psboxAPI.extractIcon) {
                    const iconData = await psboxAPI.extractIcon(gamePath);
                    if (iconData) {
                        this.currentCoverFile = iconData;
                        const preview = document.getElementById('coverPreview');
                        if (preview) {
                            preview.style.backgroundImage = `url(${iconData})`;
                            preview.innerHTML = '';
                        }
                    }
                }
            }
        }
    }

    browseForCover() {
        document.getElementById('coverFile').click();
    }

    browseForLoadingImage() {
        document.getElementById('loadingImageFile').click();
    }

    async handleAddGame() {
        const gameName = document.getElementById('gameName').value.trim();
        const gamePath = document.getElementById('gamePath').value.trim();

        if (!gameName || !gamePath) {
            this.notificationManager.show('Error', 'Por favor completa todos los campos requeridos', 'error');
            return;
        }

        const newGame = {
            id: Date.now(),
            name: gameName,
            path: gamePath,
            cover: this.currentCoverFile || null,
            loadingImage: this.currentLoadingImageFile || null,
            lastPlayed: null,
            playTime: 0
        };
        const games = this.configManager.getGames();
        games.push(newGame);
        await this.configManager.setGames(games);
        await this.configManager.save(this.configManager.config);

        this.notificationManager.show('Éxito', `${gameName} agregado correctamente`, 'success');
        this.closeAddGameModal();
        if (this.onGameAdded) {
            this.onGameAdded(newGame);
        }

        return newGame;
    }

    openAddGameModal() {
        const modal = document.getElementById('addGameModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('gameName').value = '';
            document.getElementById('gamePath').value = '';

            const coverPreview = document.getElementById('coverPreview');
            if (coverPreview) {
                coverPreview.style.backgroundImage = '';
                coverPreview.innerHTML = '<div class="preview-placeholder"><i>📷</i><div>Haz clic para seleccionar</div></div>';
            }

            const loadingPreview = document.getElementById('loadingImagePreview');
            if (loadingPreview) {
                loadingPreview.style.backgroundImage = '';
                loadingPreview.innerHTML = '<div class="preview-placeholder"><i>🔄</i><div>Haz clic para seleccionar</div></div>';
            }

            this.currentCoverFile = null;
            this.currentLoadingImageFile = null;
            this.currentGamePath = null;
        }
    }

    closeAddGameModal() {
        const modal = document.getElementById('addGameModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    openConfigModal() {
        const modal = document.getElementById('configModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeConfigModal() {
        const modal = document.getElementById('configModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setOnGameAddedCallback(callback) {
        this.onGameAdded = callback;
    }
}
