
var fixtures = 
{

  valid: {
    "status": "OK",
    "version": "1.0",
    "list": [
        {
            "id": "18",
            "profile_id": "1",
            "videoid": "s9MszVE7aR4",
            "title": "Daft Punk - Around The World",
            "thumb": "http://i.ytimg.com/vi/s9MszVE7aR4/default.jpg"
        },
        {
            "id": "20",
            "profile_id": "3",
            "videoid": "kcB6SgkG4AE",
            "title": "Metallica - The Day That Never Comes",
            "thumb": "http://i.ytimg.com/vi/kcB6SgkG4AE/default.jpg"
        },
        {
            "id": "25",
            "profile_id": "3",
            "videoid": "bAsA00-5KoI",
            "title": "Metallica - Nothing Else Matters [Original Video]",
            "thumb": "http://i.ytimg.com/vi/bAsA00-5KoI/default.jpg"
        },
        {
            "id": "26",
            "profile_id": "3",
            "videoid": "EzgGTTtR0kc",
            "title": "Metallica - One",
            "thumb": "http://i.ytimg.com/vi/EzgGTTtR0kc/default.jpg"
        },
        {
            "id": "31",
            "profile_id": "1",
            "videoid": "l7LOilr_or0",
            "title": "Metallica - Welcome Home (Sanitarium) (Live - Halifax, Canada) - MetOnTour",
            "thumb": "http://i.ytimg.com/vi/l7LOilr_or0/default.jpg"
        }
    ]
  } 
    

};

// song tests
describe("Song model", function () {
 
    beforeEach(function() {
      this.song = new Song({});
    }); 
 
    describe("when instantiated", function() {
        
        beforeEach(function() {
            this.song = new Song(fixtures.valid.list[0]);
        });
        
        it("should exhibit attributes", function () {
            expect(this.song.get('id')).toEqual('18');
            expect(this.song.get('profile_id')).toEqual('1');
            expect(this.song.getVideoId()).toEqual('s9MszVE7aR4');
            expect(this.song.getTitle()).toEqual('Daft Punk - Around The World');
            expect(this.song.getThumb()).toEqual('http://i.ytimg.com/vi/s9MszVE7aR4/default.jpg');
        });        
    });

    describe("url", function () {
        
        beforeEach(function() {
            var collection = {
              url: '/songs'
            };
            this.song.collection = collection;
        });
        
        describe("when no id is set", function() {
            it("should return the collection URL", function() {
                expect(this.song.url()).toEqual('/songs');
            });
        });

        describe("when id is set", function() {
            it("should return the collection URL and id", function() {
              this.song.id = 18;
              expect(this.song.url()).toEqual('/songs/18');
            });
        });
        

    });
    
    describe("save", function () {

        it("should not save when videoid is empty", function() {
            
            var eventSpy = sinon.spy();
            this.song.bind('error', eventSpy);
            this.song.save({'videoid': ''});

            expect(eventSpy).toHaveBeenCalledOnce();
            expect(eventSpy).toHaveBeenCalledWith(
                this.song,
                'cannot have an empty videoid'
            );

        });

    });   
    
    describe("collection", function () {
        
        describe("when no collection is set", function () {

            it("should return collection undefined", function () {
                expect(this.song.collection).toEqual(undefined);
            })

        });      

        describe("when collection is set", function () {
            
            beforeEach(function() {
                var collection = {
                  url: '/collection'
                };
                this.song.collection = collection;
            });
            
            it("should return collection", function () {
                expect(this.song.collection.url).toEqual('/collection');
            })

        });  

        
    });
    


    
});

// playlists tests
describe("Playlist model", function () {
    
    beforeEach(function() {
        
        this.playlist = new Playlist();
        this.playlist.add(fixtures.valid.list);

    });
    
    describe("when instantiated", function() {

    
        it("should have a model", function () {
            expect(this.playlist.length).toEqual(5);
        });

        it("should find a model by id", function() {
            expect(this.playlist.get(18).get('id')).toEqual('18');
        });
        
        it("should order models by the order in the playlist", function() {
            expect(this.playlist.at(0)).toBe(this.playlist.get(18));
            expect(this.playlist.at(1)).toBe(this.playlist.get(20));
            expect(this.playlist.at(2)).toBe(this.playlist.get(25));
        });

    });
    
    describe("when fetching", function () {
        
        beforeEach(function() {
            this.server = sinon.fakeServer.create();
            this.playlist = new Playlist();

            this.fixture = fixtures.valid;
            this.server.respondWith(
                "GET",
                "/playlist",
                [
                  200,
                  {"Content-Type": "application/json"},
                  JSON.stringify(this.fixture)
                ]
            );

        });
        
        afterEach(function() {
            this.server.restore();
        });
        
        it("should make the correct request", function() {
            
            this.playlist.fetch();
            
            expect(this.server.requests.length)
                .toEqual(1);
            expect(this.server.requests[0].method)
                .toEqual("GET");
            expect(this.server.requests[0].url)
                .toEqual("/playlist");
        });
        
        it("should parse playlist from the response", function() {
            
            this.playlist.fetch();
            this.server.respond();          
            
            expect(this.playlist.length)
                .toEqual(this.fixture.list.length);
            expect(this.playlist.get(18).get('title'))
                .toEqual(this.fixture.list[0].title);
    
        });


    });
    
});


// player tests
describe("Player model", function () {
    
    beforeEach(function() {
        this.player = new Player();
    });
    
    
    describe("when instantiated", function() {

        it("should exhibit attributes", function () {
            expect(this.player.get('state')).toEqual('unstarted');
        });
        
        it("should not be playing", function () {
            expect(this.player.isPlaying()).toBeFalsy();
        });
        
        
        describe("song model", function () {
            
            it("should be instantiated", function () {
                expect(this.player.song).toBeDefined();
            });   
            
            it("should be undefined", function () {
                expect(this.player.song.videoid).toEqual(undefined);
            });
            
            describe("when the song model is defined", function () {
            
                beforeEach(function() {
                    this.song = new Song(fixtures.valid.list[0]);
                    this.player.song = this.song;
                });
                
                it("should have song model defined", function () {
                    expect(this.player.song.get('videoid')).toEqual('s9MszVE7aR4');
                });            
            
            });
            
        });


//        describe("playlist collection", function () {
//            
//            it("should be instantiated", function () {
//                expect(this.player.playlist).toBeDefined();
//            });   
//            
//            it("should be undefined", function () {
//                expect(this.player.playlist.length).toEqual(0);
//            }); 
//            
//            describe("when the playlist collection is defined", function () {
//                
//                beforeEach(function() {
//                    this.playlist = new Playlist();
//                    this.playlist.add(fixtures.valid.list);
//                    
//                    this.player.playlist = this.playlist;
//                });
//                
//                it("should have playlist collection defined", function () {
//                    expect(this.player.playlist.at(0).get('videoid')).toEqual('s9MszVE7aR4');
//                }); 
//                
//            });
//            
//        }); 
        
    });
    
    
});