require("dotenv").config();
const Twit = require("twit");
const fs = require("fs");
const readline = require("readline");
const fsPromises = fs.promises;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const RATE_LIMIT_DELAY = 15 * 60 * 1000; // 15 minutes

// Parse arguments
const argv = require("yargs/yargs")(process.argv.slice(2))
  .usage("Usage: $0 -d [date]")
  .nargs("d", 1)
  .describe("d", "Delete all tweets before this date (format: YYYY-MM-DD)")
  .demandOption(["d"])
  .help("h")
  .alias("h", "help").argv;

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const handle = process.env.TWITTER_USERNAME;
const cutoffDate = new Date(argv.d).getTime();
const suppress404 = process.env.SUPPRESS_404 === "true";

async function deleteOldTweets() {
  console.log("Reading tweets.js file...");
  const tweetFile = await fsPromises.readFile("./tweets.js", "utf8");
  const tweets = JSON.parse(
    tweetFile.replace(/window\.YTD\.tweets\.part0 = /g, "")
  );

  console.log(`Loaded ${tweets.length} tweets from tweets.js`);

  let deletedTweets = [];
  if (fs.existsSync("./deleted.js")) {
    let deletedFile = await fsPromises.readFile("./deleted.js", "utf8");
    deletedTweets = JSON.parse(deletedFile);
    console.log(
      `Loaded ${deletedTweets.length} already deleted tweets from deleted.js`
    );
  }

  const tweetsToDelete = tweets.filter((tweet) => {
    const created_at = new Date(tweet.tweet.created_at).getTime();
    const tweetUrl = `https://twitter.com/${handle}/status/${tweet.tweet.id_str}`;
    return created_at < cutoffDate && !deletedTweets.includes(tweetUrl);
  });

  const tweetsExcluded = tweets.filter((tweet) => {
    const created_at = new Date(tweet.tweet.created_at).getTime();
    return created_at >= cutoffDate;
  });

  console.log(`Found ${tweetsToDelete.length} tweets to delete`);
  console.log(`Excluded ${tweetsExcluded.length} recent tweets`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Press any key to start deleting. Ctrl+C to cancel.",
    async (answer) => {
      rl.close();

      for (const tweet of tweetsToDelete) {
        const tweetUrl = `https://twitter.com/${handle}/status/${tweet.tweet.id_str}`;
        try {
          await T.post("statuses/destroy/:id", { id: tweet.tweet.id_str });
          console.log(`Deleted tweet: ${tweetUrl}`);
        } catch (e) {
          if (e && (e.code === 144 || e.code === 403 || e.code === 34)) {
            // Tweet does not exist, is forbidden, or the page does not exist, add to deletedTweets.
            if (!suppress404) {
              console.log("Tweet could not be accessed, skipping...");
            }
            deletedTweets.push(tweetUrl);
          } else if (e && e.code === 88) {
            // WAIT_TIME if rate limit exceeded.
            console.log("Rate limit exceeded. Waiting 15 minutes...");
            await delay(RATE_LIMIT_DELAY);
          } else {
            console.error(`Failed to delete tweet: ${tweetUrl}. Error:`, e);
          }
        }
        await fsPromises.writeFile(
          "./deleted.js",
          JSON.stringify(deletedTweets),
          "utf8"
        );
      }
      console.log("Finished deleting tweets.");
    }
  );
}

deleteOldTweets();
