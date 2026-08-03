export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, callback) {
        if (typeof callback !== "function") {
            throw new TypeError("EventBus.on erwartet eine Funktion.");
        }

        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName).add(callback);

        return () => {
            this.off(eventName, callback);
        };
    }

    once(eventName, callback) {
        const unsubscribe = this.on(eventName, (payload) => {
            unsubscribe();
            callback(payload);
        });

        return unsubscribe;
    }

    off(eventName, callback) {
        const callbacks = this.listeners.get(eventName);

        if (!callbacks) {
            return;
        }

        callbacks.delete(callback);

        if (callbacks.size === 0) {
            this.listeners.delete(eventName);
        }
    }

    emit(eventName, payload = undefined) {
        const callbacks = this.listeners.get(eventName);

        if (!callbacks) {
            return;
        }

        for (const callback of [...callbacks]) {
            try {
                callback(payload);
            } catch (error) {
                console.error(
                    `Fehler im EventBus-Listener für "${eventName}":`,
                    error
                );
            }
        }
    }

    clear(eventName = null) {
        if (eventName === null) {
            this.listeners.clear();
            return;
        }

        this.listeners.delete(eventName);
    }
}

export const eventBus = new EventBus();
