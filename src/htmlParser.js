class HtmlParser {
  static parseCommentData(data) {
    const comments = []

    data.forEach((node) => {
      if ('continuationItemRenderer' in node) return
      const comment = node.commentThreadRenderer ? node.commentThreadRenderer.comment.commentRenderer : node.commentRenderer
      let text = ''

      const commentId = comment.commentId
      const authorId = comment.authorEndpoint.browseEndpoint.browseId
      const authorName = comment.authorText.simpleText
      const authorThumbnails = comment.authorThumbnail.thumbnails
      const likes = comment.voteCount?.simpleText?.split(' ')[0] ?? '0'
      const numReplies = comment.replyCount ?? 0
      const publishedTimeText = comment.publishedTimeText.runs[0].text
      const publishedText = publishedTimeText.replace('(edited)', '').trim()
      const isEdited = publishedTimeText.includes('edited')

      const isOwner = comment.authorIsChannelOwner
      const isPinned = 'pinnedCommentBadge' in comment

      const icon = comment.authorCommentBadge?.authorCommentBadgeRenderer?.icon
      const isVerified = icon?.iconType === 'CHECK_CIRCLE_THICK' || icon?.iconType === 'CHECK'
      const isOfficialArtist = icon?.iconType === 'OFFICIAL_ARTIST_BADGE'

      const isHearted = comment.actionButtons.commentActionButtonsRenderer.creatorHeart?.creatorHeartRenderer?.isHearted ?? false

      let isMember = false
      let memberIconUrl = null
      if (comment.sponsorCommentBadge !== undefined) {
        isMember = true
        memberIconUrl = comment.sponsorCommentBadge.sponsorCommentBadgeRenderer.customBadge.thumbnails[0].url
      }

      const contentText = comment.contentText.runs

      const customEmojis = []
      contentText.forEach((content) => {
        if (content.text === '\n') {
          text = text + '<br>'
        } else if (content.bold || content.strikethrough || content.italics) {
          let formattedText = content.text

          if (content.bold) {
            formattedText = '<b>' + formattedText + '</b>'
          }
          if (content.strikethrough) {
            formattedText = '<s>' + formattedText + '</s>'
          }
          if (content.italics) {
            formattedText = '<i>' + formattedText + '</i>'
          }

          text = text + formattedText
        } else {
          text = text + content.text
        }
        if (typeof content.emoji !== 'undefined') {
          customEmojis.push({
            text: content.text,
            emojiThumbnails: content.emoji.image.thumbnails
          })
        }
      })

      const commentData = {
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
        isOfficialArtist: isOfficialArtist,
        isMember: isMember,
        memberIconUrl: memberIconUrl,
        customEmojis: customEmojis
      }

      if (comment.replyCount > 0) {
        const replyNode = node.commentThreadRenderer.replies.commentRepliesRenderer
        const continuation = replyNode.contents[0].continuationItemRenderer.continuationEndpoint.continuationCommand.token
        commentData.replyToken = continuation
        commentData.hasOwnerReplied = replyNode.viewRepliesCreatorThumbnail !== undefined
      }

      comments.push(commentData)
    })

    return comments
  }

  static parseShortedNumberString(string) {
    const numberMultiplier = string.charAt(string.length - 1).toLowerCase()
    switch (numberMultiplier) {
      case 'k':
        return Number(string.substring(0, string.length - 1) * 1000)
      case 'm':
        return Number(string.substring(0, string.length - 1) * 1000000)
    }
  }
}

module.exports = HtmlParser
