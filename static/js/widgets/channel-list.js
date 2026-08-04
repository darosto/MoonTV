import { Widget } from "../core/widget.js";
import { eventBus } from "../core/event-bus.js";
import { Events } from "../core/events.js";

export class ChannelList extends Widget {
    constructor(rootSelector = "#channel-list") {
        super();

        this.rootSelector = rootSelector;
        this.root = null;
        this.track = null;
        this.rows = [];
        this.unsubscribers = [];

        this.selectedIndex = 0;
        this.rowHeight = 90;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
    }

    initialize() {
        this.root = document.querySelector(this.rootSelector);

        if (!this.root) {
            console.warn(
                `ChannelList: Element ${this.rootSelector} wurde nicht gefunden.`
            );
            return;
        }

        this.track = this.root.querySelector("#channel-list-track");
        this.rows = Array.from(
            this.root.querySelectorAll(".channel-row")
        );

        if (!this.track || this.rows.length === 0) {
            console.warn("ChannelList: Keine Senderzeilen gefunden.");
            return;
        }

        const initialIndex = Number(
            this.root.dataset.selectedIndex ?? 0
        );

        this.selectedIndex = this.isValidIndex(initialIndex)
            ? initialIndex
            : 0;

        this.root.addEventListener("keydown", this.handleKeyDown);
        this.root.addEventListener("wheel", this.handleWheel, {
            passive: false,
        });
        this.root.addEventListener("click", this.handleClick);

        this.updateSelection({
            animate: false,
            focus: true,
        });
        eventBus.on(
            Events.CHANNEL_LIST_SHOW,
            () => this.show()
        );

        eventBus.on(
            Events.CHANNEL_LIST_HIDE,
            () => this.hide()
        );
        this.unsubscribers.push(
            eventBus.on(
                Events.CHANNEL_LIST_SHOW,
                () => this.show()
            )
        );

        this.unsubscribers.push(
            eventBus.on(
                Events.CHANNEL_LIST_HIDE,
                () => this.hide()
            )
        );
        this.root.addEventListener(
            "dblclick",
            this.handleDoubleClick
        );
    }

    destroy() {
        if (!this.root) {
            return;
        }

        this.root.removeEventListener("keydown", this.handleKeyDown);
        this.root.removeEventListener("wheel", this.handleWheel);
        this.root.removeEventListener("click", this.handleClick);
        for (const unsubscribe of this.unsubscribers) {
            unsubscribe();
        }
        this.root.removeEventListener(
            "dblclick",
            this.handleDoubleClick
        );
        this.unsubscribers = [];
    }


    next() {
        const nextIndex =
            (this.selectedIndex + 1) % this.rows.length;

        this.select(nextIndex);
    }

    previous() {
        const previousIndex =
            (this.selectedIndex - 1 + this.rows.length) %
            this.rows.length;

        this.select(previousIndex);
    }

    select(index, options = {}) {
        if (!this.isValidIndex(index)) {
            return;
        }

        this.selectedIndex = index;

        this.updateSelection({
            animate: options.animate ?? true,
            focus: options.focus ?? true,
        });
    }

    getSelectedRow() {
        return this.rows[this.selectedIndex] ?? null;
    }

    getSelectedChannel() {
        const row = this.getSelectedRow();

        if (!row) {
            return null;
        }

        return {
        index: this.selectedIndex,
        number: Number(row.dataset.channelNumber),
        uuid: row.dataset.channelUuid ?? "",
        name: row.dataset.channelName ?? "",
        logo: row.dataset.channelLogo ?? "",
        streamUrl: row.dataset.streamUrl ?? "",
        event: row.dataset.channelEvent ?? "",
        start: Number(row.dataset.channelStart || 0),
        stop: Number(row.dataset.channelStop || 0),
        progress: Number(row.dataset.channelProgress || 0),
        };
    }

    activateSelected() {
        const channel = this.getSelectedChannel();

        if (!channel) {
            return;
        }
        eventBus.emit(Events.CHANNEL_ACTIVATE, channel);
    }

