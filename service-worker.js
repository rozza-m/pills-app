// self.addEventListener('install', (event) => {
//     event.waitUntil(
//       caches.open('my-cache').then((cache) => {
//         return cache.addAll([
//           'index.html',
//           'css/pilltracker.css',
//           'css/icons.css',
//           'resources/reset.css',
//           'resources/Ubunti-Bold.ttf',
//           'resources/Ubuntu-Medium.ttf',
//           'resources/Ubuntu-Regular.ttf',
//           'resources/Ubuntu-Light.ttf',
//           'resources/UbuntuCondensed-Regular.ttf'
//         ]);
//       })
//     );
//   });

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('my-cache').then((cache) => {
        const urlsToCache = [
          'index.html',
          'css/pilltracker.css',
          'css/icons.css',
          'resources/reset.css',
          'resources/Ubuntu-Bold.ttf',
          'resources/Ubuntu-Medium.ttf',
          'resources/Ubuntu-Regular.ttf',
          'resources/Ubuntu-Light.ttf',
          'resources/UbuntuCondensed-Regular.ttf'
        ];
  
        const cachePromises = urlsToCache.map((url) => {
          return fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch((error) => {
              console.error('Failed to cache:', url, error);
            });
        });
  
        return Promise.all(cachePromises)
          .then(() => {
            console.log('All files cached successfully!');
          })
          .catch((error) => {
            console.error('Failed to cache some files:', error);
          });
      })
    );
  });

  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.open('my-cache').then((cache) => {
        return fetch(event.request).then((response) => {
          // Update the cache with the latest version of the file
          cache.put(event.request, response.clone());
          return response;
        }).catch(() => {
          // Serve the file from the cache if the network request fails
          return cache.match(event.request);
        });
      })
    );
  });