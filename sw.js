// Service Worker para Farmação de Aura
const CACHE_NAME = 'farmacao-aura-v1.0.0';
const OFFLINE_URL = '/index.html';

// Arquivos para cache
const urlsToCache = [
  '/',
  '/index.html',
  '/aura.html',
  '/editar.html',
  '/manifest.json',
  '/bub.mp3',
  '/Picol.gif',
  '/Shan.gif',
  '/Hiso.gif',
  '/gif4.gif'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Cache populado com sucesso');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Erro ao cachear arquivos:', error);
      })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Agora controlando a página');
      return self.clients.claim();
    })
  );
});

// Estratégia: Network First com fallback para cache
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições para analytics e extensões
  if (request.url.includes('google-analytics') || 
      request.url.includes('chrome-extension') ||
      request.url.includes('firebase')) {
    return;
  }
  
  // Para imagens GIF - Cache First (prioriza cache)
  if (request.url.match(/\.(gif|png|jpg|jpeg)$/i)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
              return response;
            })
            .catch(() => {
              // Fallback para imagem padrão se offline
              return caches.match('/Picol.gif');
            });
        })
    );
    return;
  }
  
  // Para áudio - Network First
  if (request.url.match(/\.(mp3|wav|ogg)$/i)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }
  
  // Para HTML e dados principais - Network First
  event.respondWith(
    fetch(request)
      .then(response => {
        // Verificar se resposta é válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clonar a resposta
        const responseToCache = response.clone();
        
        // Atualizar cache
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, responseToCache);
          });
        
        return response;
      })
      .catch(async () => {
        // Falha na rede - tentar cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Se for navegação (HTML), retorna página offline
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        
        return new Response('Offline - Conteúdo não disponível', {
          status: 503,
          statusText: 'Offline',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Sincronização em segundo plano
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync:', event.tag);
  
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

// Função para sincronizar dados do jogo
async function syncGameData() {
  console.log('[ServiceWorker] Sincronizando dados do jogo...');
  
  try {
    // Aqui você pode implementar sincronização com servidor se tiver
    // Por enquanto, apenas log
    
    const cache = await caches.open(CACHE_NAME);
    const syncData = await cache.match('sync-data');
    
    if (syncData) {
      const data = await syncData.json();
      console.log('[ServiceWorker] Dados pendentes para sincronizar:', data);
      // Processar sincronização aqui
      
      // Limpar dados sincronizados
      await cache.delete('sync-data');
    }
  } catch (error) {
    console.error('[ServiceWorker] Erro na sincronização:', error);
  }
}

// Notificações push (opcional)
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push recebido:', event);
  
  const options = {
    body: 'Volte ao jogo Farmação de Aura!',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Farmação de Aura', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Versão do Service Worker
console.log('[ServiceWorker] Versão:', CACHE_NAME);