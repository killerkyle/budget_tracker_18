let CACHE_NAME = "static-cache-v2";
let DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/db.js",
    "/manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
   ];
   
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(DATA_CACHE_NAME).then(cache => {
        console.log("cache installing");
        return cache.addAll(FILES_TO_CACHE)
    })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) =>{
    console.log("searching for older cached data")
    const cacheDuo = [CACHE_NAME, DATA_CACHE_NAME];
    event.waitUntil(caches.keys().then(keyList =>{
        keyList.map(key => {
            if (key !== cacheDuo){
                console.log("removing older iteration of cached data", key);
                return caches.delete(key)
            };
        });
    }));
});

self.addEventListener("fetch", function(event) {
    // cache successful requests to the API
    if (event.request.url.includes("/api/")) {
      event.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(event.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }
              return response;
            })
            .catch(error => {
              return cache.match(event.request);
            });
        }).catch(error => console.log(error))
      );
      return;
    }
  
    // if the request is not for the API, serve static assets using "offline-first" approach.
    event.respondWith(
        fetch(event.request).catch(function(){
            return caches.match(event.request).then(function(response) {
                if (response){return response}
                else if (event.request.headers.get("accept").includes("text/html")) {
                    return caches.match("/")}
            })

        })
    );
});