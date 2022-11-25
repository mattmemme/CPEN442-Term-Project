require('dotenv').config();
const CONFIG = process.env;
const express = require('express');
const Database = require("./db_stuff/Database.js");
const { TwitterApi } = require('twitter-api-v2');

var fs = require('fs');
var https = require('https');
var crypto = require("crypto");
var session = require('express-session')
let ejs = require('ejs'); // Templating engine


const port = 3000;

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

let app = express();

app.use(logRequest);							// logging for debug
app.use(express.json()) 						// to parse application/json
app.set('view engine', 'ejs');                  // for templating

// Configure session - needed to store secret token between requests
app.use(session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  }));



var options = {
    cert: fs.readFileSync('certs/client-cert.pem'),
    key: fs.readFileSync('certs/client-key.pem')
  };

https.createServer(options, app).listen(port)


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
        res.json({public_key: publicKey});
        return;
    } catch (e) {
        console.log(e);
        res.status(404).send(`User was not found`);
        return;
    }
})

app.get('/', async(req, res) => {
    const link = await requestClient.generateAuthLink(`https://${CONFIG.DOMAIN}:${CONFIG.PORT}/callback`);
    // Save token secret to use it after callback
    req.session.oauthToken = link.oauth_token;
    req.session.oauthSecret = link.oauth_token_secret;

    res.render('index', { authLink: link.url});
})

app.get('/callback', async(req, res) => {
      // Invalid request
  if (!req.query.oauth_token || !req.query.oauth_verifier) {
    res.status(400).render('error', { error: 'Bad request, or you denied application access. Please renew your request.' });
    return;
  }

  const token = req.query.oauth_token;
  const verifier = req.query.oauth_verifier;
  const savedToken = req.session.oauthToken;
  const savedSecret = req.session.oauthSecret;

  if (!savedToken || !savedSecret || savedToken !== token) {
    res.status(400).render('error', { error: 'OAuth token is not known or invalid. Your request may have expire. Please renew the auth process.' });
    return;
  }

  const tempClient = new TwitterApi({ appKey: CONFIG.API_KEY, appSecret: CONFIG.API_SECRET, accessToken: token, accessSecret: savedSecret });
  const { accessToken, accessSecret, screenName, userId } = await tempClient.login(verifier);
  // Set userID ie. authenticate user.
  req.session.userId = userId;
  res.render('callback', { accessToken, accessSecret, screenName, userId });
});

app.post("/publish_key", async(req,res) => {

    if(!req.session.userId){
        res.status(401).send("Not logged in");
        return;
    }
    
    const key = req.body.pubKey; 
    
    let recoveryCodes = generateRecoveryCodes(5);
    let hashedCodes = hashCodes(recoveryCodes);

    const document = {twitterId: req.session.userId, publicKey: key, recoveryCodes: hashedCodes};
    console.log(document);
    try {
        let result = await db.storePublicKey(document);
        if(!result){
            res.status(409).send("Public key already exists. Use recovery code to change public key");
            return;
        }
        res.json({recovery_codes: recoveryCodes})
    } catch (e) {
        console.log(e);
        res.status(500).end();
    }
})

app.post("/reset_key", async(req,res) => {
    
    if(!req.session.userId){
        res.status(401).send("Not logged in");
        return;
    }
    
    const key = req.body.newPubKey;
    const recoveryCode = req.body.recoveryCode; 
    
    
    let hashedCodes = await db.getRecoveryCodes(req.session.userId);

    // verifyRecoveryCode will mutate hashedCodes and removes the correct recovery code.
    let verified = verifyRecoveryCode(recoveryCode, hashedCodes);

    if(!verified){
        res.status(401).send("Invalid recovery code");
        return;
    }

    try{
        let result = await db.updatePublicKey(req.session.userId, key, hashedCodes);
        res.json(result);
    } catch(e) {
        console.log(e);
        res.status(500).end();
    }

})

let db = Database("mongodb://localhost:27017", "SocialSignDB");

function generateRecoveryCodes(amount){
    var codes = []
    for(let i = 0; i < amount; i++){
        codes.push(crypto.randomBytes(4).toString('hex'));
    }
    return codes;
}

function hashCodes(codes){
    var hashedCodes = [];
    for(let i = 0; i < codes.length; i++){
        hashedCodes.push(crypto.createHash('sha256').update(codes[i]).digest());
    }
    return hashedCodes;
}

function verifyRecoveryCode(recoveryCode, hashedCodes){
    let hash = crypto.createHash('sha256').update(recoveryCode).digest();
    for (let i = 0; i < hashedCodes.length; i++){
        if (hash.equals(hashedCodes[i].buffer)){
            hashedCodes.splice(i,1);
            return true;
        }
    }
    return false;
}

app.get('/oauth', async(req, res) => {
    const link = await requestClient.generateAuthLink(`https://${CONFIG.DOMAIN}:${CONFIG.PORT}/callback`);
    // Save token secret to use it after callback
    req.session.oauthToken = link.oauth_token;
    req.session.oauthSecret = link.oauth_token_secret;

    res.json({url: link.url})
})

const requestClient = new TwitterApi({appKey: CONFIG.API_KEY, appSecret: CONFIG.API_SECRET});
const appOnlyClient = new TwitterApi(CONFIG.BEARER_TOKEN);




