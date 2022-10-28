import express from 'express'
import bodyParser from 'body-parser'
import { randomBytes } from 'crypto'
import cors from "cors";
import axios from 'axios';


const app = express();
app.use(bodyParser.json());
app.use(cors())
const port = 4001
const commentsByPostId = {}
const route = "/posts/:id/comments"

app.get(route, (req, res) => {
    const comments = commentsByPostId[req.params.id] || []
    res.send(comments);
});

app.post(route, async (req, res) => { 

    const { content } = req.body;
    const id = randomBytes(4).toString('hex');
    const newComment = { id, content }
    const comments = commentsByPostId[req.params.id] || [];
    comments.push(newComment)
    commentsByPostId[req.params.id] = comments
    await axios.post("localhost:4005/events", {
        type: "CommentCreated",
        data: {
            id,
            content,
            postId: req.params.id
        }
    }).catch(err => {
        console.log(`comment reports: ${err}`)
    })
    res.status(201).send(newComment)
})

app.post("/evemts", (req, res) => {
    console.log(`Event Received: ${req.body.type} by comments service`)
    res.send({
        status: "OK"
    })
})

app.listen(port, console.log(`Comments server listening on ${port}`))