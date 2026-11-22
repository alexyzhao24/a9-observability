const express = require("express");
const { MongoClient } = require("mongodb");
const { metrics } = require("@opentelemetry/api");
const app = express();
app.use(express.json());
const port = 3000;
let db;
const meter = metrics.getMeter("todo-service");
const requestCounter = meter.createCounter("todo_requests_total", {
    description: "Total number of HTTP requests"
});
const requestDuration = meter.createHistogram("todo_request_duration", {
    description: "HTTP request duration",
    unit: "ms"
});

app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;

        requestCounter.add(1, {
            method: req.method,
            status: res.statusCode
        });

        requestDuration.record(duration, {
            method: req.method,
            status: res.statusCode
        });

        console.log(
            `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
        );
    });

    next();
});

app.get("/todo", async (req, res) => {
    try {
        const todos = await db.collection("todos").find({}).toArray();
        res.json(todos);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/todo/:id", async (req, res) => {
    try {
        const todo = await db.collection("todos").findOne({
            id: req.params.id
        });

        if (!todo) {
            return res.status(404).json({ error: "Todo not found" });
        }

        res.json(todo);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

async function startServer() {
    const client = await MongoClient.connect(
        "mongodb://localhost:27017/"
    );

    db = client.db("todo");

    const sampleTodos = [
        { id: "1", title: "Buy groceries" },
        { id: "2", title: "Install Aspecto" },
        { id: "3", title: "Buy my own name domain" }
    ];

    for (const todo of sampleTodos) {
        await db.collection("todos").updateOne(
            { id: todo.id },
            { $setOnInsert: todo },
            { upsert: true }
        );
    }

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer().catch(error => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
});