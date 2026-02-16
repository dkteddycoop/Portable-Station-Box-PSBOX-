
class InputController {
    constructor() {
        this.controlMode = 'gamepad';
        this.gamepads = [];
        this.activeGamepad = null;
        this.lastGamepadUpdate = 0;
        this.gamepadDelay = 200;
        this.buttonAPressed = false;
        this.buttonBPressed = false;
        this.dpadLeftPressed = false;
        this.dpadRightPressed = false;
        this.dpadUpPressed = false;
        this.dpadDownPressed = false;
        this.optionsPressed = false;
        this.keyboardHandler = null;
        this.inactivityTimer = null;
        this.inactivityTimeout = 60000;
        this.callbacks = {
            onNavigateLeft: null,
            onNavigateRight: null,
            onNavigateUp: null,
            onNavigateDown: null,
            onConfirm: null,
            onCancel: null,
            onMenu: null
        };
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    initGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepads.push(e.gamepad);
            this.activeGamepad = e.gamepad;
            this.setGamepadMode();
            this.resetInactivityTimer();
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad.id);
            this.gamepads = this.gamepads.filter(gp => gp.index !== e.gamepad.index);

            if (this.gamepads.length === 0) {
                this.activeGamepad = null;
                this.startInactivityTimer();
            } else {
                this.activeGamepad = this.gamepads[0];
            }
        });
        const connectedGamepads = navigator.getGamepads();
        for (let i = 0; i < connectedGamepads.length; i++) {
            if (connectedGamepads[i]) {
                this.gamepads.push(connectedGamepads[i]);
                this.activeGamepad = connectedGamepads[i];
            }
        }

        if (this.gamepads.length > 0) {
            this.setGamepadMode();
        } else {
            this.startInactivityTimer();
        }
    }

    pollGamepad() {
        if (this.controlMode !== 'gamepad' || !this.activeGamepad) return;

        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.activeGamepad.index];

        if (!gamepad) return;

        const now = Date.now();
        if (now - this.lastGamepadUpdate < this.gamepadDelay) return;
        const dpadLeft = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -0.5;
        const dpadRight = gamepad.buttons[15]?.pressed || gamepad.axes[0] > 0.5;
        const dpadUp = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -0.5;
        const dpadDown = gamepad.buttons[13]?.pressed || gamepad.axes[1] > 0.5;
        const buttonA = gamepad.buttons[0]?.pressed;
        const buttonB = gamepad.buttons[1]?.pressed;
        const optionsButton = gamepad.buttons[9]?.pressed;
        if (dpadLeft && !this.dpadLeftPressed) {
            this.callbacks.onNavigateLeft?.();
            this.lastGamepadUpdate = now;
        }
        if (dpadRight && !this.dpadRightPressed) {
            this.callbacks.onNavigateRight?.();
            this.lastGamepadUpdate = now;
        }
        if (dpadUp && !this.dpadUpPressed) {
            this.callbacks.onNavigateUp?.();
            this.lastGamepadUpdate = now;
        }
        if (dpadDown && !this.dpadDownPressed) {
            this.callbacks.onNavigateDown?.();
            this.lastGamepadUpdate = now;
        }
        if (buttonA && !this.buttonAPressed) {
            this.callbacks.onConfirm?.();
            this.lastGamepadUpdate = now;
        }
        if (buttonB && !this.buttonBPressed) {
            this.callbacks.onCancel?.();
            this.lastGamepadUpdate = now;
        }
        if (optionsButton && !this.optionsPressed) {
            this.callbacks.onMenu?.();
            this.lastGamepadUpdate = now;
        }
        this.dpadLeftPressed = dpadLeft;
        this.dpadRightPressed = dpadRight;
        this.dpadUpPressed = dpadUp;
        this.dpadDownPressed = dpadDown;
        this.buttonAPressed = buttonA;
        this.buttonBPressed = buttonB;
        this.optionsPressed = optionsButton;
    }

    setGamepadMode() {
        document.body.classList.remove('keyboard-mode');
        document.body.classList.add('gamepad-mode');
        this.controlMode = 'gamepad';
        this.disableKeyboardNavigation();
        document.body.style.cursor = 'none';

        console.log('Switched to gamepad mode');
    }

    setKeyboardMode() {
        document.body.classList.remove('gamepad-mode');
        document.body.classList.add('keyboard-mode');
        this.controlMode = 'keyboard';
        this.setupKeyboardEvents();
        document.body.style.cursor = 'default';

        console.log('Switched to keyboard mode');
    }

    setupKeyboardEvents() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        this.keyboardHandler = (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.callbacks.onNavigateLeft?.();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.callbacks.onNavigateRight?.();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.callbacks.onNavigateUp?.();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.callbacks.onNavigateDown?.();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.callbacks.onConfirm?.();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.callbacks.onCancel?.();
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.callbacks.onMenu?.();
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    disableKeyboardNavigation() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    }

    startInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        if (this.gamepads.length > 0) return;

        this.inactivityTimer = setTimeout(() => {
            if (this.gamepads.length === 0) {
                this.setKeyboardMode();
            }
        }, this.inactivityTimeout);
    }

    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    getControlMode() {
        return this.controlMode;
    }

    toggleControlMode() {
        if (this.controlMode === 'gamepad') {
            this.setKeyboardMode();
        } else {
            this.setGamepadMode();
        }
    }
}
