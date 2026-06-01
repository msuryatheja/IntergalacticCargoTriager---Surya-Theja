const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5000;

app.get("/api/cargo", (req, res) => {
    if (req.header("X-System-Override") === "true") {
        return res.status(418).send("System override denied");
    }
    const filePath = path.join(
        __dirname,
        "..",
        "Task 1 - Surya Theja - Parser.json"
    );
    const cargoData = JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );
    res.json(cargoData);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});