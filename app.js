
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import taskRoutes from "./Backend/tasks.js";
import userRoutes from "./Backend/users.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("Frontend"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: "secretKey123",
    resave: false,
    saveUninitialized: true
}));

// Routes
app.use("/", userRoutes);
app.use("/", taskRoutes);

// Start
app.listen(3000, () => console.log("💠 Server running on http://localhost:3000"));
