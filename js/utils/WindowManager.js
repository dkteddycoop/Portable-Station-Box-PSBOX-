
class WindowManager {
    constructor() {
        this.windowState = 'foreground';
    }

    enterFullscreen() {
        if (window.psboxAPI && psboxAPI.enterFullscreen) {
            psboxAPI.enterFullscreen();
        } else {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log('Could not enter fullscreen:', err);
                });
            }
        }
    }

    async restoreWindow() {
        console.log('Restoring PSBOX window...');

        this.windowState = 'foreground';
        document.body.classList.remove('background-mode');
        document.body.style.display = 'block';
        document.body.style.opacity = '1';
        document.body.style.visibility = 'visible';
        document.body.style.pointerEvents = 'all';
        document.body.style.transform = 'scale(1)';
        const importantElements = [
            '.ps4-container',
            '.carousel-container',
            '.ps4-header',
            '.carousel-track',
            '.carousel-item',
            '.ps4-content'
        ];

        importantElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = '';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
        });
        if (window.psboxAPI && psboxAPI.restoreWindow) {
            try {
                await psboxAPI.restoreWindow();
                console.log('Window restored via API');

                setTimeout(() => {
                    this.enterFullscreen();
                }, 300);
            } catch (error) {
                console.error('Error restoring window via API:', error);
                this.fallbackFullscreen();
            }
        } else {
            console.log('Development mode: Visual restoration');
            this.fallbackFullscreen();
        }
    }

    fallbackFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fallback fullscreen failed:', err);
            });
        }
    }

    async hideWindow() {
        if (window.psboxAPI && psboxAPI.hideWindow) {
            await psboxAPI.hideWindow();
        }
    }

    async minimizeWindow() {
        if (window.psboxAPI && psboxAPI.minimizeWindow) {
            await psboxAPI.minimizeWindow();
        }
    }

    async closeApp() {
        console.log('Closing PSBOX...');

        if (window.psboxAPI && typeof psboxAPI.closeApp === 'function') {
            try {
                const result = await psboxAPI.closeApp();
                console.log('Close app result:', result);
                setTimeout(() => {
                    console.log('Verifying if closed...');
                    this.forceClose();
                }, 1200);

                return result;
            } catch (error) {
                console.error('Error closing app via API:', error);
                this.forceClose();
            }
        } else {
            console.log('No API available, attempting direct close');
            this.forceClose();
        }
    }

    forceClose() {
        const closeMethods = [
            () => { try { window.close(); return true; } catch (e) { return false; } },
            () => { try { window.open('', '_self', '').close(); return true; } catch (e) { return false; } },
            () => { try { window.location.href = 'about:blank'; return true; } catch (e) { return false; } }
        ];

        for (let method of closeMethods) {
            if (method()) {
                console.log('Close method executed');
                break;
            }
        }
    }

    showCloseHelp() {
        const helpHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.98);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(20px);">
                <div style="background:linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,102,204,0.2));border:2px solid #00a8ff;border-radius:20px;padding:40px;max-width:600px;width:90%;color:white;text-align:center;box-shadow:0 20px 60px rgba(0,168,255,0.3);">
                    <div style="font-size:48px;margin-bottom:20px;color:#00a8ff;">⚠️</div>
                    <h2 style="color:#00a8ff;margin-bottom:20px;font-size:28px;">Cierre Manual Requerido</h2>
                    <p style="margin-bottom:25px;line-height:1.6;font-size:16px;opacity:0.9;">
                        PSBOX no pudo cerrarse automáticamente.<br>
                        Por favor, usa uno de estos métodos:
                    </p>
                    <div style="background:rgba(0,102,204,0.15);border-radius:12px;padding:25px;margin-bottom:30px;text-align:left;border-left:4px solid #00a8ff;">
                        <div style="margin-bottom:15px;"><strong style="color:#00a8ff;">ALT + F4</strong> - Cerrar ventana directamente</div>
                        <div style="margin-bottom:15px;"><strong style="color:#00a8ff;">Click en la X</strong> - Esquina superior derecha</div>
                        <div style="margin-bottom:15px;"><strong style="color:#00a8ff;">Ctrl + Shift + Esc</strong> - Abrir administrador de tareas</div>
                    </div>
                    <button id="psboxCloseHelpBtn" style="background:linear-gradient(135deg,#0066cc,#00a8ff);color:white;border:none;padding:15px 40px;border-radius:10px;font-size:16px;font-weight:bold;cursor:pointer;transition:all 0.3s;margin-top:10px;">
                        ENTENDIDO
                    </button>
                    <p style="margin-top:25px;font-size:14px;opacity:0.6;font-style:italic;">
                        Este mensaje se auto-ocultará en 10 segundos
                    </p>
                </div>
            </div>
        `;

        const helpDiv = document.createElement('div');
        helpDiv.innerHTML = helpHTML;
        document.body.appendChild(helpDiv);

        setTimeout(() => {
            const closeBtn = document.getElementById('psboxCloseHelpBtn');
            if (closeBtn) {
                closeBtn.onclick = () => helpDiv.remove();
            }
        }, 100);

        setTimeout(() => {
            if (document.body.contains(helpDiv)) {
                helpDiv.remove();
            }
        }, 10000);
    }
}
