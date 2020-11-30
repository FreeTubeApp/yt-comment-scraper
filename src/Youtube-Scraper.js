const HttpRequester = require("./HttpRequester")
//const fs = require('fs')
const  html2json = require('html2json');

class CommentScraper {

    constructor(setCookie = true, sortNewest = false) {
      this.XSRF_TOKEN = null
      this.PAGE_TOKEN = 'FillToken'
      this.FIRST_PAGE = true
      this.requester = new HttpRequester(setCookie, sortNewest)
    }
    //starting point
    async scrape_all_youtube_comments(videoId) {
        const request_data = await this.requester.requestVideoPage(videoId);
        const data = await this.parse_html(request_data.data, videoId);
        this.requester.deleteSession()
        return data
    }
    async scrape_next_page_youtube_comments(videoId) {
        let request_data = {
            data: null
        }
        if (this.FIRST_PAGE) {
            request_data = await this.requester.requestVideoPage(videoId);
            this.FIRST_PAGE = false
        }
        const data = await this.parse_next_html(request_data.data, videoId);
        return data
    }

    async parse_next_html(html_data=null, videoId) {
        let pre_token = null
        //first iteration doesnt have a page token
        let first_iteration = false
        if (html_data !== null){
            pre_token = html_data.match(/"XSRF_TOKEN":"[^"]*"/)[0]
            first_iteration = true
            // token embedded in page, needed for ajax request
            this.XSRF_TOKEN = pre_token.substring(14, pre_token.length-1)
            this.XSRF_TOKEN = this.XSRF_TOKEN.replace(/\\u003d/g, "=")

        }
        let comments = []
        const data = {
             video_id: videoId,
            session_token: this.XSRF_TOKEN
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
            if (this.PAGE_TOKEN === "") {
                return null
            }
            data.page_token = this.PAGE_TOKEN
        }
        const ajaxResponse = await this.requester.ajax_request(data, params)
        if (ajaxResponse === undefined) {
            return
        }
        this.PAGE_TOKEN = ajaxResponse.data.page_token
        const ajaxHtml = ajaxResponse.data.html_content
        comments = comments.concat(this.extractCommentHtmlEntries(ajaxHtml))
        return comments
    }

