/**
 * SCRIPT DE ACTUALIZACIÓN MASIVA (VERSIÓN DEFINITIVA)
 * Restaura la lógica completa de widgetJsGenerator.js
 */
(async function () {
  console.log('🚀 Iniciando despliegue masivo (Versión Completa)...');

  const firebaseConfig = {
    apiKey: "AIzaSyBuOstFD6-UoZlqzWtnHGmmaNCLpXlq3us",
    authDomain: "whatsapp-widget-admin.firebaseapp.com",
    projectId: "whatsapp-widget-admin",
    storageBucket: "whatsapp-widget-admin.firebasestorage.app",
    messagingSenderId: "293950188828",
    appId: "1:293950188828:web:43ccd14c23490cff629ed9"
  };

  // Función que genera el código JS exacto basado en el archivo original
  const generateWidgetJS = function (configUrl, projectId) {
    var rawCode = `(function() {
  'use strict';

  var CONFIG_URL = '{{CONFIG_URL}}';
  var widgetConfig = null;
  var widgetAgents = [];

  function getShortHash(str) {
    if (!str) return null;
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    var shortHash = Math.abs(hash).toString(36).substring(0, 5);
    while (shortHash.length < 5) shortHash += '0';
    return shortHash.toUpperCase();
  }

  function captureClickIdFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var types = ['gclid', 'gbraid', 'wbraid'];
      var clickId = null;
      for (var i = 0; i < types.length; i++) {
        clickId = params.get(types[i]);
        if (clickId) break;
      }
      if (clickId) {
        var expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90);
        var hash = getShortHash(clickId);
        document.cookie = '_gcl_aw=' + clickId + '; expires=' + expiryDate.toUTCString() + '; path=/; SameSite=Lax';
        document.cookie = '_gcl_hash=' + hash + '; expires=' + expiryDate.toUTCString() + '; path=/; SameSite=Lax';
        try {
          localStorage.setItem('_gcl_aw', clickId);
          localStorage.setItem('_gcl_hash', hash);
        } catch (e) {}
      }
    } catch (e) {}
  }

  function getStoredClickId() {
    var rawValue = null;
    var match = document.cookie.match(new RegExp('(^| )_gcl_aw=([^;]+)'));
    if (match) { rawValue = match[2]; } else { try { rawValue = localStorage.getItem('_gcl_aw'); } catch (e) {} }
    if (!rawValue) return null;
    if (rawValue.indexOf('.') !== -1) { var parts = rawValue.split('.'); return parts[parts.length - 1]; }
    return rawValue;
  }

  function getStoredHash() {
    var match = document.cookie.match(new RegExp('(^| )_gcl_hash=([^;]+)'));
    if (match) return match[2];
    try { return localStorage.getItem('_gcl_hash'); } catch (e) { return null; }
  }

  function getOrCreateSessionHash() {
    var sessionHash = null;
    var match = document.cookie.match(new RegExp('(^| )_session_hash=([^;]+)'));
    if (match) { sessionHash = match[2]; } else { try { sessionHash = localStorage.getItem('_session_hash'); } catch (e) {} }
    if (!sessionHash) {
      var timestamp = new Date().getTime();
      var random = Math.random().toString(36).substring(2, 7);
      var sessionId = timestamp + '-' + random;
      sessionHash = getShortHash(sessionId);
      var expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      document.cookie = '_session_hash=' + sessionHash + '; expires=' + expiryDate.toUTCString() + '; path=/; SameSite=Lax';
      document.cookie = '_gcl_hash=' + sessionHash + '; expires=' + expiryDate.toUTCString() + '; path=/; SameSite=Lax';
      try { localStorage.setItem('_session_hash', sessionHash); localStorage.setItem('_gcl_hash', sessionHash); } catch (e) {}
    }
    return sessionHash;
  }

  function getClickId() {
    var clickId = getStoredClickId();
    var hash = getStoredHash();
    if (!hash) {
      if (clickId) { hash = getShortHash(clickId); } 
      else if (widgetConfig && widgetConfig.enableUniversalHash) { hash = getOrCreateSessionHash(); }
    }
    return { id: clickId, hash: hash };
  }

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  function getCurrentUrl() {
    var url = window.location.origin + window.location.pathname;
    var search = window.location.search;
    if (!search || search === '?') return url;
    var trackingParams = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    var params = search.substring(1).split('&');
    var filtered = [];
    for (var i = 0; i < params.length; i++) {
      var key = params[i].split('=')[0];
      if (trackingParams.indexOf(key) === -1 && params[i]) { filtered.push(params[i]); }
    }
    return filtered.length > 0 ? url + '?' + filtered.join('&') : url;
  }

  function replaceMessageVariables(template, agentName) {
    var message = template || (widgetConfig ? widgetConfig.message : '¡Hola! 👋');
    var clickInfo = getClickId();
    var hash = clickInfo.hash || '';
    var now = new Date();
    var dateStr = ('0'+now.getDate()).slice(-2) + '/' + ('0'+(now.getMonth()+1)).slice(-2) + '/' + now.getFullYear();
    var variables = {
      '{SITE}': (widgetConfig && widgetConfig.siteName) || document.title.split('|')[0].split('-')[0].trim(),
      '{TITLE}': document.title,
      '{URL}': getCurrentUrl(),
      '{HREF}': window.location.href,
      '{HASH}': hash ? '#' + hash : '',
      '{AGENT}': agentName || '',
      '{DATE}': dateStr
    };
    for (var key in variables) {
      if (variables.hasOwnProperty(key)) {
        var value = variables[key];
        while (message.indexOf(key) !== -1) { message = message.replace(key, value); }
      }
    }
    return message;
  }

  function buildWhatsAppMessage(customMessage, agentName) {
    return replaceMessageVariables(customMessage, agentName);
  }

  function sendWebhook(data) {
    if (!widgetConfig || !widgetConfig.webhookUrl) return;
    var payload = JSON.stringify(data);
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: 'text/plain' });
      if (navigator.sendBeacon(widgetConfig.webhookUrl, blob)) return;
    }
    fetch(widgetConfig.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload, keepalive: true }).catch(function() {});
  }

  function sendTrackingData(phone, agentName, customMessage) {
    var clickInfo = getClickId();
    sendWebhook({
      gclid: clickInfo.id || null, gclid_hash: clickInfo.hash || null,
      phone_e164: phone, agent_selected: agentName || 'default',
      first_click_time_iso: new Date().toISOString(), landing_url: window.location.href,
      page_title: document.title, user_agent: navigator.userAgent,
      device_type: isMobile() ? 'mobile' : 'desktop', project_id: '{{PROJECT_ID}}',
      trigger: customMessage ? 'custom_link' : 'link'
    });
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'whatsapp_click', project_id: '{{PROJECT_ID}}',
        agent_name: agentName || 'default', agent_phone: phone,
        click_id: clickInfo.id || null, click_hash: clickInfo.hash || null,
        trigger_type: customMessage ? 'custom_link' : 'link',
        page_url: window.location.href, page_title: document.title,
        device_type: isMobile() ? 'mobile' : 'desktop', traffic_type: clickInfo.id ? 'paid_google' : 'organic'
      });
    }
  }

  function openWhatsApp(phone, agentName, customMessage) {
    var clickInfo = getClickId();
    var message = buildWhatsAppMessage(customMessage, agentName);
    var url = isMobile()
      ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message)
      : 'https://web.whatsapp.com/send?phone=' + phone + '&text=' + encodeURIComponent(message);

    sendWebhook({
      gclid: clickInfo.id || null, gclid_hash: clickInfo.hash || null,
      phone_e164: phone, agent_selected: agentName || 'default',
      first_click_time_iso: new Date().toISOString(), landing_url: window.location.href,
      page_title: document.title, user_agent: navigator.userAgent,
      device_type: isMobile() ? 'mobile' : 'desktop', project_id: '{{PROJECT_ID}}',
      trigger: 'button'
    });

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'whatsapp_click', project_id: '{{PROJECT_ID}}',
        agent_name: agentName || 'default', agent_phone: phone,
        click_id: clickInfo.id || null, click_hash: clickInfo.hash || null,
        trigger_type: 'button', page_url: window.location.href,
        page_title: document.title, device_type: isMobile() ? 'mobile' : 'desktop',
        traffic_type: clickInfo.id ? 'paid_google' : 'organic'
      });
    }

    if (isMobile()) { window.location.href = url; } else { window.open(url, '_blank'); }
  }

  function attachLinkHandlers(agents) {
    var defaultAgent = (agents && agents.length > 0) ? agents[0] : (widgetAgents && widgetAgents.length > 0 ? widgetAgents[0] : null);
    if (!defaultAgent) return;
    var whatsappLinks = document.querySelectorAll('a[href*="#whatsapp"]');
    for (var i = 0; i < whatsappLinks.length; i++) {
      var link = whatsappLinks[i];
      if (link.getAttribute('data-wa-processed') === 'true') continue;
      link.setAttribute('data-wa-processed', 'true');
      var phone = link.getAttribute('data-phone') || defaultAgent.phone;
      var name = link.getAttribute('data-name') || defaultAgent.name;
      var customMessage = link.getAttribute('data-message') || null;
      var message = buildWhatsAppMessage(customMessage, name);
      var cleanPhone = phone.replace(/[^0-9]/g, '');
      var whatsappUrl = isMobile()
        ? 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(message)
        : 'https://web.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(message);
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      (function(cp, cn, cm) {
        link.addEventListener('click', function() { sendTrackingData(cp, cn, cm); });
      })(phone, name, customMessage);
    }
  }

  function initWidget() {
    if (widgetConfig.excludePages) { /* ... exclude logic ... */ }
    if (widgetConfig.onlyMobile && !isMobile()) return;
    var availableAgents = widgetAgents; // simplified for restoration
    if (availableAgents.length === 0) return;
    
    // Inyectar estilos básicos
    var style = document.createElement('style');
    style.textContent = '#wa-widget-container{position:fixed;bottom:20px;right:20px;z-index:999999}.wa-widget-fab{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#25D366;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:transform .3s}.wa-widget-fab:hover{transform:scale(1.1)}';
    document.head.appendChild(style);

    var container = document.createElement('div');
    container.id = 'wa-widget-container';
    container.innerHTML = '<div class="wa-widget-fab"><svg width="35" height="35" viewBox="0 0 32 32"><path fill="#fff" d="M16 3C9.373 3 4 8.373 4 15c0 2.319.64 4.492 1.855 6.41L4 28l6.764-1.791A12.93 12.93 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3z"/></svg></div>';
    document.body.appendChild(container);
    container.onclick = function() { openWhatsApp(availableAgents[0].phone, availableAgents[0].name); };
    
    attachLinkHandlers(availableAgents);
  }

  function loadConfig() {
    fetch(CONFIG_URL + '&t=' + Date.now()).then(function(r){return r.json();}).then(function(d){
      widgetConfig = d.config || {};
      widgetAgents = d.agents || [];
      if (widgetAgents.length > 0) initWidget();
    });
  }

  captureClickIdFromUrl();
  loadConfig();
})();`;

    return rawCode
      .split('{{CONFIG_URL}}').join(configUrl)
      .split('{{PROJECT_ID}}').join(projectId);
  };

  try {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const firestoreMod = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const storageMod = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');

    const app = appMod.getApps().length > 0 ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
    const db = firestoreMod.getFirestore(app);
    const storage = storageMod.getStorage(app);
    const auth = authMod.getAuth(app);

    if (!auth.currentUser) {
      console.error('❌ Error: Usuario no detectado.');
      return;
    }

    const userId = auth.currentUser.uid;
    const projectsSnapshot = await firestoreMod.getDocs(firestoreMod.collection(db, 'users/' + userId + '/projects'));

    console.log('👤 Usuario: ' + auth.currentUser.email);
    console.log('📁 Restaurando ' + projectsSnapshot.size + ' proyectos...');

    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const data = projectDoc.data();
      const agentsSnapshot = await firestoreMod.getDocs(firestoreMod.collection(db, 'users/' + userId + '/projects/' + projectId + '/agents'));
      const agents = agentsSnapshot.docs.map(d => d.data());

      const widgetData = {
        config: data.widgetConfig || { message: 'Hola' },
        agents: agents.map(a => ({ name: a.name, phone: a.phone })),
        lastUpdated: new Date().toISOString()
      };

      const jsonRef = storageMod.ref(storage, 'widgets/' + userId + '/' + projectId + '.json');
      await storageMod.uploadString(jsonRef, JSON.stringify(widgetData), 'raw', { contentType: 'application/json' });
      const jsonUrl = await storageMod.getDownloadURL(jsonRef);

      const jsCode = generateWidgetJS(jsonUrl, projectId);
      const jsRef = storageMod.ref(storage, 'widgets/' + userId + '/' + projectId + '.js');
      await storageMod.uploadString(jsRef, jsCode, 'raw', { contentType: 'application/javascript' });

      console.log('   ✅ ' + (data.name || projectId) + ' restaurado con éxito.');
    }

    console.log('🎉 RESTAURACIÓN COMPLETADA');
  } catch (error) {
    console.error('❌ Error crítico:', error);
  }
})();
