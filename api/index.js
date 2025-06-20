// Vercel serverless Stremio Addon handler

const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");
const manifest = require("../manifest.json");

const builder = new addonBuilder(manifest);

// Catalog handler
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  let url = "";
  if (type === "movie") {
    url = "https://wecima.click/movies/";
  } else if (type === "series") {
    url = "https://wecima.click/series/";
  } else {
    return { metas: [] };
  }

  try {
    const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(response.data);
    const metas = [];
    $(".GridItem").each((_, el) => {
      const title = $(el).find(".GridItem__Title").text().trim();
      let poster = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
      const pageUrl = $(el).find("a").attr("href");
      if (!title || !pageUrl) return;
      if (poster && !poster.startsWith("http")) poster = `https://wecima.click${poster}`;
      metas.push({
        id: pageUrl,
        name: title,
        poster: poster,
        type: type
      });
    });
    return { metas };
  } catch (err) {
    return { metas: [] };
  }
});

// Stream handler
builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const response = await axios.get(id, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(response.data);
    let streams = [];
    $("iframe").each((_, el) => {
      let src = $(el).attr("src");
      if (src && (src.includes("vidcloud") || src.includes("wecima") || src.includes("embed"))) {
        if (!src.startsWith("http")) src = "https:" + src;
        streams.push({
          url: src,
          title: "Wecima Server",
          name: "Wecima",
          behaviorHints: { notWebReady: false }
        });
      }
    });
    if (streams.length === 0) {
      const fallbackSrc = $("iframe").first().attr("src");
      if (fallbackSrc) {
        streams.push({
          url: fallbackSrc.startsWith("http") ? fallbackSrc : "https:" + fallbackSrc,
          title: "Wecima Server (Fallback)",
          name: "Wecima"
        });
      }
    }
    return { streams };
  } catch (err) {
    return { streams: [] };
  }
});

// Export as Vercel API handler
module.exports = (req, res) => {
  // Serve manifest at /manifest.json
  if (req.url === "/manifest.json") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(manifest));
    return;
  }
  // Delegate all other requests to Stremio addon's interface
  return builder.getInterface()(req, res);
};
