import { Widget } from "../core/widget.js";
import { eventBus } from "../core/event-bus.js";
import { Events } from "../core/events.js";

export class Player extends Widget {
    constructor(selector = "#tv-player") {
        super();

        this.selector = selector;
        this.video = null;
        this.loading = null;
        this.error = null;
        this.unsubscribe = null;

        this.handlePlaying = this.handlePlaying.bind(this);
        this.handleWaiting = this.handleWaiting.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    initialize() {
        this.video = document.querySelector(this.selector);
        this.loading = document.querySelector("#player-loading");
        this.error = document.querySelector("#player-error");

        if (!this.video) {
            console.warn("Player: Videoelement wurde nicht gefunden.");
            return;
        }

        this.video.addEventListener("playing", this.handlePlaying);
        this.video.addEventListener("waiting", this.handleWaiting);
        this.video.addEventListener("loadstart", this.handleWaiting);
        this.video.addEventListener("error", this.handleError);

        this.unsubscribe = eventBus.on(
            Events.CHANNEL_ACTIVATE,
            (channel) => this.playChannel(channel)
        );
    }

    destroy() {
        this.unsubscribe?.();

        if (!this.video) {
            return;
        }

        this.video.removeEventListener("playing", this.handlePlaying);
        this.video.removeEventListener("waiting", this.handleWaiting);
        this.video.removeEventListener("loadstart", this.handleWaiting);
        this.video.removeEventListener("error", this.handleError);

        this.stop();
    }

    async playChannel(channel) {
        if (!this.video || !channel?.streamUrl) {
            return;
        }

        this.showLoading();
        this.hideError();

        this.video.pause();
        this.video.removeAttribute("src");
        this.video.load();

        this.video.src = channel.streamUrl;

        try {
            await this.video.play();
        } catch (error) {
            console.error("Player konnte nicht gestartet werden:", error);
            this.showError();
        }
    }

    stop() {
        if (!this.video) {
            return;
        }

        this.video.pause();
        this.video.removeAttribute("src");
        this.video.load();
    }

    handlePlaying() {
        this.hideLoading();
        this.hideError();
    }

    handleWaiting() {
        this.showLoading();
    }

    handleError() {
        const mediaError = this.video?.error;

        console.error("Video-Fehler:", {
            code: mediaError?.code,
            message: mediaError?.message,
        });

        this.hideLoading();
        this.showError();
    }

    showLoading() {
        if (this.loading) {
            this.loading.hidden = false;
        }
    }

    hideLoading() {
        if (this.loading) {
            this.loading.hidden = true;
        }
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
