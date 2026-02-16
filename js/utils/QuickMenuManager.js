
class QuickMenuManager {
    constructor() {
        this.isOpen = false;
        this.selectedIndex = 0;
        this.menuItems = [];
    }

    
    setup(items) {
        this.menuItems = items;
        this.render();
    }

    render() {
        const menuContainer = document.getElementById('quickMenuItems');
        if (!menuContainer) return;

        menuContainer.innerHTML = '';

        this.menuItems.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.className = 'quick-menu-item';
            menuItem.dataset.index = index;

            menuItem.innerHTML = `
                <div class="menu-item-icon">${item.icon}</div>
                <div class="menu-item-label">${item.label}</div>
            `;

            menuItem.onclick = () => {
                if (item.action) {
                    item.action();
                }
                if (!item.keepOpen) {
                    this.close();
                }
            };

            menuContainer.appendChild(menuItem);
        });

        this.updateSelection();
    }

    open() {
        const menu = document.getElementById('quickMenu');
        const overlay = document.getElementById('quickMenuOverlay');

        if (menu && overlay) {
            menu.classList.add('active');
            overlay.classList.add('active');
            this.isOpen = true;
            this.selectedIndex = 0;
            this.updateSelection();
        }
    }

    close() {
        const menu = document.getElementById('quickMenu');
        const overlay = document.getElementById('quickMenuOverlay');

        if (menu && overlay) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            this.isOpen = false;
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    navigateUp() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.updateSelection();
        }
    }

    navigateDown() {
        if (this.selectedIndex < this.menuItems.length - 1) {
            this.selectedIndex++;
            this.updateSelection();
        }
    }

    updateSelection() {
        const menuContainer = document.getElementById('quickMenuItems');
        if (!menuContainer) return;

        const items = menuContainer.querySelectorAll('.quick-menu-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    performAction() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.menuItems.length) {
            const item = this.menuItems[this.selectedIndex];
            if (item.action) {
                item.action();
            }
            if (!item.keepOpen) {
                this.close();
            }
        }
    }

    getIsOpen() {
        return this.isOpen;
    }

    getSelectedIndex() {
        return this.selectedIndex;
    }
}
