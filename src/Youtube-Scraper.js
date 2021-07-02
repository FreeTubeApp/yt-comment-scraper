const HttpRequester = require("./HttpRequester")
const htmlParser = require('./htmlParser')

class CommentScraper {
    static async getComments(payload) {
      if (typeof payload.videoId === 'undefined') {
        return Promise.reject('No video Id given')
      }

      let xsrf
      let continuationToken
      const sortBy = payload.sortByNewest ? 'new' : 'top'
      const requester = new HttpRequester((payload.setCookie === true), payload.httpsAgent)

      if (payload.continuation) {
        if (typeof payload.xsrf !== 'undefined') {
          xsrf = payload.xsrf
        } else {
          const tokens = await requester.getVideoTokens(payload.videoId, sortBy)
          xsrf = tokens.xsrf
        }
        continuationToken = payload.continuation
      } else {
        const tokens = await requester.getVideoTokens(payload.videoId, sortBy, (payload.setCookie === true))
        xsrf = tokens.xsrf
        continuationToken = tokens.continuation
      }

      const commentsPayload = {
        session_token: xsrf,
        page_token: continuationToken,
        useReplyEndpoint: false
      }

      const commentPageResponse = await requester.requestCommentsPage(commentsPayload)
      let commentHtml = ''
      let continuation = ''
      let commentData = []
      if ('response' in commentPageResponse.data) {
        commentPageResponse.data.response.continuationContents.itemSectionContinuation
        continuation = commentHtml.continuations
        commentData = (typeof commentHtml?.contents !== 'undefined') ? htmlParser.parseCommentData(commentHtml.contents) : []
      }

      let ctoken = null

      if (typeof continuation !== 'undefined') {
        ctoken = continuation[0].nextContinuationData.continuation
      }

      return {
        comments: commentData,
        continuation: ctoken
      }
    }

    static async getCommentReplies({videoId, replyToken, setCookie, httpsAgent}) {
      if (typeof videoId === 'undefined') {
        return Promise.reject('No video Id given')
      }

      const requester = new HttpRequester((setCookie === true), httpsAgent)

      const tokens = await requester.getVideoTokens(videoId, 'top')
      const xsrf = tokens.xsrf

      const commentsPayload = {
        session_token: xsrf,
        page_token: replyToken,
        useReplyEndpoint: true
      }

      const commentPageResponse = await requester.requestCommentsPage(commentsPayload)
      const commentHtml = commentPageResponse.data[1].response.continuationContents.commentRepliesContinuation
      const commentData = htmlParser.parseCommentData(commentHtml.contents)
      const continuations = commentHtml.continuations

      let ctoken = null

      if (typeof continuations !== 'undefined') {
        ctoken = continuations[0].nextContinuationData.continuation
      }

      return {
        comments: commentData,
        continuation: ctoken
      }
    }
}

module.exports = CommentScraper
