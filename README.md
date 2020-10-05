# YouTube Comment Scraper NodeJS Documentation
This NodeJS library scrapes the comments of the YouTube provided HTML comment data without any API usage order by date descending (so most recent first). It is developed for and tailored towards easy usage in the [FreeTube](https://github.com/FreeTubeApp/FreeTube-Vue) rewrite but can be used with any other project as well.
The library is able to scrape all comments at once or scrape only one page at a time and allowing follow-up pages to be loaded later. When performance is an issue, it is advised to use the page by page loading, because then data is only loaded when needed.

Therefore, this library does not require any API keys, with the attached maximum quotas, but instead might take longer to receive the required data.

The library works as long as YouTube keeps its web page layout the same. Therefore, there is **no guarantee** that this library will work at all times.
If this library should not work at some point, please create an issue and let me know so that I can take a look into it. Pull requests are also welcomed in this case.

## Installation
`npm install yt-comment-scraper`

##Usage
Create a new instance of the comment scraper with optional parameters. The first one (default = true) sets the module cookie if the module has to handle the cookies itself.
Set the value to false if you use something like Electron, which handles cookies by itself.
The second variable changes the sorting mode of the comments from popular (default = false) to newest (true)
```javascript
const CommentScraper = require("yt-comment-scraper")
// the two boolean variable default to true and false.
const ytcomments = new CommentsScraper(setCookie = true, sortNew = false) 
```

## API
**scrape_all_youtube_comments(videoId)**

Returns a list of objects containing **all** comments and replies of the video.
```javascript
ytcomments.scrape_all_youtube_comments(videoId).then((data) =>{
    console.log(data);
}).catch((error)=>{
    console.log(error);
});
```
**scrape_next_page_youtube_comments(videoId)**

Returns a list of objects containing comments and replies from the next page of the video.
```javascript
//grab the first 10 pages (200 comments)
for(let i = 0; i < 10; i++){
    ytcomments.scrape_next_page_youtube_comments(videoId).then((data) =>{
        console.log(data);
    }).catch((error)=>{
        console.log(error);
    });
}
//required when a new video is being watched. This clears all data that is required being able to load one page per function call
ytcomments.cleanupStatics()
```
**Returned Data**

The data is returned as a list of objects (seen below). The replies have the same structure, except they are missing the replies attribute.
Everything is a string because the given format is string and then everyone can do what they want with the data without converting it back to string format.
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
  replies: [replyObjects]
}
```
## Credits
Thanks to egbertbouman for his/her Python [project](https://github.com/egbertbouman/youtube-comment-downloader) which guided this project through the difficult HTTP calls.
