import { Widget } from "../core/widget.js";
import { eventBus } from "../core/event-bus.js";
import { Events } from "../core/events.js";

export class ChannelInfo extends Widget {
    constructor(selector = "#channel-info") {
        super();

        this.selector = selector;
        this.root = null;

        this.timeframe = null;
        this.clock = null;
        this.title = null;
        this.subtitle = null;
        this.description = null;
        this.eventList = null;
        this.error = null;

        this.currentChannel = null;
        this.requestController = null;
        this.unsubscribers = [];
        this.clockInterval = null;
    }

    initialize() {
        this.root = document.querySelector(this.selector);

        if (!this.root) {
            console.warn("ChannelInfo: Panel wurde nicht gefunden.");
            return;
        }

        this.timeframe = this.root.querySelector(
            "#channel-info-timeframe"
        );
        this.clock = this.root.querySelector(
            "#channel-info-clock"
        );
        this.title = this.root.querySelector(
            "#channel-info-title"
        );
        this.subtitle = this.root.querySelector(
            "#channel-info-subtitle"
        );
        this.description = this.root.querySelector(
            "#channel-info-description"
        );
        this.eventList = this.root.querySelector(
            "#channel-info-event-list"
        );
        this.error = this.root.querySelector(
            "#channel-info-error"
        );

        this.unsubscribers.push(
            eventBus.on(
                Events.CHANNEL_CHANGE,
                (channel) => {
                    this.currentChannel = channel;

                    if (this.isVisible()) {
                        this.load(channel);
                    }
                }
            )
        );

        this.unsubscribers.push(
            eventBus.on(
                Events.CHANNEL_DETAILS_OPEN,
                (channel) => {
                    this.currentChannel = channel;
                    this.show();
                    this.load(channel);
                }
            )
        );

        this.unsubscribers.push(
            eventBus.on(
                Events.CHANNEL_DETAILS_CLOSE,
                () => this.hide()
            )
        );

        this.unsubscribers.push(
            eventBus.on(
                Events.CHANNEL_INFO_SHOW,
                () => {
                    this.show();

                    if (this.currentChannel) {
                        this.load(this.currentChannel);
                    }
                }
            )
        );

        this.unsubscribers.push(
            eventBus.on(
                Events.CHANNEL_INFO_HIDE,
                () => this.hide()
            )
        );

        this.updateClock();

        this.clockInterval = window.setInterval(
            () => this.updateClock(),
            1000
        );
    }

    destroy() {
        for (const unsubscribe of this.unsubscribers) {
            unsubscribe();
        }

        this.unsubscribers = [];

        this.requestController?.abort();

        if (this.clockInterval !== null) {
            window.clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    async load(channel) {
        if (!channel?.uuid) {
            return;
        }

        this.requestController?.abort();
        this.requestController = new AbortController();

        this.hideError();
        this.renderLoading();

        try {
            const response = await fetch(
                `/api/tv/channels/${encodeURIComponent(channel.uuid)}/events`,
                {
                    signal: this.requestController.signal,
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `EPG-Antwort: HTTP ${response.status}`
                );
            }

            const data = await response.json();

            this.render(channel, data.events ?? []);
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            console.error(
                "ChannelInfo konnte nicht geladen werden:",
                error
            );

            this.renderEmpty(channel);
            this.showError();
        }
    }

    render(channel, events) {
        const currentEvent = events[0] ?? null;
        const nextEvents = events.slice(1, 6);

        if (!currentEvent) {
            this.renderEmpty(channel);
            return;
        }

        this.timeframe.textContent = this.formatTimeframe(
            currentEvent.start,
            currentEvent.stop
        );

        this.title.textContent =
            currentEvent.title || "Keine Information";

        this.subtitle.textContent =
            currentEvent.subtitle || "";

        this.description.textContent =
            currentEvent.description || "";

        this.eventList.replaceChildren();

        for (const event of nextEvents) {
            this.eventList.append(
                this.createEventListItem(event)
            );
        }
    }

    renderLoading() {
        this.timeframe.textContent = "--:-- – --:--";
        this.title.textContent = "Programminformationen werden geladen …";
        this.subtitle.textContent = "";
        this.description.textContent = "";
        this.eventList.replaceChildren();
    }

    renderEmpty(channel) {
        this.timeframe.textContent = "--:-- – --:--";
        this.title.textContent =
            channel?.name || "Keine Information";
        this.subtitle.textContent = "";
        this.description.textContent =
            "Für diesen Sender liegen keine Programminformationen vor.";
        this.eventList.replaceChildren();
    }

    createEventListItem(event) {
        const item = document.createElement("li");
        item.className = "channel-info-event-item";

        const time = document.createElement("span");
        time.className = "channel-info-event-time";
        time.textContent = this.formatTimeframe(
            event.start,
            event.stop
        );

        const title = document.createElement("span");
        title.className = "channel-info-event-title";
        title.textContent = event.title || "Keine Information";

        if (event.recording) {
            const recording = document.createElement("span");
            recording.className = "channel-info-recording";
            recording.setAttribute("aria-label", "Aufnahme aktiv");

            title.prepend(recording);
        }

        item.append(time, title);

        return item;
    }

    show() {
        if (!this.root) {
            return;
        }

        this.root.classList.remove("hidden");
        this.root.setAttribute("aria-hidden", "false");
    }

    hide() {
        if (!this.root) {
            return;
        }

        this.root.classList.add("hidden");
        this.root.setAttribute("aria-hidden", "true");
    }

    isVisible() {
        return Boolean(
            this.root &&
            !this.root.classList.contains("hidden")
        );
    }

    updateClock() {
        if (!this.clock) {
            return;
        }

        this.clock.textContent = new Date().toLocaleTimeString(
            "de-CH",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    }

    formatTimeframe(startTimestamp, stopTimestamp) {
        const start = this.formatTime(startTimestamp);
        const stop = this.formatTime(stopTimestamp);

        return `${start} – ${stop}`;
    }

    formatTime(timestamp) {
        if (!timestamp) {
            return "--:--";
        }

        return new Date(timestamp * 1000).toLocaleTimeString(
            "de-CH",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    }

    showError() {
        if (this.error) {
            this.error.hidden = false;
        }
    }

    hideError() {
        if (this.error) {
            this.error.hidden = true;
        }
    }
}