type EventHandler<T = any> = (payload: T) => void;

class EventBusFactory<Events extends Record<string, any>> {
    private handlers: {
        [K in keyof Events]?: Set<EventHandler<Events[K]>>;
    } = {};

    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
        if (!this.handlers[event]) {
            this.handlers[event] = new Set();
        }
        this.handlers[event]!.add(handler);
    }

    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
        this.handlers[event]?.delete(handler);
    }

    emit<K extends keyof Events>(event: K, payload: Events[K]) {
        this.handlers[event]?.forEach((handler) => handler(payload));
    }

    clear<K extends keyof Events>(event?: K) {
        if (event) {
            this.handlers[event]?.clear();
        } else {
            (Object.keys(this.handlers) as Array<keyof Events>).forEach((e) => this.handlers[e]?.clear());
        }
    }
}

export const EventBus = new EventBusFactory();
