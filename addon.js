const { addonBuilder } = require("stremio-addon-sdk");

const manifest = {
    "id": "org.vidfast.pro",
    "version": "1.0.0",
    "name": "VidFast Pro",
    "description": "Stream movies and TV shows from VidFast.pro",
    "resources": [
        "stream"
    ],
    "types": ["movie", "series"],
    "idPrefixes": ["tt"]
};

const builder = new addonBuilder(manifest);

// Streams handler
builder.defineStreamHandler(function(args) {
    console.log("Stream request for:", args.id, args.type);
    
    const streams = [];
    
    if (args.type === "movie") {
        streams.push({
            name: "VidFast Stream",
            title: "VidFast",
            externalUrl: `https://vidfast.pro/movie/${args.id}?autoPlay=true`
        });
    } 
    else if (args.type === "series") {
        // For series, we need season and episode info
        const idParts = args.id.split(":");
        if (idParts.length === 3) {
            const [imdbId, season, episode] = idParts;
            streams.push({
                name: "VidFast Stream",
                title: `S${season}E${episode}`,
                externalUrl: `https://vidfast.pro/tv/${imdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true`
            });
        }
    }

    return Promise.resolve({ streams });
});

module.exports = builder.getInterface();
