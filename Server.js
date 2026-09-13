const http = require("http");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

const server = http.createServer((req, res) => {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Browser preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // AI endpoint
    if (req.method === "POST" && req.url === "/ask") {

        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", async () => {

            try {

                const data = JSON.parse(body);
                const question = data.question;

                if (!question || question.trim() === "") {

                    res.writeHead(400, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        error: "Question is required"
                    }));

                    return;
                }

                if (!API_KEY) {

                    res.writeHead(500, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        error: "OPENAI_API_KEY is missing in Render."
                    }));

                    return;
                }

                // Connect to OpenAI Internet API
                const response = await fetch(
                    "https://api.openai.com/v1/responses",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + API_KEY
                        },

                        body: JSON.stringify({
                            model: "gpt-5.6-luna",
                            input: question
                        })
                    }
                );

                const result = await response.json();

                // OpenAI API error
                if (!response.ok) {

                    res.writeHead(response.status, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        error: result.error?.message ||
                               "OpenAI API request failed."
                    }));

                    return;
                }

                // Get AI answer
                let answer = result.output_text;

                // Backup extraction
                if (!answer && result.output) {

                    answer = result.output
                        .flatMap(item => item.content || [])
                        .filter(item => item.type === "output_text")
                        .map(item => item.text || "")
                        .join("");
                }

                if (!answer) {
                    answer = "AI did not return an answer.";
                }

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    answer: answer
                }));

            } catch (error) {

                res.writeHead(500, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    error: error.message
                }));
            }
        });

        return;
    }

    // Other URLs
    res.writeHead(404, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
        error: "Not found"
    }));
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(
        "Akash AI backend running on port " + PORT
    );
});
