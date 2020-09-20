//module.exports = require("./src/Youtube-Scraper")
const ytcomments = require("./src/Youtube-Scraper")

async function f(){
    const data = await ytcomments.scrape_youtube_comments('srKTVfQt8zA')
}
f()
