import { Page } from "../core/page.js";

export class DashboardPage extends Page {
    constructor() {
        super();

        this.items = [];
        this.current = null;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleFocusIn = this.handleFocusIn.bind(this);
    }

    initialize() {
        this.items = Array.from(
            document.querySelectorAll(".focusable")
        ).filter((item) => !item.disabled);

        if (this.items.length === 0) {
            return;
        }

        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("focusin", this.handleFocusIn);

        const initialItem =
            this.items.find((item) =>
                item.classList.contains("active")
            ) ?? this.items[0];

        this.setFocus(initialItem);
    }

    destroy() {
        document.removeEventListener(
            "keydown",
            this.handleKeyDown
        );

        document.removeEventListener(
            "focusin",
            this.handleFocusIn
        );
    }

    handleFocusIn(event) {
        const item = event.target.closest(".focusable");

        if (item && this.items.includes(item)) {
            this.setFocus(item);
        }
    }

    handleKeyDown(event) {
        const directions = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down",
        };

        const direction = directions[event.key];

        if (direction) {
            event.preventDefault();

            const next = this.findNext(direction);

            if (next) {
                this.setFocus(next);
            }

            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.activateCurrent();
        }
    }

    setFocus(element) {
        if (!element || element === this.current) {
            return;
        }

        this.items.forEach((item) => {
            item.classList.remove("focused");
            item.tabIndex = -1;
        });

        this.current = element;
        this.current.classList.add("focused");
        this.current.tabIndex = 0;
        this.current.focus({ preventScroll: true });
    }

    getPosition(element) {
        return {
            row: Number(element.dataset.focusRow),
            col: Number(element.dataset.focusCol),
        };
    }

    findNext(direction) {
        if (!this.current) {
            return null;
        }

        const current = this.getPosition(this.current);

        const candidates = this.items
            .filter((item) => item !== this.current)
            .map((item) => {
                const position = this.getPosition(item);

                return {
                    element: item,
                    row: position.row,
                    col: position.col,
                    rowDistance: Math.abs(
                        position.row - current.row
                    ),
                    colDistance: Math.abs(
                        position.col - current.col
                    ),
                };
            })
            .filter((candidate) => {
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
            });

        candidates.sort((a, b) => {
            const horizontal =
                direction === "left" ||
                direction === "right";

            if (horizontal) {
                if (a.rowDistance !== b.rowDistance) {
                    return a.rowDistance - b.rowDistance;
                }

                return a.colDistance - b.colDistance;
            }

            if (a.colDistance !== b.colDistance) {
                return a.colDistance - b.colDistance;
            }

            return a.rowDistance - b.rowDistance;
        });

        return candidates[0]?.element ?? null;
    }

    activateCurrent() {
        if (!this.current) {
            return;
        }

        const action = this.current.dataset.action;

        if (action) {
            window.location.href = action;
            return;
        }

        this.current.click();
    }
}
