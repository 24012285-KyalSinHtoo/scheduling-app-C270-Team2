
import express from "express";
import bcrypt from "bcrypt";
import { users } from "./usersData.js";

const router = express.Router();

router.get("/", (req, res) => res.render("Welcome"));

router.get("/login", (req, res) => res.render("Login"));
router.get("/register", (req, res) => res.render("Register"));

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    users.push({ username, password: hashed });
    res.redirect("/login");
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) return res.send("User not found!");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.send("Wrong password!");

    req.session.user = username;
    res.redirect("/dashboard");
});

router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

export default router;
