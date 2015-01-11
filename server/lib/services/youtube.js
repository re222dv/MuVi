let Rx = require('rx');
import {getVideo} from '../model/DAL/youtube.js';
import neo4j from '../model/DAL/neo4j.js';
import {relate} from '../helpers.js';

/**
 * Tries to get missing videos
 * @Returns {Promise}
 */
export var getMissingVideos = () =>
  neo4j.query(`Match (song:Song)-->(:Artist)-->(artist:FreebaseEntity)
                      Where not (:YouTubeVideo)<--(song:Song)
                      Return song, artist`)
    .then(rows => new Promise((resolve, reject) => {
      let subject = new Rx.Subject();

      subject
        .flatMap(chunk => Promise.all(chunk.map(row => getVideo(row.song, row.artist.mid))))
        .flatMap(videos => {
          let data = {
            entities: [],
            relations: [],
          };
          videos
            .filter(video => video !== undefined)
            .forEach(video => {
              console.log('video for', video.song.name);
              data.entities.push(video.song);
              data.entities.push(video.video);
              data.entities.push(video.thumbnail);

              data.relations.push(relate(video.song, 'video', video.video));
              data.relations.push(relate(video.video, 'thumbnail', video.thumbnail));
            });

          return neo4j.create(data.entities, data.relations);
        })
        .doOnError((e) => console.log('Video Error', e))
        .doOnCompleted(() => console.log('done'))
        .subscribe(() => {}, reject, resolve);

      // Chunk the rows with a window so we don't send to many requests at the same time
      let pushChunk;
      pushChunk = () => {
        if (rows.length) {
          subject.onNext(rows.splice(0, 50));
          setTimeout(pushChunk, 50);
        } else {
          subject.onCompleted();
          subject.dispose();
        }
      };
      pushChunk();
    }));