    updateSelection({ animate, focus }) {
        this.rows.forEach((row, index) => {
            const selected = index === this.selectedIndex;

            row.classList.toggle("selected", selected);
            row.tabIndex = selected ? 0 : -1;
            row.setAttribute("aria-selected", String(selected));
        });

        this.updateTrackPosition(animate);

        const selectedRow = this.getSelectedRow();

        if (focus && selectedRow) {
            selectedRow.focus({
                preventScroll: true,
            });
        }

        const channel = this.getSelectedChannel();

        if (channel) {
            eventBus.emit(Events.CHANNEL_CHANGE, channel);
        }
    }

    updateTrackPosition(animate) {
        const viewportHeight = this.root.clientHeight;
        const focusOffset =
            Math.floor(viewportHeight / 2 / this.rowHeight) *
            this.rowHeight;

        const desiredOffset =
            focusOffset - this.selectedIndex * this.rowHeight;

        const minimumOffset =
            viewportHeight - this.rows.length * this.rowHeight;

        const maximumOffset = 0;

        const clampedOffset = Math.min(
            maximumOffset,
            Math.max(minimumOffset, desiredOffset)
        );

        this.track.style.transition = animate
            ? "transform 180ms ease-out"
            : "none";

        this.track.style.transform =
            `translate3d(0, ${clampedOffset}px, 0)`;
    }

    handleKeyDown(event) {
        switch (event.key) {
            case "ArrowUp":
            case "PageUp":
                event.preventDefault();
                event.stopPropagation();
                this.previous();
                break;

            case "ArrowDown":
            case "PageDown":
                event.preventDefault();
                event.stopPropagation();
                this.next();
                break;

            case "Enter":
            case " ":
                event.preventDefault();
                event.stopPropagation();
                this.activateSelected();
                break;

            case "Escape":
            case "Backspace":
                event.preventDefault();
                event.stopPropagation();

                this.root.dispatchEvent(
                    new CustomEvent("channelclose", {
                        bubbles: true,
                    })
                );
                break;

            case "ArrowRight":
                event.preventDefault();
                event.stopPropagation();

                eventBus.emit(
                    Events.CHANNEL_DETAILS_OPEN,
                    this.getSelectedChannel()
                );
                break;
        }
    }

    handleWheel(event) {
        event.preventDefault();

        if (event.deltaY < 0) {
            this.previous();
        } else if (event.deltaY > 0) {
            this.next();
        }
    }

    handleClick(event) {
        const row = event.target.closest(".channel-row");

        if (!row || !this.root.contains(row)) {
            return;
        }

        const index = this.rows.indexOf(row);

        if (index === -1) {
            return;
        }

        /*
         * Erster Klick:
         * Sender markieren und Detaildaten aktualisieren.
         */
        if (index !== this.selectedIndex) {
            this.select(index, {
                animate: true,
                focus: true,
            });

            return;
        }

        /*
         * Zweiter Klick auf den bereits markierten Sender:
         * Sender starten.
         */
        this.activateSelected();
    }

    handleDoubleClick(event) {
        const row = event.target.closest(".channel-row");

        if (!row || !this.root.contains(row)) {
            return;
        }

        const index = this.rows.indexOf(row);

        if (index === -1) {
            return;
        }

        this.select(index, {
            animate: false,
            focus: true,
        });

        this.activateSelected();
    }

    isValidIndex(index) {
        return (
            Number.isInteger(index) &&
            index >= 0 &&
            index < this.rows.length
        );
    }

    show() {
        if (!this.root) {
            return;
        }

        this.root.inert = false;
        this.root.classList.remove("hidden");

        const selectedRow = this.getSelectedRow();

        if (selectedRow) {
            selectedRow.focus({
                preventScroll: true,
            });
        }
    }

    hide() {
        if (!this.root) {
            return;
        }

        const selectedRow = this.getSelectedRow();

        if (selectedRow) {
            selectedRow.blur();
        }

        this.root.classList.add("hidden");
        this.root.inert = true;
    }

    isVisible() {
        return Boolean(
            this.root &&
            !this.root.classList.contains("hidden")
        );
    }


    activateSelected() {
        const channel = this.getSelectedChannel();

        if (!channel) {
            return;
        }
        console.log("ChannelList sendet CHANNEL_ACTIVATE:", channel);
        eventBus.emit(
            Events.CHANNEL_ACTIVATE,
            channel
        );

        setTimeout(() => {
            eventBus.emit(Events.CHANNEL_LIST_HIDE);
        }, 1200);

    }
}
