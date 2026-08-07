import { Page } from "../core/page.js";
import {
    navigationController
} from "../core/navigation-controller.js";

export class GuidePage extends Page {
    constructor() {
        super();

        this.root = null;
        this.rows = [];
        this.selectedChannelIndex = 0;
        this.selectedEventIndex = 0;
        this.scrollArea = null;

        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
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

        navigationController.setTarget(this);

        this.root.addEventListener(
            "click",
            this.handleClick
        );

        this.root.addEventListener(
            "dblclick",
            this.handleDoubleClick
        );
        this.activatePendingChannel();

        this.updateSelection();
    }

    destroy() {

        this.root?.removeEventListener(
            "click",
            this.handleClick
        );

        this.root?.removeEventListener(
            "dblclick",
            this.handleDoubleClick
        );

        this.scrollArea?.removeEventListener(
            "scroll",
            this.handleScroll
        );

        navigationController.clearTarget(this);
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

        this.scrollSelectionIntoView(selectedEvent);
        this.updateDetails(selectedEvent);
    }

    activate() {
        const selectedEvent = this.getSelectedEvent();

        if (!selectedEvent) {
            return;
        }

        const channel = {
            uuid: selectedEvent.dataset.channelUuid ?? "",
            number: Number(selectedEvent.dataset.channelNumber),
            name: selectedEvent.dataset.channelName ?? "",
            logo: selectedEvent.dataset.channelLogo ?? "",
            streamUrl: selectedEvent.dataset.streamUrl ?? "",
            event: selectedEvent.dataset.title ?? "",
        };

        sessionStorage.setItem(
            "tvh-quick-gui.pending-channel",
            JSON.stringify(channel)
        );

        window.location.assign("/tv");

        console.log(
            "Guide-Auswahl aktiviert:",
            selectedEvent.dataset
        );
    }

    back() {
        window.location.assign("/");
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

        const logo = document.querySelector(
            "#guide-detail-logo"
        );

        const logoUrl = eventElement.dataset.logo?.trim();

        if (logo) {
            if (logoUrl) {
                logo.src = logoUrl;
                logo.alt = eventElement.dataset.channel
                    ? `Logo von ${eventElement.dataset.channel}`
                    : "Senderlogo";

                logo.hidden = false;
            } else {
                logo.removeAttribute("src");
                logo.alt = "";
                logo.hidden = true;
            }
        }

    }
    handleScroll() {
        if (!this.scrollArea || !this.channelColumn) {
            return;
        }

        this.channelColumn.scrollTop =
            this.scrollArea.scrollTop;
    }
    selectEvent(eventElement) {
        const row = eventElement.closest(".guide-row");

        if (!row) {
            return false;
        }

        const channelIndex = this.rows.indexOf(row);

        if (channelIndex === -1) {
            return false;
        }

        const events = Array.from(
            row.querySelectorAll(".guide-event")
        );

        const eventIndex = events.indexOf(eventElement);

        if (eventIndex === -1) {
            return false;
        }

        const selectionChanged =
            channelIndex !== this.selectedChannelIndex ||
            eventIndex !== this.selectedEventIndex;

        this.selectedChannelIndex = channelIndex;
        this.selectedEventIndex = eventIndex;

        this.updateSelection();

        return selectionChanged;
    }
    handleClick(event) {
        const eventElement = event.target.closest(
            ".guide-event"
        );

        if (
            !eventElement ||
            !this.root.contains(eventElement)
        ) {
            return;
        }

        const selectionChanged =
            this.selectEvent(eventElement);

        /*
         * Erster Klick:
         * Sendung nur auswählen.
         *
         * Klick auf bereits ausgewählte Sendung:
         * Auswahl aktivieren.
         */
        if (!selectionChanged) {
            navigationController.activate();
        }
    }
    handleDoubleClick(event) {
        const eventElement = event.target.closest(
            ".guide-event"
        );

        if (
            !eventElement ||
            !this.root.contains(eventElement)
        ) {
            return;
        }

        event.preventDefault();

        this.selectEvent(eventElement);
        navigationController.activate();
    }
    scrollSelectionIntoView(eventElement) {
        if (!this.scrollArea || !eventElement) {
            return;
        }

        const scrollRect =
            this.scrollArea.getBoundingClientRect();

        const eventRect =
            eventElement.getBoundingClientRect();

        const horizontalMargin = 24;
        const verticalMargin = 8;

        if (
            eventRect.right >
            scrollRect.right - horizontalMargin
        ) {
            this.scrollArea.scrollLeft +=
                eventRect.right -
                scrollRect.right +
                horizontalMargin;
        }

        if (
            eventRect.left <
            scrollRect.left + horizontalMargin
        ) {
            this.scrollArea.scrollLeft -=
                scrollRect.left -
                eventRect.left +
                horizontalMargin;
        }

        if (
            eventRect.bottom >
            scrollRect.bottom - verticalMargin
        ) {
            this.scrollArea.scrollTop +=
                eventRect.bottom -
                scrollRect.bottom +
                verticalMargin;
        }

        if (
            eventRect.top <
            scrollRect.top + verticalMargin
        ) {
            this.scrollArea.scrollTop -=
                scrollRect.top -
                eventRect.top +
                verticalMargin;
        }
    }

    activatePendingChannel() {
    const storageKey = "tvh-quick-gui.pending-channel";
    const storedChannel = sessionStorage.getItem(storageKey);

    if (!storedChannel) {
        return;
    }

    sessionStorage.removeItem(storageKey);

    try {
        const channel = JSON.parse(storedChannel);

        if (!channel?.uuid || !channel?.streamUrl) {
            return;
        }

        this.currentChannel = channel;

        eventBus.emit(
            Events.CHANNEL_ACTIVATE,
            channel
        );

        eventBus.emit(
            Events.CHANNEL_LIST_HIDE
        );
    } catch (error) {
        console.error(
            "Gespeicherter Guide-Sender ist ungültig:",
            error
        );
    }
}
}