import { Page } from "../core/page.js";
import {
    navigationController
} from "../core/navigation-controller.js";

export class DashboardPage extends Page {
    constructor() {
        super();

        this.items = [];
        this.current = null;
        this.selectedIndex = 0;
    }

    initialize() {
        this.items = Array.from(
            document.querySelectorAll(".focusable")
        );

        this.items.forEach((item, index) => {
            item.addEventListener("click", () => {
                this.selectedIndex = index;
                this.updateSelection();

                const action = item.dataset.action;

                if (action) {
                    window.location.href = action;
                }
            });
        });

        if (this.items.length === 0) {
            return;
        }

        navigationController.setTarget(this);

        const focusedIndex = this.items.findIndex(
            (item) =>
                item.classList.contains("selected")
        );

        if (focusedIndex >= 0) {
            this.selectedIndex = focusedIndex;
        }

        this.updateSelection();
    }

    destroy() {
        navigationController.clearTarget(this);
    }

    moveLeft() {
        this.selectedIndex = Math.max(
            0,
            this.selectedIndex - 1
        );

        this.updateSelection();
    }

    moveRight() {
        this.selectedIndex = Math.min(
            this.items.length - 1,
            this.selectedIndex + 1
        );

        this.updateSelection();
    }

    moveUp() {
        this.moveLeft();
    }

    moveDown() {
        this.moveRight();
    }

    activate() {
        const item = this.items[this.selectedIndex];

        if (!item) {
            return;
        }

        const action = item.dataset.action;

        if (action) {
            window.location.href = action;
            return;
        }

        item.click();
    }

    back() {
        // Auf dem Dashboard gibt es keine vorherige Seite.
    }
    updateSelection() {
        this.items.forEach(
            (item, index) => {
                const selected =
                    index === this.selectedIndex;

                item.classList.toggle(
                    "focused",
                    selected
                );

                item.tabIndex =
                    selected ? 0 : -1;
            }
        );

        const selectedItem =
            this.items[this.selectedIndex];

        selectedItem?.focus({
            preventScroll: true,
        });
    }
    moveLeft() {
        this.move("left");
    }

    moveRight() {
        this.move("right");
    }

    moveUp() {
        this.move("up");
    }

    moveDown() {
        this.move("down");
    }
    move(direction) {
        const current =
            this.items[this.selectedIndex];

        if (!current) {
            return;
        }

        const currentRow =
            Number(current.dataset.focusRow);

        const currentCol =
            Number(current.dataset.focusCol);

        const candidates = this.items
            .map((item, index) => {
                if (index === this.selectedIndex) {
                    return null;
                }

                const row =
                    Number(item.dataset.focusRow);

                const col =
                    Number(item.dataset.focusCol);

                return {
                    index,
                    row,
                    col,
                    rowDistance:
                        Math.abs(row - currentRow),
                    colDistance:
                        Math.abs(col - currentCol),
                };
            })
            .filter(Boolean)
            .filter((candidate) => {
                switch (direction) {
                    case "left":
                        return candidate.col < currentCol;

                    case "right":
                        return candidate.col > currentCol;

                    case "up":
                        return candidate.row < currentRow;

                    case "down":
                        return candidate.row > currentRow;

                    default:
                        return false;
                }
            });

        candidates.sort((a, b) => {
            const horizontal =
                direction === "left" ||
                direction === "right";

            if (horizontal) {
                if (
                    a.rowDistance !==
                    b.rowDistance
                ) {
                    return (
                        a.rowDistance -
                        b.rowDistance
                    );
                }

                return (
                    a.colDistance -
                    b.colDistance
                );
            }

            if (
                a.colDistance !==
                b.colDistance
            ) {
                return (
                    a.colDistance -
                    b.colDistance
                );
            }

            return (
                a.rowDistance -
                b.rowDistance
            );
        });

        const next = candidates[0];

        if (!next) {
            return;
        }

        this.selectedIndex = next.index;
        this.updateSelection();
    }
}
