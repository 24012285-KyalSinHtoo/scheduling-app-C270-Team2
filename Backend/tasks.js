
import express from "express";
import { tasks } from "./tasksData.js";
import { v4 as uuid } from "uuid";

const router = express.Router();

function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

router.get("/dashboard", requireLogin, (req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const userTasks = tasks.filter(t => t.owner === req.session.user);

    res.render("Dashboard", {
        user: req.session.user,
        tasks: userTasks,
        today
    });
});

router.get("/add", requireLogin, (req, res) => res.render("AddTask"));
router.post("/add", requireLogin, (req, res) => {
    const { title, priority, due } = req.body;

    tasks.push({
        id: uuid(),
        title,
        priority,
        due,
        owner: req.session.user,
        completed: false
    });

    res.redirect("/dashboard");
});

router.get("/edit/:id", requireLogin, (req, res) => {
    const task = tasks.find(t => t.id === req.params.id);
    res.render("EditTask", { task });
});

router.post("/edit/:id", requireLogin, (req, res) => {
    const task = tasks.find(t => t.id === req.params.id);

    task.title = req.body.title;
    task.priority = req.body.priority;
    task.due = req.body.due;

    res.redirect("/dashboard");
});

router.get("/delete/:id", requireLogin, (req, res) => {
    const index = tasks.findIndex(t => t.id === req.params.id);
    tasks.splice(index, 1);
    res.redirect("/dashboard");
});

export default router;
