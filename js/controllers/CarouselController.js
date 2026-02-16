
class CarouselController {
    constructor() {
        this.items = [];
        this.currentCenterIndex = 0;
        this.totalItems = 0;
        this.isAnimating = false;
        this.animationQueue = [];
    }

    setup(games) {
        this.items = [];
        this.currentCenterIndex = 0;
        this.totalItems = 2 + games.length;
    }

    render(games, callbacks) {
        const carouselTrack = document.getElementById('carouselTrack');
        if (!carouselTrack) return;

        carouselTrack.innerHTML = '';
        this.items = [];

        const allItems = [
            {
                type: 'app',
                name: 'Configuración',
                icon: '⚙️',
                action: callbacks.onConfigClick
            },
            {
                type: 'app',
                name: 'Agregar Juego',
                icon: '+',
                action: callbacks.onAddGameClick
            },
            ...games.map(game => ({
                type: 'game',
                game: game,
                name: game.name,
                cover: game.cover,
                action: () => callbacks.onGameClick(game)
            }))
        ];

        allItems.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'carousel-item';
            el.dataset.index = index;

            if (item.type === 'app') {
                el.innerHTML = `
                    <div class="carousel-cover">
                        <div class="carousel-icon">${item.icon}</div>
                    </div>
                    <div class="carousel-info">
                        <div class="carousel-title">${item.name}</div>
                    </div>
                `;
            } else {
                el.innerHTML = `
                    <div class="carousel-cover">
                        ${item.cover ? `<img src="${item.cover}" alt="${item.name}">` : `<div class="carousel-icon">🎮</div>`}
                    </div>
                    <div class="carousel-info">
                        <div class="carousel-title">${item.name}</div>
                    </div>
                `;
            }

            el.onclick = () => {
                console.log('Click on item:', index);

                if (index === this.currentCenterIndex) {
                    item.action();
                } else {
                    const diff = index - this.currentCenterIndex;
                    this.navigate(diff);
                }
            };

            carouselTrack.appendChild(el);
            this.items.push(el);
        });

        this.totalItems = this.items.length;
        this.updatePositions();
    }

    navigate(direction) {
        const nextIndex = this.currentCenterIndex + direction;
        if (nextIndex < 0 || nextIndex >= this.totalItems) return;

        this.currentCenterIndex = nextIndex;
        this.updatePositions();
    }

    navigateLeft() {
        this.navigate(-1);
    }

    navigateRight() {
        this.navigate(1);
    }

    updatePositions() {
        this.items.forEach((el, index) => {
            el.classList.remove(
                'left',
                'center',
                'right',
                'hidden',
                'left-side',
                'right-side'
            );

            const position = this.getPosition(index);
            position.split(' ').forEach(cls => el.classList.add(cls));
        });
    }

    getPosition(itemIndex) {
        const diff = itemIndex - this.currentCenterIndex;

        if (diff === 0) return 'center';
        if (diff === -1) return 'left';
        if (diff === 1) return 'right';

        if (diff < -1) return 'hidden left-side';
        return 'hidden right-side';
    }

    getCenterIndex() {
        return this.currentCenterIndex;
    }

    setCenterIndex(index) {
        if (index >= 0 && index < this.totalItems) {
            this.currentCenterIndex = index;
            this.updatePositions();
        }
    }

    getCenterItem() {
        return this.items[this.currentCenterIndex];
    }

    getTotalItems() {
        return this.totalItems;
    }
}
