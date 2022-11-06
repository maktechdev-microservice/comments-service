import express from "express";
import bodyParser from "body-parser";
import { randomBytes } from "crypto";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(bodyParser.json());
app.use(cors());
const port = 4001;
const route = "/posts/:id/comments";

const commentsByPostId = {};

const updateComment = async ({ id, status, postId, content }) => {
  const comment = commentsByPostId[postId].find((c) => c.id === id);
  comment.status = status;
  await axios
    .post("http://events-clusterip-srv:4005/events", {
      type: "CommentUpdated",
      data: {
        id,
        content,
        postId,
        status,
      },
    })
    .catch((err) => {
      console.log(`comment reports: ${err}`);
    });
};

app.get(route, (req, res) => {
  const comments = commentsByPostId[req.params.id] || [];
  res.send(comments);
});

app.post(route, async (req, res) => {
  const { content } = req.body;
  const id = randomBytes(4).toString("hex");
  const newComment = { id, content, status: "pending" };
  const comments = commentsByPostId[req.params.id] || [];
  comments.push(newComment);
  commentsByPostId[req.params.id] = comments;
  await axios
    .post("http://events-clusterip-srv:4005/events", {
      type: "CommentCreated",
      data: {
        id,
        content,
        postId: req.params.id,
        status: "pending",
      },
    })
    .catch((err) => {
      console.log(`comment reports: ${err}`);
    });
  res.status(201).send(newComment);
});

app.post("/events", async (req, res) => {
  console.log(`Comments service received "${req.body.type}" event`);
  const { type, data } = req.body;

  if (type === "CommentModerated") {
    updateComment(data);
  }

  res.send("OK from comments");
});

app.listen(port, console.log(`Comments server listening on ${port}`));
