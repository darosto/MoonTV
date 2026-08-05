class NavigationController {
    constructor() {
        this.target = null;
    }

    setTarget(target) {
        this.target = target;
    }

    clearTarget(target = null) {
        if (target && this.target !== target) {
            return;
        }

        this.target = null;
    }

    moveUp() {
        this.invoke("moveUp");
    }

    moveDown() {
        this.invoke("moveDown");
    }

    moveLeft() {
        this.invoke("moveLeft");
    }

    moveRight() {
        this.invoke("moveRight");
    }

    activate() {
        this.invoke("activate");
    }

    back() {
        this.invoke("back");
    }

    invoke(actionName) {
        if (!this.target) {
            return;
        }

        const action = this.target[actionName];

        if (typeof action !== "function") {
            console.warn(
                `NavigationController: Ziel unterstützt "${actionName}" nicht.`
            );
            return;
        }

        action.call(this.target);
    }
}

export const navigationController =
    new NavigationController();