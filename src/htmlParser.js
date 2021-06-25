const parser = require('node-html-parser')

class HtmlParser {

  static parseCommentData(data) {
    const comments = []

    data.forEach((node) => {
      const comment = node.commentThreadRenderer ? node.commentThreadRenderer.comment.commentRenderer : node.commentRenderer
      let replies = null
      let text = ''
      let isHearted = false

      const commentId = comment.commentId
      const authorId = comment.authorEndpoint.browseEndpoint.browseId
      const authorName = comment.authorText.simpleText
      const authorThumbnails = comment.authorThumbnail.thumbnails
      const likes = ('voteCount' in comment) ? comment.voteCount.simpleText.split(' ')[0] : '0'
      const numReplies = comment.replyCount ? comment.replyCount : 0
      const publishedTimeText = comment.publishedTimeText.runs[0].text
      const publishedText = publishedTimeText.replace('(edited)', '').trim()
      const isEdited = publishedTimeText.includes('edited')

      const heartBadge = comment.actionButtons.commentActionButtonsRenderer.creatorHeart
      const isOwner = comment.authorIsChannelOwner
      const isPinned = comment.pinnedCommentBadge ? true : false
      const isVerified = ('authorCommentBadge' in comment && comment.authorCommentBadge.authorCommentBadgeRenderer.icon.iconType === "CHECK_CIRCLE_THICK")
      const isOfficialArtist = ('authorCommentBadge' in comment && comment.authorCommentBadge.authorCommentBadgeRenderer.icon.iconType === "OFFICIAL_ARTIST_BADGE")


      if (typeof heartBadge !== 'undefined') {
        isHearted = heartBadge.creatorHeartRenderer.isHearted
      }

      const contentText = comment.contentText.runs

      contentText.forEach((content) => {
        if (content.text.trim() === '') {
          text = text + '<br>'
        } else {
          text = text + content.text
        }
      })

      const object = {
        authorThumb: authorThumbnails,
        author: authorName,
        authorId: authorId,
        commentId: commentId,
        text: text,
        likes: likes,
        numReplies: numReplies,
        isOwner: isOwner,
        isHearted: isHearted,
        isPinned: isPinned,
        hasOwnerReplied: false,
        time: publishedText,
        edited: isEdited,
        replyToken: null,
        isVerified: isVerified,
        isOfficialArtist: isOfficialArtist
      }

      if (comment.replyCount > 0) {
        const replyNode = node.commentThreadRenderer.replies.commentRepliesRenderer
        const continuation = replyNode.continuations[0].nextContinuationData.continuation
        object.replyToken = continuation
        const replyArrayLength = replyNode.viewReplies.buttonRenderer.text.runs.length
        //lengths of: 1 = reply (not from owner), 2 = reply (from owner), 3 = replies (not from owner), 5 = replies (from owmer)
        if (replyArrayLength == 5 || replyArrayLength == 2){
          object.hasOwnerReplied = true;
        }
      }

      comments.push(object)
    })

    return comments
  }
  static parseShortedNumberString(string) {
    const numberMultiplier = string.charAt(string.length-1).toLowerCase()
    switch (numberMultiplier){
      case 'k':
        return Number(string.substring(0, string.length-1) * 1000)
      case 'm':
        return Number(string.substring(0, string.length-1) * 1000000)
    }
  }
}

module.exports = HtmlParser
