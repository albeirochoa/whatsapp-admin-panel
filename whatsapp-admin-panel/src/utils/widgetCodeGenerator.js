/**
 * Generador de código del widget OPTIMIZADO
 * Lee desde JSON estático en Storage (no Firestore)
 * Esto permite escalar a millones de visitas sin costos
 */

export const generateWidgetCode = (user, selectedProject) => {
  if (!selectedProject || !user) return '';

  const userId = user.uid;
  const projectId = selectedProject.id;

  // URL del JSON estático en Firebase Storage
  const configUrl = `https://firebasestorage.googleapis.com/v0/b/whatsapp-widget-admin.firebasestorage.app/o/widgets%2F${userId}%2F${projectId}.json?alt=media`;

  return `<!-- WhatsApp Widget Optimizado - ${selectedProject.name} -->
<!-- Actualización automática desde el panel -->
<!-- 🚀 Optimizado para millones de visitas sin costos extra -->

<script>
(function() {
  'use strict';

  var CONFIG_URL = '${configUrl}';
  var widgetConfig = null;
  var widgetAgents = [];

  // ==========================================
  // TRACKING UTILITIES (Google Ads Click IDs)
  // ==========================================

  var TrackingUtils = {
    isValidClickId: function(value, type) {
      // Sin validación de formato - acepta cualquier valor no vacío
      if (!value || typeof value !== 'string') return false;
      return value.length > 0;
    },

    captureClickIds: function(requireConsent) {
      // Ignorar consentimiento - siempre captura
      try {
        var params = new URLSearchParams(window.location.search);
        var clickIds = {
          gclid: params.get('gclid'),
          gbraid: params.get('gbraid'),
          wbraid: params.get('wbraid')
        };

        for (var type in clickIds) {
          var value = clickIds[type];
          if (value && this.isValidClickId(value, type)) {
            this.persistClickId(type, value, true);
          }
        }
      } catch (e) {}
    },

    persistClickId: function(type, value, useCookies) {
      var data = {
        id: value,
        timestamp: Date.now(),
        source: 'url'
      };

      try {
        localStorage.setItem('last_' + type, JSON.stringify(data));
        if (useCookies) {
          this.setCookie('last_' + type, value, 90);
        }
      } catch (e) {}
    },

    getBestClickId: function(maxAgeDays) {
      maxAgeDays = maxAgeDays || 90;
      var maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      var now = Date.now();

      // Prioridad 1: URL params
      try {
        var params = new URLSearchParams(window.location.search);
        var types = ['gclid', 'gbraid', 'wbraid'];
        for (var i = 0; i < types.length; i++) {
          var value = params.get(types[i]);
          if (value && this.isValidClickId(value, types[i])) {
            return { id: value, type: types[i], source: 'url', age: 0 };
          }
        }
      } catch (e) {}

      // Prioridad 2: localStorage
      for (var j = 0; j < types.length; j++) {
        try {
          var stored = localStorage.getItem('last_' + types[j]);
          if (stored) {
            var data = JSON.parse(stored);
            var ageMs = now - data.timestamp;
            var ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

            if (ageMs < maxAgeMs && this.isValidClickId(data.id, types[j])) {
              return { id: data.id, type: types[j], source: 'storage', age: ageDays };
            } else if (ageMs >= maxAgeMs) {
              localStorage.removeItem('last_' + types[j]);
            }
          }
        } catch (e) {}
      }

      // Prioridad 3: Cookie propia
      for (var k = 0; k < types.length; k++) {
        var cookieValue = this.getCookie('last_' + types[k]);
        if (cookieValue && this.isValidClickId(cookieValue, types[k])) {
          return { id: cookieValue, type: types[k], source: 'cookie', age: null };
        }
      }

      // Prioridad 4: Cookie de Google (fallback legacy)
      var gclCookie = this.getCookie('_gcl_aw');
      if (gclCookie) {
        return { id: gclCookie, type: 'gcl_aw', source: 'google_cookie', age: null };
      }

      return { id: null, type: null, source: 'none', age: null };
    },

    hasStorageConsent: function() {
      try {
        if (typeof window.cookieConsentGranted !== 'undefined') {
          return window.cookieConsentGranted === true;
        }
        var consent = localStorage.getItem('cookie_consent');
        if (consent) {
          var data = JSON.parse(consent);
          return data.analytics === true || data.all === true;
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    setCookie: function(name, value, days) {
      try {
        var maxAge = days * 24 * 60 * 60;
        var secure = window.location.protocol === 'https:' ? '; secure' : '';
        document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge + '; samesite=lax' + secure;
      } catch (e) {}
    },

    getCookie: function(name) {
      try {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      } catch (e) {
        return null;
      }
    }
  };

  // Auto-captura al cargar (sin requerir consentimiento)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      TrackingUtils.captureClickIds(false);
    });
  } else {
    TrackingUtils.captureClickIds(false);
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth <= 768;
  }

  function getCurrentUrl() {
    var url = window.location.origin + window.location.pathname;
    var search = window.location.search;

    if (!search || search === '?') return url;

    var trackingParams = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid',
                          'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    var params = search.substring(1).split('&');
    var filtered = [];

    for (var i = 0; i < params.length; i++) {
      var key = params[i].split('=')[0];
      if (trackingParams.indexOf(key) === -1 && params[i]) {
        filtered.push(params[i]);
      }
    }

    return filtered.length > 0 ? url + '?' + filtered.join('&') : url;
  }

  function getGclid() {
    var match = document.cookie.match(new RegExp('(^| )_gcl_aw=([^;]+)'));
    if (match) return match[2];

    try {
      return localStorage.getItem('_gcl_aw');
    } catch (e) {
      return null;
    }
  }

  function getGclidHash() {
    var match = document.cookie.match(new RegExp('(^| )_gcl_hash=([^;]+)'));
    if (match) return match[2];

    try {
      return localStorage.getItem('_gcl_hash');
    } catch (e) {
      return null;
    }
  }

  function shouldShowOnPage(agent) {
    var currentUrl = window.location.href.toLowerCase();

    if (agent.hideOn && agent.hideOn.length > 0) {
      for (var i = 0; i < agent.hideOn.length; i++) {
        if (currentUrl.indexOf(agent.hideOn[i].toLowerCase()) !== -1) {
          return false;
        }
      }
    }

    if (!agent.showOn || agent.showOn.length === 0) return true;

    for (var j = 0; j < agent.showOn.length; j++) {
      if (currentUrl.indexOf(agent.showOn[j].toLowerCase()) !== -1) {
        return true;
      }
    }

    return false;
  }

  function isPageExcluded() {
    if (!widgetConfig || !widgetConfig.excludePages) return false;

    var excludeList = [];
    if (typeof widgetConfig.excludePages === 'string') {
      excludeList = widgetConfig.excludePages.split(',').map(function(s) {
        return s.trim();
      });
    }

    var currentPath = window.location.pathname;
    for (var i = 0; i < excludeList.length; i++) {
      if (currentPath.indexOf(excludeList[i]) !== -1) return true;
    }

    return false;
  }

  function sendWebhook(data) {
    if (!widgetConfig || !widgetConfig.webhookUrl) return;

    var payload = JSON.stringify(data);

    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: 'text/plain' });
      if (navigator.sendBeacon(widgetConfig.webhookUrl, blob)) return;
    }

    fetch(widgetConfig.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
      keepalive: true,
      credentials: 'omit'
    }).catch(function() {});
  }

  function openWhatsApp(phone, agentName) {
    var clickData = null;
    var trackingRef = '';
    var gclid = getGclid();
    var gclidHash = getGclidHash();

    console.log('[Widget Debug] Legacy tracking:', {
      gclid: gclid,
      gclidHash: gclidHash,
      _gcl_aw_cookie: TrackingUtils.getCookie('_gcl_aw'),
      _gcl_aw_localStorage: localStorage.getItem('_gcl_aw'),
      _gcl_hash_localStorage: localStorage.getItem('_gcl_hash')
    });

    // Usar nuevo sistema de tracking si está habilitado
    if (widgetConfig.enableTracking !== false) {
      var maxAge = widgetConfig.trackingMaxAgeDays || 90;
      clickData = TrackingUtils.getBestClickId(maxAge);

      console.log('[Widget Debug] New tracking system:', {
        clickData: clickData,
        last_gclid_raw: localStorage.getItem('last_gclid'),
        enableTracking: widgetConfig.enableTracking,
        maxAgeDays: maxAge,
        currentURL: window.location.href
      });

      if (clickData.id) {
        var format = widgetConfig.trackingFormat || '[ref:{id}]';
        trackingRef = format
          .replace('{id}', clickData.id)
          .replace('{type}', clickData.type)
          .replace('{source}', clickData.source);
      }
    }

    var message = (widgetConfig.message || '¡Hola! 👋') +
                  ' 📄 ' + document.title;

    if (trackingRef) {
      message += ' ' + trackingRef;
    } else if (gclidHash) {
      message += ' 📋 Ref: #' + gclidHash;
    }

    message += ' 🔗 ' + getCurrentUrl();

    var url = isMobile()
      ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message)
      : 'https://web.whatsapp.com/send?phone=' + phone + '&text=' + encodeURIComponent(message);

    if (isMobile()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }

    var webhookPayload = {
      // Campos nuevos (sistema mejorado)
      click_id: clickData ? clickData.id : null,
      click_id_type: clickData ? clickData.type : null,
      click_id_source: clickData ? clickData.source : null,
      click_id_age_days: clickData ? clickData.age : null,
      // Campos legacy (compatibilidad hacia atrás)
      gclid: gclid || null,
      gclid_hash: gclidHash || null,
      // Campos comunes
      phone_e164: phone,
      agent_selected: agentName || 'default',
      first_click_time_iso: new Date().toISOString(),
      landing_url: window.location.href,
      page_title: document.title,
      user_agent: navigator.userAgent,
      device_type: isMobile() ? 'mobile' : 'desktop',
      project_id: '${projectId}'
    };

    console.log('[Widget Debug] Webhook payload:', webhookPayload);
    sendWebhook(webhookPayload);

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'whatsapp_lead_click',
        lead_platform: 'whatsapp',
        agent_name: agentName || 'default',
        lead_traffic: (clickData && clickData.id) ? 'paid_google' : 'organic',
        lead_ref: trackingRef || 'sin_ref',
        click_id_type: clickData ? clickData.type : null
      });
    }
  }

  // ==========================================
  // CARGAR CONFIGURACIÓN (JSON ESTÁTICO)
  // ==========================================

  function loadConfig() {
    fetch(CONFIG_URL + '&t=' + Date.now()) // Cache bust
      .then(function(response) {
        if (!response.ok) throw new Error('Config not found');
        return response.json();
      })
      .then(function(data) {
        widgetConfig = data.config || {};
        widgetAgents = data.agents || [];
        initWidget();
      })
      .catch(function(error) {
        console.log('Widget no disponible:', error);
      });
  }

  // ==========================================
  // RENDERIZAR WIDGET
  // ==========================================

  function initWidget() {
    if (isPageExcluded()) return;
    if (widgetConfig.onlyMobile && !isMobile()) return;

    var availableAgents = widgetAgents.filter(shouldShowOnPage);
    if (availableAgents.length === 0) return;

    injectStyles();

    var delay = widgetConfig.delayShow || 2000;
    setTimeout(function() {
      renderWidget(availableAgents);
    }, delay);
  }

  function injectStyles() {
    if (document.getElementById('wa-widget-styles')) return;

    var style = document.createElement('style');
    style.id = 'wa-widget-styles';
    style.textContent = '#wa-widget-container{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}.wa-widget-fab{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#25D366;box-shadow:none;transition:transform .3s;animation:whatsapp-pulse 2s infinite}.wa-widget-fab:hover{transform:scale(1.1);animation:none}.wa-widget-fab svg{width:48px;height:48px;fill:#fff}.wa-widget-menu{display:none;opacity:0;transform:translateY(20px);transition:all .3s ease;position:absolute;bottom:70px;right:0;width:300px;background:#fff;border-radius:16px;box-shadow:0 5px 30px rgba(0,0,0,.2);overflow:hidden}.wa-menu-header{background:#075e54;color:#fff;padding:16px;font-weight:600;font-size:15px;display:flex;justify-content:space-between;align-items:center}.wa-menu-close{cursor:pointer;font-size:24px;line-height:1;opacity:.8}.wa-menu-close:hover{opacity:1}.wa-agents-list{max-height:300px;overflow-y:auto}.wa-agent-item{display:flex;align-items:center;padding:14px 16px;cursor:pointer;transition:background .2s;border-bottom:1px solid #f0f0f0}.wa-agent-item:hover{background:#f8f9fa}.wa-agent-item:last-child{border-bottom:none}.wa-agent-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;margin-right:12px;border:2px solid #25D366}.wa-agent-info{flex:1}.wa-agent-name{font-weight:600;color:#1a1a1a;font-size:14px}.wa-agent-role{font-size:12px;color:#666;margin-top:2px}.wa-agent-arrow{color:#25D366;font-size:20px;font-weight:700}.wa-menu-footer{background:#f8f9fa;padding:10px;text-align:center;font-size:11px;color:#888}@keyframes whatsapp-pulse{0%{transform:scale(1);box-shadow:0 0 0 0 rgba(37,211,102,0.7);}50%{transform:scale(1.05);box-shadow:0 0 0 10px rgba(37,211,102,0.2);}100%{transform:scale(1);box-shadow:0 0 0 20px rgba(37,211,102,0);}}@media (max-width:480px){.wa-widget-menu{width:calc(100vw - 40px);right:0}#wa-widget-container{bottom:15px;right:15px}}';
    document.head.appendChild(style);
  }

  function renderWidget(agents) {
    var container = document.createElement('div');
    container.id = 'wa-widget-container';

    var whatsappIcon = '<svg width="48" height="48" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M16 3C9.373 3 4 8.373 4 15c0 2.319.64 4.492 1.855 6.41L4 28l6.764-1.791A12.93 12.93 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3Zm0 22.285c-1.967 0-3.887-.555-5.558-1.605l-.4-.25-4.008 1.061 1.07-3.944-.262-.404A10.22 10.22 0 0 1 5.714 15c0-5.656 4.63-10.285 10.286-10.285 5.657 0 10.286 4.629 10.286 10.285 0 5.657-4.629 10.286-10.286 10.286Zm6.018-7.75c-.329-.164-1.947-.96-2.25-1.07-.303-.112-.525-.164-.747.164-.22.328-.859 1.07-1.053 1.293-.194.22-.388.246-.716.082-.329-.164-1.389-.512-2.647-1.632-.98-.87-1.64-1.946-1.835-2.274-.194-.328-.02-.504.145-.668.15-.15.329-.388.492-.582.164-.194.219-.328.329-.547.11-.22.055-.41-.027-.582-.082-.164-.747-1.804-1.026-2.472-.27-.65-.546-.561-.747-.571l-.64-.01c-.22 0-.582.082-.885.41-.303.328-1.162 1.135-1.162 2.77 0 1.635 1.19 3.215 1.356 3.441.164.22 2.344 3.572 5.68 5 .794.342 1.412.546 1.895.7.796.253 1.52.218 2.093.132.638-.095 1.946-.796 2.223-1.566.273-.77.273-1.43.191-1.566-.082-.137-.303-.22-.633-.383Z"/></svg>';

    if (agents.length === 1) {
      // Un solo agente
      container.innerHTML = '<div class="wa-widget-fab" id="wa-widget-btn">' + whatsappIcon + '</div>';
      document.body.appendChild(container);

      document.getElementById('wa-widget-btn').addEventListener('click', function() {
        openWhatsApp(agents[0].phone, agents[0].name);
      });
    } else {
      // Múltiples agentes - menú
      var agentsHtml = '';
      for (var i = 0; i < agents.length; i++) {
        var agent = agents[i];
        agentsHtml += '<div class="wa-agent-item" data-phone="' + agent.phone + '" data-name="' + agent.name + '">' +
          '<img src="' + (agent.photo || 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png') + '" class="wa-agent-avatar">' +
          '<div class="wa-agent-info">' +
          '<div class="wa-agent-name">' + agent.name + '</div>' +
          '<div class="wa-agent-role">' + (agent.role || '') + '</div>' +
          '</div>' +
          '<div class="wa-agent-arrow">›</div>' +
          '</div>';
      }

      container.innerHTML = '<div class="wa-widget-fab" id="wa-widget-btn">' + whatsappIcon + '</div>' +
        '<div class="wa-widget-menu" id="wa-widget-menu">' +
        '<div class="wa-menu-header">' +
        '<span>Iniciar conversación</span>' +
        '<span class="wa-menu-close" id="wa-menu-close">×</span>' +
        '</div>' +
        '<div class="wa-agents-list">' + agentsHtml + '</div>' +
        '<div class="wa-menu-footer">Solemos responder en minutos</div>' +
        '</div>';

      document.body.appendChild(container);

      document.getElementById('wa-widget-btn').addEventListener('click', function() {
        var menu = document.getElementById('wa-widget-menu');
        if (menu.style.display === 'block') {
          menu.style.display = 'none';
          menu.style.opacity = '0';
        } else {
          menu.style.display = 'block';
          setTimeout(function() {
            menu.style.opacity = '1';
            menu.style.transform = 'translateY(0)';
          }, 10);
        }
      });

      document.getElementById('wa-menu-close').addEventListener('click', function() {
        document.getElementById('wa-widget-menu').style.display = 'none';
      });

      var agentItems = document.querySelectorAll('.wa-agent-item');
      for (var j = 0; j < agentItems.length; j++) {
        agentItems[j].addEventListener('click', function() {
          var phone = this.getAttribute('data-phone');
          var name = this.getAttribute('data-name');
          openWhatsApp(phone, name);
          document.getElementById('wa-widget-menu').style.display = 'none';
        });
      }
    }
  }

  // ==========================================
  // INIT
  // ==========================================

  loadConfig();

})();
<\/script>`;
};
