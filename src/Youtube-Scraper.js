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
	  let commentHtml = []
	  if(commentPageResponse.data.response.onResponseReceivedEndpoints) {
		if(typeof commentPageResponse.data.response.onResponseReceivedEndpoints[commentPageResponse.data.response.onResponseReceivedEndpoints.length - 1].reloadContinuationItemsCommand !== 'undefined') {
			commentHtml = commentPageResponse.data.response.onResponseReceivedEndpoints[commentPageResponse.data.response.onResponseReceivedEndpoints.length - 1].reloadContinuationItemsCommand.continuationItems
		}
		else {
			commentHtml = commentPageResponse.data.response.onResponseReceivedEndpoints[commentPageResponse.data.response.onResponseReceivedEndpoints.length - 1].appendContinuationItemsAction.continuationItems
		}
	  }
      const commentData = (typeof commentHtml !== 'undefined') ? htmlParser.parseCommentData(commentHtml) : []
      const continuation = (typeof commentHtml !== 'undefined' && commentHtml[commentHtml.length - 1]) ? commentHtml[commentHtml.length - 1].continuationItemRenderer : undefined
	  
      let ctoken = null

      if (typeof continuation !== 'undefined') {
        ctoken = continuation.continuationEndpoint.continuationCommand.token
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
      const commentHtml = commentPageResponse.data[1].response.onResponseReceivedEndpoints ? commentPageResponse.data[1].response.onResponseReceivedEndpoints[commentPageResponse.data[1].response.onResponseReceivedEndpoints.length - 1].appendContinuationItemsAction.continuationItems : []
      const commentData = htmlParser.parseCommentData(commentHtml)
      const continuations = (typeof commentHtml !== 'undefined') ? commentHtml[commentHtml.length - 1].continuationItemRenderer : undefined
      let ctoken = null

      if (typeof continuations !== 'undefined') {
		ctoken = continuations.button.buttonRenderer.command.continuationCommand.token
      }

      return {
        comments: commentData,
        continuation: ctoken
      }
    }
}

module.exports = CommentScraper
