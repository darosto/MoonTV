import { DashboardPage } from "./pages/dashboard-page.js";
import { TVPage } from "./pages/tv-page.js";
import { GuidePage } from "./pages/guide-page.js";
import { inputController } from "./core/input-controller.js";

class Application {
    constructor() {
        this.currentPage = null;
    }

    start() {
        inputController.start();
        if (document.querySelector("#channel-list")) {
            this.currentPage = new TVPage();
        } else if (document.querySelector("#guide")) {
            this.currentPage = new GuidePage();
        } else if (document.querySelector(".focusable")) {
            this.currentPage = new DashboardPage();
        }

        this.currentPage?.initialize();
    }

    stop() {
        inputController.stop();
        this.currentPage?.destroy();
        this.currentPage = null;
    }
}

const application = new Application();

document.addEventListener("DOMContentLoaded", () => {
    application.start();
});

window.addEventListener("beforeunload", () => {
    application.stop();
});

window.moontv = application;
