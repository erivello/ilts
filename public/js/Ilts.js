
(function($) {

    VIDEO_PLAYER        = 'player';
    VIDEO_PLAYER_WIDTH  = 240;
    VIDEO_PLAYER_HEIGHT = 134;
    VIDEO_PARAMS        = {allowScriptAccess: "always", wmode: "opaque"};
    VIDEO_ATTS          = {id: "ytplayer"};
    
    VIDEO_FEED_URL      = 'https://gdata.youtube.com/feeds/api/videos';
    VIDEO_FEED_VERSION  = 'v=2';
    VIDEO_FEED_FORMAT   = 'format=5';
    VIDEO_FEED_ALT      = 'alt=jsonc';
    VIDEO_FEED_ORDERBY  = 'orderby=relevance'

    // Song model
    Song = Backbone.Model.extend({
        
        defaults: {
            'profile_id': 'undefined',
            'position'  : 0,
            'videoid'   : 'undefined',
            'title'     : 'undefined',
            'thumb'     : 'undefined'            
        },
        
        validate: function(attrs) {
                        
            if (!attrs.title) {
              return "cannot have an empty title";
            }
            
            if (!attrs.videoid) {
              return "cannot have an empty videoid";
            }
            
            if (!attrs.thumb) {
              return "cannot have an empty thumb";
            }
        },
        
        getPosition: function() {
            return this.get('position')
        },
        
        getId: function() {
            return parseInt(this.get('id'));
        },
        
        getTitle: function() {
            return this.get('title')
        },
        
        getVideoId: function() {
            return this.get('videoid')
        },
        
        getThumb: function() {
            return this.get('thumb')
        },
        
        setPosition: function(index) {
            this.set('position', index);
        }
        
    });
    
    Songs = Backbone.Collection.extend({
        model: Song
    });
    
    Playlist = Songs.extend({
        
        url: '/playlist',
        
        parse: function(response) {
            return response.list;
        },
        
        isFirstSong: function(index) {
            return (index == 1)
        },

        isLastSong: function(index) {
            return (index == (this.models.length))
        }
        
    });
    
    // Player model
    Player = Backbone.Model.extend({
        
        // youtube player possible states
        possibleStatesValues : {
            '-1' : 'unstarted',
            '0'  : 'ended',
            '1'  : 'playing',
            '2'  : 'paused',
            '3'  : 'buffering',
            '5'  : 'video cued'
        },
        
        // youtube player possible error
        possibleErrorValues : {
            '2'    : 'videoid error',
            '100'  : 'video not foud',
            '101'  : 'video does not allow playback',
            '150'  : 'video does not allow playback'
        },
        
        defaults: {
            'currentSongId'     : '',
            'currentSongTitle'  : 'undefined',
            'currentSongIndex'  : 0,
            'state'             : 'unstarted'
        },
        
        initialize: function() {    

            this.song = new Song();   

        },
         
        reset: function() {
            this.set({
                'currentSongId'     : '',
                'currentSongTitle'  : 'undefined',
                'currentSongIndex'  : 0,
                'state'             : 'unstarted'
            });
        },
        
        onPlayerStateChange: function(newState) {
            
            this.set({
                'state': this.possibleStatesValues[newState]
            });
            
            this.logStateChange();
            
            if(this.possibleStatesValues[newState] == 'ended') this.nextVideo();
        },
        
        onPlayerError: function(errorCode) {
            console.log('Error: ' + this.possibleErrorValues[errorCode])
        },
        
        currentSongIndex: function() {
            return this.get('currentSongIndex');
        },
        
        loadVideo: function(song) { 
            
            this.song = song;
            this.set({
                'currentSongId'     : song.getVideoId(),
                'currentSongTitle'  : song.getTitle(),
                'currentSongIndex'  : song.getPosition()
            });
            
            ytplayer.loadVideoById(song.getVideoId());

        },
        
        playVideo: function() {
            ytplayer.playVideo();
        },
        
        pauseVideo: function() {
            ytplayer.pauseVideo();
        },
        
        stopVideo: function() {          
            ytplayer.stopVideo();
            ytplayer.clearVideo();
        },
        
        nextVideo: function() {
            
            if (this.isFromAPlaylist()) {

                var currentSongIndex = this.currentSongIndex();

                if(this.song.collection.isLastSong(currentSongIndex)) {
                    currentSongIndex = 1;
                } else {
                    ++currentSongIndex; 
                }
                
                this.set({
                    'currentSongIndex'  : currentSongIndex
                });

                this.trigger('change:song', this.song.collection.at(currentSongIndex-1));
            }
            
        },
        
        prevVideo: function() {
            
            if (this.isFromAPlaylist()) {
                
                var currentSongIndex = this.currentSongIndex();
                
                if(this.song.collection.isFirstSong(currentSongIndex)) {                  
                    currentSongIndex = this.song.collection.models.length
                } else {
                    --currentSongIndex; 
                }
                
                this.set({
                    'currentSongIndex'  : currentSongIndex
                }); 
                
                this.trigger('change:song', this.song.collection.at(currentSongIndex-1));
            }
            
        },
        
        setVolume: function(volume) {
            ytplayer.setVolume(volume);
        },
        
        getVolume: function() {
            return ytplayer.getVolume();
        },

        isPlaying: function() {
            return (this.get('state') == 'playing');
        },

        isStopped: function() {
            return (!this.isPlaying());
        },
        
        isFromAPlaylist: function() {
            return (this.song.collection !== undefined);
        },

        logStateChange: function() {
            console.log('Player: ' + this.get('state'));
            console.log('Song: ' + this.get('currentSongTitle'));
            console.log('Playlist: ' + this.isFromAPlaylist());
            console.log('Playlist song index: ' + this.currentSongIndex());
        }
        
    });
    

    songs = new Songs();
    player = new Player();
    
    $(document).ready(function() {
        
        SearchView = Backbone.View.extend({
            
            el: $('.navbar-inner'),
            
            events: {
              'click .search-submit' : 'searchVideos'  
            },
            
            initialize: function() {
                _.bindAll(this, 'searchVideos');
            },
            
            searchVideos: function(e) {
                
                e.preventDefault();
                $('.search-results').empty();
                
                // update url and call the route action
                app.navigate('find-songs', {trigger:true});
                
                var queryUrl = 
                      VIDEO_FEED_URL     + '?'
                    + VIDEO_FEED_VERSION + '&'
                    + VIDEO_FEED_FORMAT  + '&'
                    + VIDEO_FEED_ALT     + '&'
                    + VIDEO_FEED_ORDERBY + '&'
                    + 'q=' + $('.search-query').val();
                
                               
                $.getJSON(queryUrl, function(feed) {
                    _.each(feed.data.items, function(item) {
                        
                        song = new Song({
                            'videoid'   : item.id,
                            'title'     : item.title,
                            'thumb'     : item.thumbnail.sqDefault                            
                        });
                        
                        var view = new ContentSongView({
                            model: song
                        });
  
                        $('.search-results').append(view.render().el);
                        
                    });
                });
            }
            
        });
        
        SidebarView = Backbone.View.extend({
            
            el: $('.sidebar'),
           
            initialize: function() {
               
                _.bindAll(this, 'renderPlayer');  
                
                this.player = player;
                
                // render the sidebar video player
                this.renderPlayer();
            },
           
            renderPlayer: function() {
                playerView = new PlayerView({
                    player: this.player
                });
                $(this.el).append(playerView.render().el);
            }
           
        });
      
        SongView = Backbone.View.extend({
            
            events: {
              'click a.song' : 'selectSong'
            },
                        
            initialize: function() {
                
                _.bindAll(this, 'render', 'selectSong', 'updateCurrentSong');
                
                this.model.bind('change', this.render); 
                
                this.player = player;
                this.player.bind('change:currentSongTitle', this.updateCurrentSong)
                
            },

            render: function() {
                $(this.el).html(this.template(this.model.toJSON()));
                return this;
            },
            
            // song selected
            selectSong: function() {
                this.player.trigger('change:song', this.model);
            },
            
            // higilights current song
            updateCurrentSong: function() {
                var isSongCurrent = (this.player.get('currentSongId') === this.model.getVideoId());
                this.$('a').toggleClass('current', isSongCurrent);                
            }
            
        });
        
        ContentSongView = SongView.extend({
            
            template: _.template('<a class="song"><img src="<%= thumb %>" alt="" class="content-song-song-image"><div class="content-song-song-title"><%= title %></div></a>'),
            tagName: 'li'
            
        });
        
        PlayerView = Backbone.View.extend({           
            
            tagName: 'div',
            id: 'sidebar-player',
            
            template: _.template($('#player-template').html()),
            
            events: { 
              'click #play'  : 'playVideo',
              'click #pause' : 'pauseVideo',
              'click #stop'  : 'stopVideo',
              'click #next'  : 'nextVideo',
              'click #prev'  : 'prevVideo'              
            },
            
            initialize: function() {
                
                _.bindAll(this, 
                    'render', 
                    'loadSong',
                    'updateSongTitle',
                    'renderPlayer',
                    'playVideo',
                    'pauseVideo',
                    'stopVideo',
                    'nextVideo',
                    'prevVideo',
                    'setVolume',
                    'getVolume'
                );
                    
                this.player = this.options.player;
                                
                this.player.bind('change:currentSongTitle', this.updateSongTitle);
                this.player.bind('change:song', this.loadSong);
                
                this.renderPlayer(); 

            },  

            updateSongTitle: function() {
                this.$('#player-video-info').html(this.player.get('currentSongTitle'));
            },
            
            render: function() {
                $(this.el).html(this.template(this.player.toJSON()));
                return this;
            },
            
            renderPlayer: function() {
                
                swfobject.embedSWF("http://www.youtube.com/apiplayer?" +
                    "version=3&enablejsapi=1&playerapiid=ytplayer", 
                    VIDEO_PLAYER, VIDEO_PLAYER_WIDTH, VIDEO_PLAYER_HEIGHT, "9", null, null, VIDEO_PARAMS, VIDEO_ATTS);
                    
            }, 
            
            loadSong: function(song) {
                this.player.loadVideo(song);
            },            

            playVideo: function() {
                this.player.playVideo();
            },
            
            pauseVideo: function() {
                this.player.pauseVideo();
            },
            
            stopVideo: function() {
                this.player.stopVideo();                
            },
            
            nextVideo: function() {
                this.player.nextVideo();                
            },
            
            prevVideo: function() {
                this.player.prevVideo();                
            },
            
            setVolume: function(volume) {
                this.player.setVolume(volume);
            },
            
            getVolume: function() {
                this.player.getVolume();
            }
            
        });
        
        Ilts = Backbone.Router.extend({
                        
            routes: {
                ''              : 'home',
                'home'          : 'home',
                '/'             : 'home',
                'find-songs'    : 'findSongs',
                'about'         : 'about'
            },

            initialize: function() {
                
                _.bindAll(this, 'changeContent', 'home', 'findSongs', 'about');
                                
                search = new SearchView();
                
                // sidebar view
                sidebar = new SidebarView();
                
            },
            
            changeContent: function(id) {

                $('.nav a').removeClass('current');
                $('#' + id).addClass('current');
                
                $('.content-wrapper').hide();
                $('#' + id + '-content').show();
            },
            
            // home tab
            home: function() {
                this.changeContent('home');
            },
            
            // find songs tab
            findSongs: function() {
                this.changeContent('find-songs');
            },
            
            // about tab
            about: function() {
                this.changeContent('about');
            }           
            
        });

        // start the application
        app = new Ilts();
        Backbone.history.start();

    });
        
})(jQuery);


function onYouTubePlayerReady(playerId) {
    ytplayer = document.getElementById(playerId);
    ytplayer.addEventListener('onStateChange', 'player.onPlayerStateChange');
    ytplayer.addEventListener('onError', 'player.onPlayerError');
}
