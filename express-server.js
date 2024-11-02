import express from "express";
import connectViaMongoose from "./DB-utils/mongoose-connectio.js";
import studentsRouter from "./Routes/students.js";
import mentorsRouter from "./Routes/mentors.js";

const server = express();

server.use(express.json());

// GET Method

server.get("/", (req, res) => {
  res.json({ msg: "server connected successfully" });
});

//Connect to database
await connectViaMongoose();

//linking routes to server

server.use("/students", studentsRouter);
server.use("/mentors", mentorsRouter);
//POST Method

server.post("/", (req, res) => {
  res.status(201).json({ msg: "created post successfully " });
});

const PORT = 4500;

server.listen(PORT, () => {
  console.log("server listening on :", PORT);
});
