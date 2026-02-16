
class ConfigManager {
    constructor() {
        this.config = null;
    }

    async load() {
        try {
            if (window.psboxAPI && psboxAPI.getConfig) {
                const config = await psboxAPI.getConfig();
                if (config) {
                    this.config = config;
                    console.log('Configuration loaded from API:', config);
                    return config;
                }
            } else {
                const savedConfig = localStorage.getItem('psbox_config');
                if (savedConfig) {
                    this.config = JSON.parse(savedConfig);
                    console.log('Configuration loaded from localStorage:', this.config);
                    return this.config;
                }
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
        this.config = {
            games: [],
            controlMode: 'gamepad',
            alwaysFullscreen: true,
            language: 'es',
            theme: 'ps4',
            notifications: true
        };
        return this.config;
    }

    async save(config) {
        this.config = {
            ...config,
            lastSaved: new Date().toISOString()
        };

        try {
            if (window.psboxAPI && psboxAPI.saveConfig) {
                await psboxAPI.saveConfig(this.config);
                console.log('Configuration saved via API');
            } else {
                localStorage.setItem('psbox_config', JSON.stringify(this.config));
                console.log('Configuration saved to localStorage');
            }
            return true;
        } catch (error) {
            console.error('Error saving configuration:', error);
            return false;
        }
    }

    get(key) {
        return this.config ? this.config[key] : null;
    }

    set(key, value) {
        if (this.config) {
            this.config[key] = value;
        }
    }

    getGames() {
        return this.config?.games || [];
    }

    setGames(games) {
        if (this.config) {
            this.config.games = games;
        }
    }

    getControlMode() {
        return this.config?.controlMode || 'gamepad';
    }

    setControlMode(mode) {
        if (this.config) {
            this.config.controlMode = mode;
        }
    }
}
