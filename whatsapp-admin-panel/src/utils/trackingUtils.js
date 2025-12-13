/**
 * Tracking Utilities - Google Ads Click ID Management
 *
 * Captura y persiste gclid/gbraid/wbraid para atribución de conversiones
 * Compatible con GDPR y políticas de privacidad
 */

export const TrackingUtils = {
  /**
   * Valida formato de Click IDs de Google
   * @param {string} value - Valor a validar
   * @param {string} type - Tipo: 'gclid', 'gbraid', 'wbraid'
   * @returns {boolean}
   */
  isValidClickId(value, type) {
    if (!value || typeof value !== 'string') return false;

    // Google Click IDs tienen formato alfanumérico con guiones/underscores, mínimo 20 caracteres
    const validFormat = /^[A-Za-z0-9_-]{20,}$/;

    switch (type) {
      case 'gclid':   // Google Click ID (Google Ads)
      case 'gbraid':  // Google Brand Click ID (iOS 14.5+)
      case 'wbraid':  // Web Brand Click ID (cross-platform)
        return validFormat.test(value);
      default:
        return false;
    }
  },

  /**
   * Captura Click IDs desde URL params
   * @param {boolean} requireConsent - Si requiere consentimiento GDPR (default: true)
   */
  captureClickIds(requireConsent = true) {
    // Verificar consentimiento si es requerido
    if (requireConsent && !this.hasStorageConsent()) {
      console.info('[Tracking] Storage consent not granted, skipping capture');
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const clickIds = {
        gclid: params.get('gclid'),
        gbraid: params.get('gbraid'),
        wbraid: params.get('wbraid')
      };

      let capturedCount = 0;

      Object.entries(clickIds).forEach(([type, value]) => {
        if (value && this.isValidClickId(value, type)) {
          this.persistClickId(type, value, requireConsent);
          capturedCount++;
        }
      });

      if (capturedCount > 0) {
        console.info(`[Tracking] Captured ${capturedCount} click ID(s)`);
      }
    } catch (error) {
      console.error('[Tracking] Error capturing click IDs:', error);
    }
  },

  /**
   * Persiste Click ID en localStorage con metadata
   * @param {string} type - Tipo de Click ID
   * @param {string} value - Valor del Click ID
   * @param {boolean} useCookies - Si debe crear cookie también
   */
  persistClickId(type, value, useCookies = true) {
    const data = {
      id: value,
      timestamp: Date.now(),
      source: 'url',
      userAgent: navigator.userAgent.substring(0, 100) // Primeros 100 chars
    };

    try {
      // localStorage (prioridad principal)
      localStorage.setItem(`last_${type}`, JSON.stringify(data));

      // Cookie 1st-party (fallback para compatibilidad)
      if (useCookies) {
        this.setCookie(`last_${type}`, value, 90);
      }
    } catch (error) {
      console.warn(`[Tracking] Could not persist ${type}:`, error.message);
    }
  },

  /**
   * Recupera el mejor Click ID disponible con prioridad
   * @param {number} maxAgeDays - Edad máxima en días (default: 90)
   * @returns {Object} { id, type, source, age }
   */
  getBestClickId(maxAgeDays = 90) {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // PRIORIDAD 1: URL params (más confiable)
    try {
      const params = new URLSearchParams(window.location.search);
      for (const type of ['gclid', 'gbraid', 'wbraid']) {
        const value = params.get(type);
        if (value && this.isValidClickId(value, type)) {
          return {
            id: value,
            type: type,
            source: 'url',
            age: 0,
            valid: true
          };
        }
      }
    } catch (error) {
      console.warn('[Tracking] Error reading URL params:', error);
    }

    // PRIORIDAD 2: localStorage propio (con validación de edad)
    for (const type of ['gclid', 'gbraid', 'wbraid']) {
      try {
        const stored = localStorage.getItem(`last_${type}`);
        if (stored) {
          const data = JSON.parse(stored);
          const ageMs = now - data.timestamp;
          const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

          // Validar edad y formato
          if (ageMs < maxAgeMs && this.isValidClickId(data.id, type)) {
            return {
              id: data.id,
              type: type,
              source: 'storage',
              age: ageDays,
              valid: true,
              originalSource: data.source
            };
          } else if (ageMs >= maxAgeMs) {
            // Limpiar click IDs expirados
            localStorage.removeItem(`last_${type}`);
            console.info(`[Tracking] Expired ${type} removed (${ageDays} days old)`);
          }
        }
      } catch (error) {
        console.warn(`[Tracking] Error reading ${type} from storage:`, error);
      }
    }

    // PRIORIDAD 3: Cookie propia
    for (const type of ['gclid', 'gbraid', 'wbraid']) {
      const value = this.getCookie(`last_${type}`);
      if (value && this.isValidClickId(value, type)) {
        return {
          id: value,
          type: type,
          source: 'cookie',
          age: null, // Cookies no tienen timestamp
          valid: true
        };
      }
    }

    // PRIORIDAD 4: Cookie de Google _gcl_aw (último recurso)
    const gclCookie = this.getCookie('_gcl_aw');
    if (gclCookie) {
      return {
        id: gclCookie,
        type: 'gcl_aw',
        source: 'google_cookie',
        age: null,
        valid: false // No validamos formato de cookies de Google
      };
    }

    // No hay Click ID disponible
    return {
      id: null,
      type: null,
      source: 'none',
      age: null,
      valid: false
    };
  },

  /**
   * Verifica si hay consentimiento para usar storage/cookies
   * @returns {boolean}
   */
  hasStorageConsent() {
    try {
      // Verifica flag global de consentimiento
      if (typeof window.cookieConsentGranted !== 'undefined') {
        return window.cookieConsentGranted === true;
      }

      // Verifica localStorage de consentimiento
      const consent = localStorage.getItem('cookie_consent');
      if (consent) {
        const data = JSON.parse(consent);
        return data.analytics === true || data.all === true;
      }

      // Sin sistema de consentimiento configurado = asumir sin restricciones
      // (cambiar a false si quieres ser más restrictivo)
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Establece consentimiento de cookies/storage
   * @param {boolean} granted - Si se otorga el consentimiento
   */
  setStorageConsent(granted) {
    try {
      window.cookieConsentGranted = granted;
      localStorage.setItem('cookie_consent', JSON.stringify({
        analytics: granted,
        timestamp: Date.now()
      }));

      if (granted) {
        console.info('[Tracking] Storage consent granted');
        // Capturar IDs si ahora hay consentimiento
        this.captureClickIds(true);
      } else {
        console.info('[Tracking] Storage consent revoked');
        // Limpiar datos existentes
        this.clearAllClickIds();
      }
    } catch (error) {
      console.error('[Tracking] Error setting consent:', error);
    }
  },

  /**
   * Limpia todos los Click IDs almacenados
   */
  clearAllClickIds() {
    const types = ['gclid', 'gbraid', 'wbraid'];
    types.forEach(type => {
      try {
        localStorage.removeItem(`last_${type}`);
        this.deleteCookie(`last_${type}`);
      } catch (error) {
        console.warn(`[Tracking] Could not clear ${type}:`, error);
      }
    });
    console.info('[Tracking] All click IDs cleared');
  },

  /**
   * Establece una cookie
   * @param {string} name - Nombre de la cookie
   * @param {string} value - Valor
   * @param {number} days - Días de expiración
   */
  setCookie(name, value, days) {
    try {
      const maxAge = days * 24 * 60 * 60;
      const secure = window.location.protocol === 'https:' ? '; secure' : '';
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
    } catch (error) {
      console.warn('[Tracking] Could not set cookie:', error);
    }
  },

  /**
   * Obtiene el valor de una cookie
   * @param {string} name - Nombre de la cookie
   * @returns {string|null}
   */
  getCookie(name) {
    try {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Elimina una cookie
   * @param {string} name - Nombre de la cookie
   */
  deleteCookie(name) {
    try {
      document.cookie = `${name}=; path=/; max-age=0`;
    } catch (error) {
      console.warn('[Tracking] Could not delete cookie:', error);
    }
  },

  /**
   * Genera URL de WhatsApp con Click ID incluido en el mensaje
   * @param {string} phone - Número de teléfono
   * @param {string} message - Mensaje base
   * @param {Object} options - Opciones { includeClickId, clickIdFormat }
   * @returns {string} URL completa de WhatsApp
   */
  generateWhatsAppURL(phone, message, options = {}) {
    const {
      includeClickId = true,
      clickIdFormat = '[ref:{id}]', // Formato del tracking en mensaje
      maxAgeDays = 90
    } = options;

    let finalMessage = message;

    if (includeClickId) {
      const clickData = this.getBestClickId(maxAgeDays);
      if (clickData.id) {
        const trackingRef = clickIdFormat
          .replace('{id}', clickData.id)
          .replace('{type}', clickData.type)
          .replace('{source}', clickData.source);

        finalMessage = `${message} ${trackingRef}`.trim();
      }
    }

    const encodedMessage = encodeURIComponent(finalMessage);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  },

  /**
   * Obtiene información de debug del tracking
   * @returns {Object}
   */
  getDebugInfo() {
    const clickData = this.getBestClickId();
    const urlParams = new URLSearchParams(window.location.search);

    return {
      currentClickId: clickData,
      urlParams: {
        gclid: urlParams.get('gclid'),
        gbraid: urlParams.get('gbraid'),
        wbraid: urlParams.get('wbraid')
      },
      storage: {
        gclid: localStorage.getItem('last_gclid'),
        gbraid: localStorage.getItem('last_gbraid'),
        wbraid: localStorage.getItem('last_wbraid')
      },
      consent: this.hasStorageConsent(),
      cookies: {
        _gcl_aw: this.getCookie('_gcl_aw')
      }
    };
  }
};

// Auto-captura al cargar (respetando consentimiento)
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      TrackingUtils.captureClickIds(true);
    });
  } else {
    TrackingUtils.captureClickIds(true);
  }
}

export default TrackingUtils;
