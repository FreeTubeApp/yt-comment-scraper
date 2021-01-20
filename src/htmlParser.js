const parser = require('node-html-parser')

class HtmlParser {

  static parseHtmlData(data) {
    const root = parser.parse(data)
    const comments = []
    const nodes = this.removeTextNodes(root.childNodes)

    nodes.forEach((node) => {
      const commentEntryNode = this.removeTextNodes(node.childNodes)
      const commentContentNode = this.removeTextNodes(commentEntryNode[0].childNodes)
      const repliesNode = this.removeTextNodes(commentEntryNode[1].childNodes)
      const commentObject = this.parseComment(commentContentNode)
      commentObject.hasReplies = repliesNode ? true : false
      commentObject.numReplies = repliesNode ? repliesNode.length : 0
      commentObject.replies = this.parseReplies(repliesNode)
      comments.push(commentObject)
    })

    return comments
  }

  static parseReplies(nodes) {
    const replies = []

    nodes.forEach((node) => {
      const childNodes = this.removeTextNodes(node.childNodes)
      const commentObject = this.parseComment(childNodes)
      replies.push(commentObject)
    })

    return replies
  }

  static parseComment(node) {
    const comment = {}
    const channelImageNode = this.removeTextNodes(node[0].childNodes)
    const contentNodes = this.removeTextNodes(node[1].childNodes)
    const channelNodes = this.removeTextNodes(contentNodes[0].childNodes)
    const channelNameNode = channelNodes[0]
    const timeNode = channelNodes[3] ? channelNodes[3] : channelNodes[2]
    const commentNode = this.removeTextNodes(contentNodes[1].childNodes)
    let metaDataNode = this.removeTextNodes(contentNodes[2].childNodes)
    metaDataNode = this.removeTextNodes(metaDataNode[0].childNodes)
    const likesNode = metaDataNode[2]
    const heartsNode = metaDataNode[4]
    comment.authorThumb = channelImageNode[0].attributes.src
    comment.author = channelNameNode.innerText
    comment.id = channelNameNode.attributes.href.replace(/\/(channel|user)\//, '')
    comment.text = commentNode[0].innerText
    comment.likes = likesNode.innerText ? parseInt(likesNode.innerText) : 0
    comment.isHearted = heartsNode ? heartsNode.outerHTML.includes('data-action-on') : false
    comment.time = timeNode.innerText.trim().replace(/\(edited\)/, '')
    comment.edited = timeNode.innerText.includes('edited')

    return comment
  }

  static removeTextNodes(data) {
    return data.filter((node) => {
      return typeof node.classNames !== 'undefined'
    })
  }
}

module.exports = HtmlParser
