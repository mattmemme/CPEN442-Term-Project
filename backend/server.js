require('dotenv').config()
const express = require('express');
const Database = require("./db_stuff/Database.js");
const { TwitterApi } = require('twitter-api-v2');

const host = 'localhost';
const port = 3000;

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

let app = express();

app.use(logRequest);							// logging for debug
app.use(express.json()) 						// to parse application/json

app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}.`);
});

app.get("/public_key/:handle", async (req,res) => {
    // Ask Twitter API for ID
    let twitterID;
    try {
        let twitterUser = await appOnlyClient.v2.userByUsername(req.params.handle);
        console.log(twitterUser);
        twitterID = twitterUser.data.id;
    } catch (e) {
        console.log(e)
        res.status(500).send("Error querying Twitter API");
        return;
    }
    
    try {  
        let publicKey = await db.getPublicKey(twitterID);
        res.send(publicKey);
        return;
    } catch (e) {
        console.log(e);
        res.status(404).send(`User was not found`);
        return;
    }
    


})

let db = Database("mongodb://localhost:27017", "SocialSignDB");
const appOnlyClient = new TwitterApi(process.env.BEARER_TOKEN);



