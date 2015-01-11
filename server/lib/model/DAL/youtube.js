let request = require('request-promise');
import {key} from '../../../config/google_secret.js';

/**
 * Search Youtube for an video
 *
 * @param {String} song Song name
 * @param {String} artistMid Freebase mid of the artist
 * @returns {Promise<{{song: String, video: YouTubeVideo, thumbnail: Image}}>}
 */
export function getVideo(song, artistMid) {
  let params = {
    q: encodeURIComponent(song.name),
    topicId: encodeURIComponent(artistMid),
    part: encodeURIComponent('snippet'),
    maxResults: 1,
    type: 'video',
    videoEmbeddable: 'true',
    key: encodeURIComponent(key),
  };
  let queryString = Object.keys(params).map(param => `${param}=${params[param]}`).join('&');
  let url = `https://www.googleapis.com/youtube/v3/search?${queryString}`;

  return request(url)
    .then(JSON.parse)
    .then(response => response.items.length >= 1 ? ({
      song,
      video: {
        type: 'YouTubeVideo',
        youtubeId: response.items[0].id.videoId,
      },
      thumbnail: {
        type: 'Image',
        url: (
          response.items[0].snippet.thumbnails.high ||
          response.items[0].snippet.thumbnails.medium ||
          response.items[0].snippet.thumbnails.default
        ).url,
      }
    }) : undefined);
}
