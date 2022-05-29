import { HttpsProxyAgent } from 'https-proxy-agent';

declare module "yt-comment-scraper" {
    interface Image {
        url: string
        width: number
        height: number
    }
    interface Comment {
        commentId: string
        authorId: string
        author: string
        authorThumb: Image[]
        edited: boolean
        text: string
        likes: string
        time: string
        numReplies: number
        isOwner: boolean
        isHearted: boolean
        isPinned: boolean
        hasOwnerReplied: boolean
        isMember: boolean
        memberIconUrl: string | null
        customEmojis: {
            text: string
            emojiThumbnails: Image[]
        }[]
        replyToken: string | null
    }
    interface CommentReply extends Comment {
        hasOwnerReplied: false
        isPinned: false
        replyToken: null
    }
    interface CommentPayload {
        videoId: string
        sortByNewest?: boolean
        continuation?: string
        mustSetCookie?: boolean
        httpsAgent?: HttpsProxyAgent
    }

    interface CommentRepliesPayload {
        videoId: string
        replyToken: string
        mustSetCookie?: boolean
        httpsAgent?: HttpsProxyAgent
    }
    interface CommentResponse {
        total: number | null
        comments: Comment[]
        continuation: string | null
    }

    interface CommentReplyResponse {
        comments: CommentReply[]
        continuation: string | null
    }

    class CommentScraper {
        static getComments(payload: CommentPayload): Promise<CommentResponse>
        static getCommentReplies(payload: CommentRepliesPayload): Promise<CommentReplyResponse>
    }
    export = CommentScraper
}
