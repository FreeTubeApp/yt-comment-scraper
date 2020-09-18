const requester = require("./HttpRequester")
//const fs = require('fs')
const  html2json = require('html2json');

class YoutubeScraper {

    //starting point
    static async scrape_youtube_comments(videoId) {
        const request_data = await requester.requestVideoPage(videoId);
        return await this.parse_html(request_data.data, videoId);
    }

    //extract the required data from the initial page and then all successive pages
    static async parse_html(html_data, videoId) {
        fs.writeFileSync('./test.html', html_data)

        const pre_token = html_data.match(/"XSRF_TOKEN":"[^"]*"/)[0]
        // token embedded in page, needed for ajax request
        const XSRF_TOKEN = pre_token.substr(14, pre_token.length - 15)
        let comments = []
        //first iteration doesnt have a page token
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
            const ajaxHtml = ajaxResponse.data.html_content
            //const commentIds = this.extractCommentIds(ajaxHtml)
            comments = comments.concat(this.extractCommentHtmlEntries(ajaxHtml))
            first_iteration = false
        }
        return comments
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
        //fs.writeFileSync('./test2.json', JSON.stringify(jsondata))
        const comments = []
        for(let i = 1; i < jsondata.child.length; i+=2){
            const commentEntry = jsondata.child[i]
            const comment = {
                id: commentEntry.child[1].attr["data-cid"],
                authorThumb: commentEntry.child[1].child[1].child[1].attr.src,
                author: commentEntry.child[1].child[3].child[1].child[1].child[0].text,
                authorLink: commentEntry.child[1].child[3].child[1].child[1].attr.href,
                text: commentEntry.child[1].child[3].child[3].child[1].child[0].text,
                likes: commentEntry.child[1].child[3].child[5].child[1].child[5].child[0].text,
                time: commentEntry.child[1].child[3].child[1].child[6].child[0].text,
                replies: this.extractCommentRepliesFromJSON(commentEntry)
            }
            comment.numReplies = comment.replies.length
            comment.hasReplies = (comment.numReplies > 0)
            comments.push(comment)
        }
        return comments
    }

    static extractCommentRepliesFromJSON(comment) {
        const replies = []
        if (!(comment.child[3].child.length > 1)){
            return []
        }
        for(let i = 1; i < comment.child[3].child.length; i+=2){
            const commentEntry = comment.child[3].child[i]
            replies.push({
                authorLink: commentEntry.child[1].attr.href,
                authorThumb: commentEntry.child[1].child[1].attr.src,
                author: commentEntry.child[3].child[1].child[1].child[0].text,
                time: commentEntry.child[3].child[1].child[6].child[0].text,
                text: commentEntry.child[3].child[3].child[1].child[0].text,
                id: commentEntry.attr["data-cid"]
            })
        }
        return replies
    }
}
module.exports = YoutubeScraper
