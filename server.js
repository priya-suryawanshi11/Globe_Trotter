
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ==============================
// MIDDLEWARE
// ==============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "development-only-change-this-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 2 * 60 * 60 * 1000
        }
    })
);

// Serve frontend files from public
app.use(express.static(path.join(__dirname, "public")));

// ==============================
// HOME AND HEALTH CHECK
// ==============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "GlobeTrotter backend is running."
    });
});

app.get("/api/db-check", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "MySQL connection successful."
        });
    } catch (error) {
        console.error("Database check error:", error);

        res.status(500).json({
            success: false,
            message: "MySQL connection failed.",
            error: error.message
        });
    }
});

// ==============================
// REGISTER
// ==============================

app.post("/api/auth/register", async (req, res) => {
    try {
        const {
            fullName,
            email,
            username,
            password,
            confirmPassword
        } = req.body || {};

        if (
            typeof fullName !== "string" ||
            typeof email !== "string" ||
            typeof username !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        const name = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim();

        if (name.length < 2 || name.length > 80) {
            return res.status(400).json({
                success: false,
                message: "Name must contain 2 to 80 characters."
            });
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
            cleanEmail.length > 120
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address."
            });
        }

        if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) {
            return res.status(400).json({
                success: false,
                message:
                    "Username must contain 3–20 letters, numbers or underscores."
            });
        }

        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({
                success: false,
                message: "Password must contain 8–128 characters."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const [existing] = await db.execute(
            `SELECT user_id
             FROM users
             WHERE email = ? OR username = ?
             LIMIT 1`,
            [cleanEmail, cleanUsername]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email or username is already registered."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            `INSERT INTO users
                (full_name, email, username, password_hash)
             VALUES (?, ?, ?, ?)`,
            [name, cleanEmail, cleanUsername, passwordHash]
        );

        req.session.regenerate((error) => {
            if (error) {
                console.error("Registration session error:", error);

                return res.status(500).json({
                    success: false,
                    message:
                        "Account created, but automatic sign-in failed. Please log in."
                });
            }

            req.session.user = {
                id: result.insertId,
                fullName: name,
                email: cleanEmail,
                username: cleanUsername,
                role: "user"
            };

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Session save error:", saveError);

                    return res.status(500).json({
                        success: false,
                        message:
                            "Account created, but sign-in failed. Please log in."
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: "Account created successfully.",
                    user: req.session.user
                });
            });
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email or username is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed. Check the server terminal."
        });
    }
});

// ==============================
// LOGIN
// ==============================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter your email and password."
            });
        }

        const [users] = await db.execute(
            `SELECT
                user_id,
                full_name,
                email,
                username,
                password_hash,
                role
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email.trim().toLowerCase()]
        );

        if (
            users.length === 0 ||
            !(await bcrypt.compare(password, users[0].password_hash))
        ) {
            return res.status(401).json({
                success: false,
                message: "Incorrect email or password."
            });
        }

        const user = users[0];

        req.session.regenerate((error) => {
            if (error) {
                console.error("Login session error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Could not start your session."
                });
            }

            req.session.user = {
                id: user.user_id,
                fullName: user.full_name,
                email: user.email,
                username: user.username,
                role: user.role
            };

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Login session save error:", saveError);

                    return res.status(500).json({
                        success: false,
                        message: "Could not save your session."
                    });
                }

                return res.json({
                    success: true,
                    message: "Login successful.",
                    user: req.session.user
                });
            });
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed. Check the server terminal."
        });
    }
});

// ==============================
// GET SAVED TRIPS
// ==============================

app.get("/api/trips", async (req, res) => {
    // Step 1: Check whether the user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    try {
        // Step 2: Get trips belonging to the logged-in user
        const [trips] = await db.execute(
            `SELECT
                t.trip_id,
                t.user_id,
                t.destination_id,
                t.trip_name,
                t.start_date,
                t.end_date,
                t.travellers,
                t.budget,
                t.status,
                t.created_at,
                d.name AS destination_name,
                d.country
            FROM trips AS t
            LEFT JOIN destinations AS d
                ON t.destination_id = d.destination_id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC`,
            [req.session.user.id]
        );

        // Step 3: Return the trips
        return res.status(200).json({
            success: true,
            trips: trips
        });

    } catch (error) {
        // Show the real error in the VS Code terminal
        console.error("GET /api/trips failed:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load trips.",
            error: error.message
        });
    }
});

// ==============================
// SAVE A TRIP
// ==============================

app.post("/api/trips", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    const {
        destination_id,
        trip_name,
        start_date,
        end_date,
        travellers,
        budget
    } = req.body || {};

    const cleanName =
        typeof trip_name === "string" ? trip_name.trim() : "";

    const destinationId = Number(destination_id);
    const numberOfTravellers = Number(travellers);
    const tripBudget = Number(budget);

    if (
        !cleanName ||
        cleanName.length > 150 ||
        !Number.isInteger(destinationId) ||
        destinationId < 1 ||
        !Number.isInteger(numberOfTravellers) ||
        numberOfTravellers < 1 ||
        numberOfTravellers > 100 ||
        !Number.isFinite(tripBudget) ||
        tripBudget < 0 ||
        tripBudget > 9999999999.99
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid trip details."
        });
    }

    if (
        typeof start_date !== "string" ||
        typeof end_date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(start_date) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(end_date) ||
        start_date > end_date
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid travel dates."
        });
    }

    try {
        const start = new Date(start_date + "T00:00:00Z");
        const end = new Date(end_date + "T00:00:00Z");
        const days = Math.floor((end - start) / 86400000) + 1;

        const [destinations] = await db.execute(
            `SELECT destination_id
             FROM destinations
             WHERE destination_id = ?
             LIMIT 1`,
            [destinationId]
        );

        if (destinations.length === 0) {
            return res.status(400).json({
                success: false,
                message: "The selected destination does not exist."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO trips
                (user_id, destination_id, trip_name, start_date,
                 end_date, travellers, budget, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'planned')`,
            [
                req.session.user.id,
                destinationId,
                cleanName,
                start_date,
                end_date,
                numberOfTravellers,
                tripBudget
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Trip saved successfully.",
            trip_id: result.insertId,
            days: days
        });
    } catch (error) {
        console.error("Save trip error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save trip. Check the server terminal.",
            error: error.message
        });
    }
});

// ==============================
// DELETE A SAVED TRIP
// ==============================

app.delete("/api/trips/:id", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    const tripId = Number(req.params.id);

    if (!Number.isInteger(tripId) || tripId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid trip ID."
        });
    }

    try {
        const [result] = await db.execute(
            `DELETE FROM trips
             WHERE trip_id = ? AND user_id = ?`,
            [tripId, req.session.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        return res.json({
            success: true,
            message: "Trip deleted successfully."
        });
    } catch (error) {
        console.error("Delete trip error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete trip.",
            error: error.message
        });
    }
});

// ==============================
// CURRENT LOGGED-IN USER
// ==============================

app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });
    }

    return res.json({
        success: true,
        user: req.session.user
    });
});

// ==============================
// LOGOUT
// ==============================

app.post("/api/auth/logout", (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie("connect.sid");

        return res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

// ==============================
// API NOT FOUND
// ==============================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({
        success: false,
        message: "Unexpected server error."
    });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`GlobeTrotter running at http://localhost:${PORT}`);
});