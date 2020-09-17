const scraper = require('./src/Youtube-Scraper')
async function f() {
    const data = await scraper.scrape_trending_page('s2ES5tggQlU')
}
f()
