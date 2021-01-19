# YouTube Comment Scraper NodeJS Documentation
This NodeJS library scrapes the comments of the YouTube provided HTML comment data without any API usage order by date descending (so most recent first). It is developed for and tailored towards easy usage in the [FreeTube](https://github.com/FreeTubeApp/FreeTube) rewrite but can be used with any other project as well.
The library is able to scrape all comments at once or scrape only one page at a time and allowing follow-up pages to be loaded later. When performance is an issue, it is advised to use the page by page loading, because then data is only loaded when needed.

Therefore, this library does not require any API keys, with the attached maximum quotas, but instead might take longer to receive the required data.

The library works as long as YouTube keeps its web page layout the same. Therefore, there is **no guarantee** that this library will work at all times.
If this library should not work at some point, please create an issue and let me know so that I can take a look into it. Pull requests are also welcomed in this case.

## Installation
`npm install yt-comment-scraper --save`

##Usage
Create a new instance of the comment scraper with optional parameters. The first one (default = true) sets the module cookie if the module has to handle the cookies itself.
Set the value to false if you use something like Electron, which handles cookies by itself.
The second variable changes the sorting mode of the comments from popular (default = false) to newest (true)
```javascript
const ytcm = require("yt-comment-scraper")

import ytcm from 'yt-comment-scraper'
```

## API
**getAllComments(videoId, sortByNewest, setCookie)**

Returns a list of objects containing **all** comments and replies of the video.

- videoId (String) (Required) - The video ID to get comments from
- sortByNewest (Boolean) (Default: false) - Whether to sort by the newest comments or to sort by the top comments.
- setCookie (Boolean) (Default: true) - Whether to set cookies while grabbing comments or not. Sometimes needs to be `false` depending on your environment

**WARNING:** This command can take a _long_ time to run depending on the amount of comments being grabbed. Be aware that this might be very resourse heavy and you may want to use `getComments()` instead to paginate through comments.

```javascript
ytcm.getAllComments(videoId, sortByNewest, setCookie).then((data) =>{
    console.log(data);
}).catch((error)=>{
    console.log(error);
});
```
**getComments(payload)**

Returns a list of objects containing comments and replies from the next page of the video.

- payload (Object) (Required) - An object containing the various options
  - videoId (String) (Required) - The video ID to grab comments from
  - sortByNewest (Boolean) (Default: `false`) - Grabs newest comments when `true`. Grabs top comments when `false`
  - setCookie (Boolean) (Default: `true`) - Sets a cookie internally when grabbing comments. May not be needed depending on your environment
  - xsrf (String) (Optional) - The XSRF token needed to grab comments from a video. Module will automatically grab this token if not provided
  - continuation (Optional) - The token from a previous call to continue grabbing comments

```javascript
const payload = {
  videoId: videoId, // Required
  sortByNewest: sortByNewest,
  setCookie: setCookie,
  xsrf: xsrf,
  continuation: continuation
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
{
  id: commentId,
  author: authorName,
  authorLink: authorChannelUrl,
  authorThumb: authorChannelPicture,
  edited: wasItEdited (true/false)
  text: commentText,
  likes: numberOfDisplayedUpvotes,
  time: publishedText (in english: '1 year'),
  hasReplies: hasReplies,
  numReplies: numberOfReplies,
  isHearted: true/false,
  replies: [replyObjects]
}
```
## Credits
Thanks to egbertbouman for his/her Python [project](https://github.com/egbertbouman/youtube-comment-downloader) which guided this project through the difficult HTTP calls.
