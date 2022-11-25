const Database = require('./db_stuff/Database');

var db = new Database("mongodb://localhost:27017", "SocialSignDB");

async function main() {
    let resp = await db.getPublicKey('twitterid13');
    console.log(resp);
}

main();
