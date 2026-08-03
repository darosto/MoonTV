"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const clock = document.getElementById("clock");

    if (!clock) {
        return;
    }

    const updateClock = () => {
        clock.textContent = new Date().toLocaleTimeString("de-CH", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    updateClock();
    window.setInterval(updateClock, 1000);
});
