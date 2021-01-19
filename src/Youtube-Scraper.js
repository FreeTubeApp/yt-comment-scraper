const HttpRequester = require("./HttpRequester")
const htmlParser = require('./htmlParser')

class CommentScraper {
    static async getComments(payload) {
      if (typeof payload.videoId === 'undefined') {
        return Promise.reject('No video Id given')
      }

      let setCookie = true

      if (typeof (payload.setCookie) !== 'undefined') {
        setCookie = payload.setCookie
      }

      let xsrf
      let sort = 'newest'
      const requester = new HttpRequester(false, true)

      if (typeof payload.xsrf === 'undefined') {
        xsrf = await requester.getXsrfToken(payload.videoId, setCookie)
      } else {
        xsrf = payload.xsrf
      }

      if (payload.sort !== 'undefined') {
        sort = payload.sort
      }

      const commentsPayload = {
        videoId: payload.videoId,
        session_token: xsrf,
        order_by_time: payload.sortByNewest,
        filter: payload.videoId,
        order_menu: payload.continuation ? false : true,
        page_token: payload.continuation ? payload.continuation : undefined
      }

      const commentPageResponse = await requester.requestCommentsPage(commentsPayload, true)
      let continuation = commentPageResponse.data.page_token
      const commentHtml = commentPageResponse.data.html_content
      const commentData = htmlParser.parseHtmlData(commentHtml)

      if (continuation === '') {
        continuation = null
      }

      return {
        comments: commentData,
        continuation: continuation,
        xsrf: xsrf
      }
    }

    static async getAllComments(videoId, sortByNewest=false, setAgent=true) {
      if (typeof videoId === 'undefined') {
        return Promise.reject('No video Id given')
      }

      this.continueGrabbingComments = true

      let comments = []

      let payload = {
        videoId: videoId,
        setAgent: setAgent,
        sortByNewest: sortByNewest
      }

      let commentResponse = await this.getComments(payload)
      comments = comments.concat(commentResponse.comments)

      while (commentResponse.continuation !== null && this.continueGrabbingComments) {
        payload.xsrf = commentResponse.xsrf
        payload.continuation = commentResponse.continuation
        commentResponse = await this.getComments(payload)
        comments = comments.concat(commentResponse.comments)
      }

      if (!this.continueGrabbingComments) {
        return Promise.reject('Process ended early')
      }

      return {
        comments: comments,
        xsrf: null,
        continuation: null
      }
    }

    static stopGetAllComments() {
      this.continueGrabbingComments = false
    }
}

module.exports = CommentScraper
