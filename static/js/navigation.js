"use strict";

class FocusManager {
    constructor(selector = ".focusable") {
        this.selector = selector;
        this.items = [];
        this.current = null;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handlePointerFocus = this.handlePointerFocus.bind(this);
    }

    init() {
        this.refresh();

        if (this.items.length === 0) {
            console.warn("FocusManager: Keine fokussierbaren Elemente gefunden.");
            return;
        }

        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("focusin", this.handlePointerFocus);

        const activeItem =
            this.items.find((item) => item.classList.contains("active")) ??
            this.items[0];

        this.setFocus(activeItem);
    }

    refresh() {
        this.items = Array.from(document.querySelectorAll(this.selector))
            .filter((item) => !item.disabled && this.isVisible(item))
            .map((item) => {
                if (!item.hasAttribute("tabindex") && item.tagName !== "BUTTON") {
                    item.setAttribute("tabindex", "-1");
                }

                return item;
            });
    }

    isVisible(element) {
        return Boolean(
            element.offsetWidth ||
            element.offsetHeight ||
            element.getClientRects().length
        );
    }

    getPosition(element) {
        return {
            row: Number(element.dataset.focusRow),
            col: Number(element.dataset.focusCol),
        };
    }

    setFocus(element) {
        if (!element) {
            return;
        }

        this.items.forEach((item) => {
            item.classList.remove("focused");
            item.setAttribute("tabindex", "-1");
        });

        this.current = element;
        this.current.classList.add("focused");
        this.current.setAttribute("tabindex", "0");
        this.current.focus({ preventScroll: true });
        this.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        });
    }

    handlePointerFocus(event) {
        const item = event.target.closest(this.selector);

        if (item && this.items.includes(item) && item !== this.current) {
            this.setFocus(item);
        }
    }

    handleKeyDown(event) {
        if (!this.current) {
            return;
        }

        const directionByKey = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down",
        };

        const direction = directionByKey[event.key];

        if (direction) {
            event.preventDefault();

            const nextItem = this.findNext(direction);

            if (nextItem) {
                this.setFocus(nextItem);
            }

            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.activateCurrent();
            return;
        }

        if (event.key === "Escape" || event.keyCode === 461) {
            event.preventDefault();
            this.moveToMenu();
        }
    }

    findNext(direction) {
        const currentPosition = this.getPosition(this.current);

        const candidates = this.items
            .filter((item) => item !== this.current)
            .map((item) => {
                const position = this.getPosition(item);

                return {
                    element: item,
                    row: position.row,
                    col: position.col,
                    rowDistance: Math.abs(position.row - currentPosition.row),
                    colDistance: Math.abs(position.col - currentPosition.col),
                };
            })
            .filter((candidate) =>
                this.isInDirection(candidate, currentPosition, direction)
            );

        if (candidates.length === 0) {
            return null;
        }

        candidates.sort((a, b) =>
            this.compareCandidates(a, b, currentPosition, direction)
        );

        return candidates[0].element;
    }

    isInDirection(candidate, current, direction) {
        switch (direction) {
            case "left":
                return candidate.col < current.col;

            case "right":
                return candidate.col > current.col;

            case "up":
                return candidate.row < current.row;

            case "down":
                return candidate.row > current.row;

            default:
                return false;
        }
    }

    compareCandidates(a, b, current, direction) {
        const horizontal = direction === "left" || direction === "right";

        if (horizontal) {
            const primaryA = Math.abs(a.col - current.col);
            const primaryB = Math.abs(b.col - current.col);

            if (a.rowDistance !== b.rowDistance) {
                return a.rowDistance - b.rowDistance;
            }

            return primaryA - primaryB;
        }

        const primaryA = Math.abs(a.row - current.row);
        const primaryB = Math.abs(b.row - current.row);

        if (a.colDistance !== b.colDistance) {
            return a.colDistance - b.colDistance;
        }

        return primaryA - primaryB;
    }

    activateCurrent() {
        const action = this.current.dataset.action;

        if (action) {
            window.location.href = action;
            return;
        }

        this.current.click();
    }

    moveToMenu() {
        const currentPosition = this.getPosition(this.current);

        const menuItem =
            this.items.find((item) => {
                const position = this.getPosition(item);

                return position.col === 0 && position.row === currentPosition.row;
            }) ??
            this.items.find((item) => this.getPosition(item).col === 0);

        if (menuItem) {
            this.setFocus(menuItem);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const focusManager = new FocusManager();
    focusManager.init();

    window.focusManager = focusManager;
});
