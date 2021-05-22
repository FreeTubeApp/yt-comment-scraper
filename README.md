# YouTube Comment Scraper NodeJS Documentation
This NodeJS library scrapes the comments of the YouTube provided HTML comment data without any API usage order by date descending (so most recent first). It is developed for and tailored towards easy usage with [FreeTube](https://github.com/FreeTubeApp/FreeTube) but can be used with any other project as well.

This library does not require any API keys, with the attached maximum quotas, but instead might take longer to receive the required data.

The library works as long as YouTube keeps its web page layout the same. Therefore, there is **no guarantee** that this library will work at all times.
If this library should not work at some point, please create an issue and let me know so that I can take a look into it. Pull requests are also welcomed in this case.


## Installation
`npm install yt-comment-scraper --save`

## Usage
Set your instance with the following syntax. Use the second line instead if you're using modules / Typescript
```javascript
const ytcm = require("yt-comment-scraper")

import ytcm from 'yt-comment-scraper'
```

**getComments(payload)**

Returns a list of objects containing comments from the next page of the video.

- payload (Object) (Required) - An object containing the various options
  - videoId (String) (Required) - The video ID to grab comments from
  - sortByNewest (Boolean) (Default: `false`) - Grabs newest comments when `true`. Grabs top comments when `false`
  - continuation (Optional) - The token from a previous call to continue grabbing comments
  - setCookie (Optional) - The flag should be set to true when cookies are not handled by your application already (e.g. Electron)

```javascript
const payload = {
  videoId: videoId, // Required
  sortByNewest: sortByNewest,
  continuation: continuation,
  setCookie: false
}

ytcm.getComments(payload).then((data) =>{
    console.log(data);
}).catch((error)=>{
    console.log(error);
});
```
**Returned Data**

The data is returned as a list of objects (seen below). The replies have the same structure, except they are missing the replies attribute.
```javascript
// The data is a list of objects containing the following attributes:
  comments: [
  {
    commentId: String, // Id of comment
    authorId: String, // Id of user that made the comment
    author: String, // Name of the channel that made the comment
    authorThumb: Array [ // An Array of thumbnails of the channel profile
      {
        width: Number,
        height: Number,
        url: String
      }
    ],
    edited: Boolean, // If the comment has been edited or not
    text: String, // The text content of the comment
    likes: Number, // The amount of likes the comment has
    time: String, // The time the comment was published. Written as "One day ago"
    numReplies: Number, // The number of replies found for the comment
    isHearted: Boolean, // If the video channel hearted the comment
    replyToken: String // The continuation token needed for getCommentReplies()
  }],
  continuation: String // The continuation token needed to get more replies from getComments()
```

**getCommentReplies(videoId, continuation)**

Returns a list of objects containing replies from a given comment.

  - videoId (String) (Required) - The video ID to grab comments from
  - replyToken (String) (Required) - The reply token from a comment object of `getComments()`

```javascript
ytcm.getCommentReplies(videoId, replyToken).then((data) =>{
    console.log(data);
}).catch((error)=>{
    console.log(error);
});
```
**Returned Data**

The data is returned as a list of objects (seen below). The replies have the same structure, except they are missing the replies attribute.
```javascript
// The data is a list of objects containing the following attributes:
  comments: [
  {
    commentId: String, // Id of comment
    authorId: String, // Id of user that made the comment
    author: String, // Name of the channel that made the comment
    authorThumb: Array [ // An Array of thumbnails of the channel profile
      {
        width: Number,
        height: Number,
        url: String
      }
    ],
    edited: Boolean, // If the comment has been edited or not
    text: String, // The text content of the comment
    likes: String, // The amount of likes the comment has, numbers > 1000 displayed with 1.9K, 2K...
    time: String, // The time the comment was published. Written as "One day ago"
    numReplies: Number, // The number of replies found for the comment
    isHearted: Boolean, // If the video channel hearted the comment
    replyToken: String // The continuation token needed for getCommentReplies()
  }],
  continuation: String // The continuation token needed to get more replies from getComments()
```
## Credits
Thanks to egbertbouman for his/her Python [project](https://github.com/egbertbouman/youtube-comment-downloader) which guided this project through the difficult HTTP calls.