    //extract the required data from the initial page and then all successive pages
    async parse_html(html_data, videoId) {

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
            const ajaxResponse = await this.requester.ajax_request(data, params)
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

    extractCommentIds(html_data) {
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

    extractCommentHtmlEntries(html_data) {
        const jsondata = html2json.html2json(html_data)
        const comments = []
        for(let i = 1; i < jsondata.child.length; i+=2) {
            try {
                const commentEntry = jsondata.child[i]
                const comment = {
                    id: commentEntry.child[1].attr["data-cid"],
                    authorThumb: commentEntry.child[1].child[1].child[1].attr.src,
                    author: commentEntry.child[1].child[3].child[1].child[1].child[0].text,
                    authorLink: commentEntry.child[1].child[3].child[1].child[1].attr.href,
                    text: this.buildText(commentEntry.child[1].child[3].child[3].child[1].child),
                    likes: 0,
                    isHearted: commentEntry.child[1].child[3].child[5].child[1].child.find(c => c.tag === 'table').child[1].child[5].child[1].attr.hasOwnProperty('data-action-on'),
                    replies: this.extractCommentRepliesFromJSON(commentEntry)
                }
                if (commentEntry.child[1].child[3].child[5].child[1].child[5].attr.class[1] === 'off') {
                    comment.likes = commentEntry.child[1].child[3].child[5].child[1].child[5].child[0].text
                }
                const maxLength = commentEntry.child[1].child[3].child[1].child.length
                for (let j = 3; j < maxLength; j++) {
                    if (commentEntry.child[1].child[3].child[1].child[j].node === "element" && commentEntry.child[1].child[3].child[1].child[j].tag === "a") {
                        comment.time = this.extractTimeStringFromWhiteSpace(commentEntry.child[1].child[3].child[1].child[j].child[0].text)
                        comment.edited = commentEntry.child[1].child[3].child[1].child[j].child[0].text.includes('edited');
                    }
                }
                comment.numReplies = comment.replies.length
                comment.hasReplies = (comment.numReplies > 0)
                comments.push(comment)
            } catch (error) {
                console.error(error)
                continue
            }

        }
        return comments
    }

    buildText(textArray) {
        let wholeComment = ""
        for (let i = 0; i < textArray.length; i++) {
            if (textArray[i].node === "text") {
                //normal text
                wholeComment += textArray[i].text
            } else if (textArray[i].node === "element") {
                if (textArray[i].tag === "a") {
                    // links
                    wholeComment += textArray[i].child[0].text
                } else if (['b', 'i', 's'].includes(textArray[i].tag)) {
                    // emphasis tags
                    wholeComment += this.extractTextFromEmphasisTags(textArray[i])
                }
            }
        }
        return wholeComment
    }

    extractTextFromEmphasisTags(textElement) {
        let result = {...textElement};
        if (result.tag === "b") {
            result = result.child[0];
        }

        if (result.tag === "i") {
            result = result.child[0];
        }

        if (result.tag === "s") {
            result = result.child[0].child[0];
        }

        return result.text;
    }

    extractCommentRepliesFromJSON(parentComment) {
        const replies = []
        if (!(parentComment.child[3].child.length > 1)){
            return []
        }
        for(let i = 1; i < parentComment.child[3].child.length; i+=2){
            try {
                const commentEntry = parentComment.child[3].child[i]
                const comment = {
                    authorLink: commentEntry.child[1].attr.href,
                    authorThumb: commentEntry.child[1].child[1].attr.src,
                    author: commentEntry.child[3].child[1].child[1].child[0].text,
                    text: this.buildText(commentEntry.child[3].child[3].child[1].child),
                    id: commentEntry.attr["data-cid"]
                }
                const maxLength = commentEntry.child[3].child[1].child
                for (let j = 2; j < maxLength; j++) {
                    if (commentEntry.child[3].child[1].child[j].node === "element" && commentEntry.child[3].child[1].child[j].tag === "a") {
                        comment.time = this.extractTimeStringFromWhiteSpace(commentEntry.child[3].child[1].child[j].child[0].text)
                        if (commentEntry.child[3].child[1].child[j].child[0].text.includes('edited')) {
                            comment.edited = true
                        }
                    }
                }
                replies.push(comment)
            } catch (error) {
                console.error(error)
                continue
            }
        }
        return replies
    }

    extractTimeStringFromWhiteSpace(originalString){
        let string = ""
        if (originalString.includes("hour")){
            string = originalString.match(/\d+/)[0] + " hour"
            if (string !== "1") {
                string += "s"
            }
        }else if(originalString.includes("second")){
            string = originalString.match(/\d+/)[0] + " second"
            if (string !== "1") {
                string += "s"
            }
        }else if(originalString.includes("minute")) {
            string = originalString.match(/\d+/)[0] + " minute"
            if (string !== "1") {
                string += "s"
            }
        }else if(originalString.includes("day")){
            string = originalString.match(/\d+/)[0] + " day"
            if (string !== "1") {
                string += "s"
            }
        }else if(originalString.includes("month")) {
            string = originalString.match(/\d+/)[0] + " month"
            if (string !== "1") {
                string += "s"
            }
        }else if(originalString.includes("year")){
            string = originalString.match(/\d+/)[0] + " year"
            if (string !== "1") {
               string += "s"
            }
        }
        return string
    }
    cleanupStatics(){
        this.PAGE_TOKEN = "FillToken"
        this.FIRST_PAGE = true
        this.XSRF_TOKEN = null
        this.requester.deleteSession()
    }
}

module.exports = CommentScraper
