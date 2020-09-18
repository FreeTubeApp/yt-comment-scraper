const requester = require("./TrendingRequester")
const fs = require('fs')
const utils = require('util')
const  html2json = require('html2json');
class YoutubeScraper {

    //starting point
    static async scrape_trending_page(videoId) {
        const request_data = await requester.requestVideoPage(videoId);
        return await this.parse_html(request_data.data, videoId);
    }

    //extract the required JSON object from the HTML data
    static async parse_html(html_data, videoId) {
        fs.writeFileSync('./test.html', html_data)

        const pre_token = html_data.match(/"XSRF_TOKEN":"[^"]*"/)[0]
        const XSRF_TOKEN = pre_token.substr(14, pre_token.length - 15)
        let comments = []
        let first_iteration = true
        let pageToken = "FillToken"
        while (pageToken !== "") {
            const data = {
                video_id: videoId,
                session_token: XSRF_TOKEN
            }
            const params = {
                action_load_comments: 1,
                order_by_time: true,
                filter: videoId,
                order_menu: false
            }
            if (first_iteration) {
                params.order_menu = true
            } else {
                data.page_token = pageToken
            }
            const ajaxResponse = await requester.ajax_request(data, params)
            if (ajaxResponse === undefined) {
                return
            }
            pageToken = ajaxResponse.data.page_token
            console.log("PAge Token:", pageToken)
            const ajaxHtml = ajaxResponse.data.html_content
            fs.writeFileSync('./test2.html', ajaxHtml)
            const commentIds = this.extractCommentIds(ajaxHtml)

            comments = comments.concat(this.extractCommentHtmlEntries(ajaxHtml))
            first_iteration = false
            console.log("Commentlength:", comments.length)
        }

//'tml><html  style='
        //TODO Take a look whether a regex that directly filters out the videoRenderers is possible
        //Thanks to cadence for the Regex expression
        const ytInitialData = (html_data.match(/^\s*window\["ytInitialData"\] = (\{.*\});$/m) || [])[1];

        //create a JSON object from the JSON string
        const yt_data_json = JSON.parse(ytInitialData);
    }

    static extractCommentIds(html_data) {
        const commentIdsDouble = html_data.match(/data-cid="[^"]*/g)
        const commentIdsSingle = []
        // because we have every id two times, we can delete one of each kind
        commentIdsDouble.forEach((value, index) => {
            if (index % 2 === 0) {
                commentIdsSingle.push(value.substr(10))
            }
        })
        return commentIdsSingle
    }

    static extractCommentHtmlEntries(html_data) {
        const jsondata = html2json.html2json(html_data)
        fs.writeFileSync('./test2.json', JSON.stringify(jsondata))
        const comments = []
        for(let i = 1; i < jsondata.child.length; i+=2){
            const commentEntry = jsondata.child[i]
            const comment = {
                cId: commentEntry.child[1].attr["data-cid"],
                authorPicture: commentEntry.child[1].child[1].child[1].attr.src,
                author: commentEntry.child[1].child[3].child[1].child[1].child[0].text, // fehlerhaft
                authorUrl: commentEntry.child[1].child[3].child[1].child[1].attr.href, //fehlerhaft
                commentText: commentEntry.child[1].child[3].child[3].child[1].child[0].text,
                commentLikes: commentEntry.child[1].child[3].child[5].child[1].child[5].child[0].text,
                publishString: commentEntry.child[1].child[3].child[1].child[6].child[0].text,
            }
            comments.push(comment)
            console.log(comment.author)
        }
        return comments
    }
}
module.exports = YoutubeScraper
