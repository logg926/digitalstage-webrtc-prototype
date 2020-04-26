import * as express from "express";
import * as socketIo from "socket.io";
import {Socket} from "socket.io";
import * as cors from "cors";
import * as https from "https";
import * as fs from "fs";
import * as timesyncServer from "timesync/server";

const port = process.env.PORT || 3010;
const index = require("./routes/index");

const app = express();
app.use(cors({origin: true}));
app.use(index);
app.use('/timesync', timesyncServer.requestHandler);
app.options('*', cors());

const server = https.createServer({
    key: fs.readFileSync("/etc/letsencrypt/live/www.thepanicure.de/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/www.thepanicure.de/fullchain.pem"),
    requestCert: false,
    rejectUnauthorized: false
}, app);

const io = socketIo(server,);
io.origins('*:*');

let curentSocketIds: string[] = [];
const handleClient = (socket: Socket) => {
    console.log("New connection from " + socket.id);
    curentSocketIds.push(socket.id);

    socket.broadcast.emit('add-users', {
        users: [socket.id]
    });

    socket.on('connect', () => {
        io.emit('add-users', socket.id);
    });

    socket.on('disconnect', () => {
        curentSocketIds.splice(curentSocketIds.indexOf(socket.id), 1);
        io.emit('remove-user', socket.id);
    });

    socket.on('make-offer', (data) => {
        socket.to(data.to).emit('offer-made', {
            offer: data.offer,
            socket: socket.id
        });
    });

    socket.on('make-answer', (data) => {
        socket.to(data.to).emit('answer-made', {
            socket: socket.id,
            answer: data.answer
        });
    });

    socket.on('send-candidate', (data) => {
        socket.to(data.to).emit('candidate-sent', {
            socket: socket.id,
            candidate: data.candidate
        });
    });
};

io.on("connection", handleClient);

server.listen(port);
console.log("Running on port " + port);
