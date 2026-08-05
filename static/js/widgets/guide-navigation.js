export class GuideNavigation {

    constructor() {

        this.channel = 0;
        this.event = 0;

    }

    moveUp(max) {

        this.channel = Math.max(
            0,
            this.channel - 1
        );

    }

    moveDown(max) {

        this.channel = Math.min(
            max - 1,
            this.channel + 1
        );

    }

    moveLeft() {

        this.event = Math.max(
            0,
            this.event - 1
        );

    }

    moveRight(max) {

        this.event = Math.min(
            max - 1,
            this.event + 1
        );

    }

    getSelection() {

        return {

            channel: this.channel,
            event: this.event,

        };

    }

}