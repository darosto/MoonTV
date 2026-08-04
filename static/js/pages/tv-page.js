import { Page } from "../core/page.js";
import { eventBus } from "../core/event-bus.js";
import { Events } from "../core/events.js";
import { ChannelList } from "../widgets/channel-list.js";
import { Player } from "../widgets/player.js";
import { ChannelInfo } from "../widgets/channel-info.js";
import { OSD } from "../widgets/osd.js";

export class TVPage extends Page {
    constructor() {
        super();

        this.channelList = null;
        this.player = null;
        this.channelInfo = null;
        this.currentChannel = null;
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

    this.osd = new OSD("#osd");
    this.osd.initialize();

    this.channelInfo = new ChannelInfo("#channel-info");
    this.channelInfo.initialize();


}

handleKeyDown(event) {
    if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();

        if (this.currentChannel) {
            eventBus.emit(Events.OSD_SHOW, {
                channel: this.currentChannel,
                duration: 8000,
            });
        }

        return;
    }

    if (event.key !== "ArrowLeft") {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const infoPanel = document.querySelector("#channel-info");
    const channelList = document.querySelector("#channel-list");

    const infoVisible =
        infoPanel &&
        !infoPanel.classList.contains("hidden");

    const channelListVisible =
        channelList &&
        !channelList.classList.contains("hidden");

    if (infoVisible) {
        eventBus.emit(Events.CHANNEL_DETAILS_CLOSE);
        return;
    }

    if (channelListVisible) {
        eventBus.emit(Events.CHANNEL_LIST_HIDE);
        return;
    }

    eventBus.emit(Events.CHANNEL_LIST_SHOW);
}

destroy() {
    for (const unsubscribe of this.unsubscribers) {
        unsubscribe();
    }

    this.unsubscribers = [];
    this.channelInfo?.destroy();
    this.player?.destroy();
    this.channelList?.destroy();
    this.osd?.destroy();
    document.removeEventListener(
       "keydown",
      this.handleKeyDown
    );
}


    handleChannelChange(channel) {
        console.log(channel);
    }

    handleChannelActivate(channel) {
        this.currentChannel = channel;
        console.log("Sender ausgewählt:", channel);
    }

    handleDetailsOpen(channel) {
        console.log(channel);
    }

    handleChannelClose() {
        window.location.href = "/";
    }

}

