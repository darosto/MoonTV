import { Page } from "../core/page.js";

export class GuidePage extends Page {
    constructor() {
        super();

        this.root = null;
        this.rows = [];
        this.selectedChannelIndex = 0;
        this.selectedEventIndex = 0;

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    initialize() {
        this.root = document.querySelector("#guide");

        if (!this.root) {
            return;
        }

        this.scrollArea = this.root.querySelector(
            ".guide-scroll-area"
        );

        this.channelColumn = this.root.querySelector(
            ".guide-channels"
        );

        this.handleScroll = this.handleScroll.bind(this);

        this.scrollArea?.addEventListener(
            "scroll",
            this.handleScroll
        );

        this.rows = Array.from(
            this.root.querySelectorAll(".guide-row")
        );

        if (this.rows.length === 0) {
            console.warn("GuidePage: Keine Guide-Zeilen gefunden.");
            return;
        }

        document.addEventListener(
            "keydown",
            this.handleKeyDown
        );

        this.updateSelection();
    }

    destroy() {
        document.removeEventListener(
            "keydown",
            this.handleKeyDown
        );
        this.scrollArea?.removeEventListener(
            "scroll",
            this.handleScroll
        );
    }

    handleKeyDown(event) {
        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                this.moveUp();
                break;

            case "ArrowDown":
                event.preventDefault();
                this.moveDown();
                break;

            case "ArrowLeft":
                event.preventDefault();
                this.moveLeft();
                break;

            case "ArrowRight":
                event.preventDefault();
                this.moveRight();
                break;

            case "Enter":
                event.preventDefault();
                this.activateSelection();
                break;
        }
    }

    moveUp() {
        this.selectedChannelIndex = Math.max(
            0,
            this.selectedChannelIndex - 1
        );

        this.normalizeEventIndex();
        this.updateSelection();
    }

    moveDown() {
        this.selectedChannelIndex = Math.min(
            this.rows.length - 1,
            this.selectedChannelIndex + 1
        );

        this.normalizeEventIndex();
        this.updateSelection();
    }

    moveLeft() {
        this.selectedEventIndex = Math.max(
            0,
            this.selectedEventIndex - 1
        );

        this.updateSelection();
    }

    moveRight() {
        const events = this.getCurrentEvents();

        this.selectedEventIndex = Math.min(
            events.length - 1,
            this.selectedEventIndex + 1
        );

        this.updateSelection();
    }

    normalizeEventIndex() {
        const events = this.getCurrentEvents();

        if (events.length === 0) {
            this.selectedEventIndex = 0;
            return;
        }

        this.selectedEventIndex = Math.min(
            this.selectedEventIndex,
            events.length - 1
        );
    }

    getCurrentEvents() {
        const row = this.rows[this.selectedChannelIndex];

        if (!row) {
            return [];
        }

        return Array.from(
            row.querySelectorAll(".guide-event")
        );
    }

    getSelectedEvent() {
        const events = this.getCurrentEvents();

        return events[this.selectedEventIndex] ?? null;
    }

    updateSelection() {
        this.root
            .querySelectorAll(".guide-event.selected")
            .forEach((event) => {
                event.classList.remove("selected");
            });

        const selectedEvent = this.getSelectedEvent();

        if (!selectedEvent) {
            return;
        }

        selectedEvent.classList.add("selected");

        selectedEvent.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        });
        this.updateDetails(selectedEvent);
    }

    activateSelection() {
        const selectedEvent = this.getSelectedEvent();

        if (!selectedEvent) {
            return;
        }

        console.log(
            "Guide-Auswahl aktiviert:",
            selectedEvent.dataset
        );
    }
    updateDetails(eventElement) {

        document.querySelector(
            "#guide-detail-title"
        ).textContent =
            eventElement.dataset.title;

        document.querySelector(
            "#guide-detail-time"
        ).textContent =
            `${eventElement.dataset.start} - ${eventElement.dataset.stop}`;

        document.querySelector(
            "#guide-detail-description"
        ).textContent =
            eventElement.dataset.description;

    }
    handleScroll() {
        if (!this.scrollArea || !this.channelColumn) {
            return;
        }

        this.channelColumn.scrollTop =
            this.scrollArea.scrollTop;
    }
}