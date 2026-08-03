import { Page } from "../core/page.js";
import { eventBus } from "../core/event-bus.js";
import { Events } from "../core/events.js";
import { ChannelList } from "../widgets/channel-list.js";
import { Player } from "../widgets/player.js";


export class TVPage extends Page {
    constructor() {
        super();

        this.channelList = null;
        this.player = null;
        this.unsubscribers = [];
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChannelChange =
            this.handleChannelChange.bind(this);

        this.handleChannelActivate =
            this.handleChannelActivate.bind(this);

        this.handleChannelClose =
            this.handleChannelClose.bind(this);

        this.handleDetailsOpen =
            this.handleDetailsOpen.bind(this);
    }

initialize() {
    if (!document.querySelector("#channel-list")) {
        return;
    }

    this.unsubscribers.push(
        eventBus.on(
            Events.CHANNEL_CHANGE,
            (channel) => this.handleChannelChange(channel)
        )
    );

    this.unsubscribers.push(
        eventBus.on(
            Events.CHANNEL_ACTIVATE,
            (channel) => this.handleChannelActivate(channel)
        )
    );

    this.unsubscribers.push(
        eventBus.on(
            Events.CHANNEL_LIST_CLOSE,
            () => this.handleChannelClose()
        )
    );

    this.unsubscribers.push(
        eventBus.on(
            Events.CHANNEL_DETAILS_OPEN,
            (channel) => this.handleDetailsOpen(channel)
        )
    );

    document.addEventListener(
        "keydown",
        this.handleKeyDown
    );

    this.channelList = new ChannelList("#channel-list");
    this.channelList.initialize();

    this.player = new Player("#tv-player");
    this.player.initialize();
}

handleKeyDown(event) {
    if (event.key !== "ArrowLeft") {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    eventBus.emit(Events.CHANNEL_LIST_SHOW);
}

destroy() {
    for (const unsubscribe of this.unsubscribers) {
        unsubscribe();
    }

    this.unsubscribers = [];
    this.player?.destroy();
    this.channelList?.destroy();
    document.removeEventListener(
       "keydown",
      this.handleKeyDown
    );
}


    handleChannelChange(channel) {
        console.log(channel);
    }

    handleChannelActivate(channel) {
        console.log("Sender ausgewählt:", channel);
    }

    handleDetailsOpen(channel) {
        console.log(channel);
    }

    handleChannelClose() {
        window.location.href = "/";
    }

}

