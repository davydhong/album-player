const faker = require('faker');
const fs = require('fs');
const coolImages = require('cool-images');
const console = require('console');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

let artistTemplate = {
  artistID: undefined,
  artistName: undefined
};
let albumTemplate = {
  albumID: undefined,
  albumName: undefined,
  albumImage: undefined,
  publishedYear: undefined,
  artist_id: undefined
};
let songTemplate = {
  songID: undefined,
  songName: undefined,
  streams: undefined,
  length: undefined,
  popularity: undefined,
  addedToLibrary: undefined,
  album_id: undefined
};

// sizeEachFile = number of artists in each file
var writeOneFile = function(fileID, sizeEachFile) {
  return new Promise((resolve, reject) => {
    // Initiate writeStream
    let artistStream = fs.createWriteStream(__dirname + `/data2/artists/data${fileID}.csv`);
    let albumStream = fs.createWriteStream(__dirname + `/data2/albums/data${fileID}.csv`);
    let songStream = fs.createWriteStream(__dirname + `/data2/songs/data${fileID}.csv`);

    artistStream.write(Object.keys(artistTemplate).join(',') + '\n');
    albumStream.write(Object.keys(albumTemplate).join(',') + '\n');
    songStream.write(Object.keys(songTemplate).join(',') + '\n');

    for (let i = fileID * sizeEachFile + 10000000; i < (fileID + 1) * sizeEachFile + 10000000; i++) {
      let artist = {
        artistID: i,
        artistName: faker.name.findName()
      };
      artistStream.write(Object.values(artist).join(',') + '\n');

      var albumCount = faker.random.number({ min: 1, max: 3 });
      var start = faker.random.number({ min: 1, max: 996 });
      for (let j = 1; j <= albumCount + 1; j++) {
        let album = {
          albumID: artist.artistID * 10 + j,
          albumName: faker.random.words(),
          albumImage: `https://s3-us-west-1.amazonaws.com/sdc-spotifeye/photos/${start + j}.jpg`,
          publishedYear: faker.random.number({ min: 1950, max: 2018 }),
          artist_id: artist.artistID
        };
        while (album.albumName.includes(',')) {
          album.albumName = faker.random.word() + ' ' + faker.random.word();
        }
        albumStream.write(Object.values(album).join(',') + '\n');
        var songNumber = faker.random.number({ min: 1, max: 3 });
        for (let k = 1; k <= songNumber; k++) {
          let song = {
            songID: artist.artistID * 100 + album.albumID * 10 + k,
            songName: faker.random.words(),
            streams: faker.random.number({ min: 50000, max: 100000000 }),
            length: faker.random.number({ min: 180, max: 250 }),
            popularity: faker.random.number({ min: 1, max: 10 }),
            addedToLibrary: faker.random.boolean(),
            album_id: album.albumID
          };
          while (song.songName.includes(',')) {
            song.songName = faker.random.word() + ' ' + faker.random.word();
          }
          songStream.write(Object.values(song).join(',') + '\n');
        }
      }
    }
    artistStream.end(() => {
      albumStream.end(() => {
        songStream.end(() => {
          resolve(fileID + 1);
        });
      });
    });
  });
};

var writeMultipleFiles = async function(fileCount, sizeEachFile) {
  var i = 0;
  while (i < fileCount) {
    console.log(`WRITING FILE ${i}`);
    console.time(`TIME FOR WRITING FILE ${i}`);
    var nextFile = await writeOneFile(i, sizeEachFile);
    console.timeEnd(`TIME FOR WRITING FILE ${i}`);
    i = nextFile;
  }
  console.timeEnd('SINGLE THREAD WRITE');
};

console.time('SINGLE THREAD WRITE');
writeMultipleFiles(10, 1000000);
