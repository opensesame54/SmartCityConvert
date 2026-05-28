require("dotenv").config();

const http = require("http");
const { app } = require("./app");
const { connectDb } = require("./config/db");
const { initSocket } = require("./socket");
const { startEscalationWorker } = require("./jobs/escalationQueue");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDb(process.env.MONGO_URI)
  .then(async () => {
    await initSocket(server);
    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
    startEscalationWorker();
  })
  .catch((error) => {
    console.error("Startup error:", error);
    process.exit(1);
  });
