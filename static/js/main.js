import { DashboardPage } from "./pages/dashboard-page.js";
import { TVPage } from "./pages/tv-page.js";

class Application {
    constructor() {
        this.currentPage = null;
    }

    start() {
        if (document.querySelector("#channel-list")) {
            this.currentPage = new TVPage();
        } else if (document.querySelector(".focusable")) {
            this.currentPage = new DashboardPage();
        }

        this.currentPage?.initialize();
    }

    stop() {
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
