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
    const newComment = { id, content, status: 'pending' }
    const comments = commentsByPostId[req.params.id] || [];
    comments.push(newComment)
    commentsByPostId[req.params.id] = comments
    await axios.post("http://events-clusterip-srv:4005/events", {
        type: "CommentCreated",
        data: {
            id,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    }).catch(err => {
        console.log(`comment reports: ${err}`)
    })
    res.status(201).send(newComment)
})

app.post("/events", (req, res) => {
   console.log(`Comments service received "${req.body.type}" event`)
    res.send({
        status: "OK from comments"
    })
})

app.listen(port, console.log(`Comments server listening on ${port}`))