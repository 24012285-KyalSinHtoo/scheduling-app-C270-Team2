
setInterval(() => {
    const now = new Date().toISOString().split("T")[0];

    document.querySelectorAll(".task-card").forEach(card => {
        const due = card.dataset.due;

        if (due < now) {
            card.style.border = "2px solid red";
        }
    });

}, 1000);
