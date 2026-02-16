
class NotificationController {
    constructor() {
        this.currentNotification = null;
        this.notificationQueue = [];
        this.isShowing = false;
    }

    
    show(title, message, type = 'info', duration = 3000) {
        const notification = {
            title,
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        if (this.isShowing) {
            this.notificationQueue.push(notification);
        } else {
            this.displayNotification(notification);
        }
    }

    displayNotification(notification) {
        this.isShowing = true;
        this.currentNotification = notification;

        const notificationEl = document.getElementById('notification');
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        const iconEl = document.getElementById('notificationIcon');

        if (!notificationEl || !titleEl || !messageEl || !iconEl) {
            console.error('Notification elements not found');
            this.isShowing = false;
            return;
        }
        titleEl.textContent = notification.title;
        messageEl.textContent = notification.message;
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        iconEl.textContent = icons[notification.type] || icons.info;
        notificationEl.classList.remove('success', 'error', 'info', 'warning');
        notificationEl.classList.add(notification.type);
        notificationEl.classList.add('show');
        setTimeout(() => {
            this.hide();
        }, notification.duration);
    }

    hide() {
        const notificationEl = document.getElementById('notification');
        if (notificationEl) {
            notificationEl.classList.remove('show');
        }

        this.isShowing = false;
        this.currentNotification = null;
        setTimeout(() => {
            if (this.notificationQueue.length > 0) {
                const next = this.notificationQueue.shift();
                this.displayNotification(next);
            }
        }, 300);
    }

    
    success(title, message, duration) {
        this.show(title, message, 'success', duration);
    }

    
    error(title, message, duration) {
        this.show(title, message, 'error', duration);
    }

    
    info(title, message, duration) {
        this.show(title, message, 'info', duration);
    }

    
    warning(title, message, duration) {
        this.show(title, message, 'warning', duration);
    }

    
    clearAll() {
        this.hide();
        this.notificationQueue = [];
    }
}
