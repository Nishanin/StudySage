const http = require("http");

const app = require("./app");
const { AsrService } = require("./live-lecture/services/asrService");
const {
  createLiveLectureSocketServer,
} = require("./live-lecture/sockets/liveLectureSocketServer");

const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const asrService = new AsrService();
createLiveLectureSocketServer(server, { asrService });

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
