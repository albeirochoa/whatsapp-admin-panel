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

    // Usar nuevo sistema de tracking si está habilitado
    if (widgetConfig.enableTracking !== false) {
      var maxAge = widgetConfig.trackingMaxAgeDays || 90;
      clickData = TrackingUtils.getBestClickId(maxAge);

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

    sendWebhook({
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
    });

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
    style.textContent = '#wa-widget-container{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}.wa-widget-fab{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .3s,box-shadow .3s;background:transparent}.wa-widget-fab:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,.25)}.wa-widget-fab svg{width:60px;height:60px}.wa-widget-menu{display:none;opacity:0;transform:translateY(20px);transition:all .3s ease;position:absolute;bottom:70px;right:0;width:300px;background:#fff;border-radius:16px;box-shadow:0 5px 30px rgba(0,0,0,.2);overflow:hidden}.wa-menu-header{background:#075e54;color:#fff;padding:16px;font-weight:600;font-size:15px;display:flex;justify-content:space-between;align-items:center}.wa-menu-close{cursor:pointer;font-size:24px;line-height:1;opacity:.8}.wa-menu-close:hover{opacity:1}.wa-agents-list{max-height:300px;overflow-y:auto}.wa-agent-item{display:flex;align-items:center;padding:14px 16px;cursor:pointer;transition:background .2s;border-bottom:1px solid #f0f0f0}.wa-agent-item:hover{background:#f8f9fa}.wa-agent-item:last-child{border-bottom:none}.wa-agent-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;margin-right:12px;border:2px solid #25D366}.wa-agent-info{flex:1}.wa-agent-name{font-weight:600;color:#1a1a1a;font-size:14px}.wa-agent-role{font-size:12px;color:#666;margin-top:2px}.wa-agent-arrow{color:#25D366;font-size:20px;font-weight:700}.wa-menu-footer{background:#f8f9fa;padding:10px;text-align:center;font-size:11px;color:#888}@media (max-width:480px){.wa-widget-menu{width:calc(100vw - 40px);right:0}#wa-widget-container{bottom:15px;right:15px}}';
    document.head.appendChild(style);
  }

  function renderWidget(agents) {
    var container = document.createElement('div');
    container.id = 'wa-widget-container';

    var whatsappIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#25D366" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"/><path fill="#25D366" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"/><path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"/><path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"/><path fill="#fff" fill-rule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.475-1.225,1.543-1.502,1.859c-0.277,0.316-0.554,0.356-1.028,0.119c-0.475-0.238-2.006-0.739-3.821-2.357c-1.412-1.26-2.367-2.814-2.644-3.29c-0.277-0.475-0.03-0.732,0.208-0.968c0.213-0.213,0.475-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.475-0.791c0.158-0.316,0.079-0.593-0.04-0.831C18.963,19.292,18.036,16.953,19.268,16.045z" clip-rule="evenodd"/></svg>';

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
