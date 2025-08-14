// RecaptchaWidget.js
const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" }, // El token será un string
  category: { id: "custom.security", label: "Widgets personalizados" },
  iconClassName: "recaptcha-icon",

  // Solo propiedades internas de Leap: required y título
  builtInProperties: [{ id: "required" }, { id: "title" }],

  // No exponemos siteKey ni token en propiedades
  properties: [],

  instantiate: function (context, domNode, initialProps, eventManager) {
    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));

    // Clave del sitio quemada
    const SITE_KEY = "6Ld6zxArAAAAAPDYDDPDAOfjpZguznwnM8m5W7vd";

    // Contenedor del CAPTCHA
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    // Variable para almacenar el token
    let token = "";

    /**
     * Renderiza el reCAPTCHA con reintentos si aún no está listo
     */
    function renderRecaptcha(attempt = 0) {
      const MAX_ATTEMPTS = 10;
      const DELAY_MS = 500;

      const captchaContainer = document.getElementById(widgetId);
      if (!captchaContainer) {
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
        }
        return;
      }

      if (window.grecaptcha && grecaptcha.render) {
        try {
          grecaptcha.render(widgetId, {
            sitekey: SITE_KEY,
            callback: function (responseToken) {
              token = responseToken; // Guardamos token recibido
              eventManager.fireEvent("onChange"); // Notifica a Leap que cambió el valor
            },
            "expired-callback": function () {
              token = ""; // Resetea si expira
              eventManager.fireEvent("onChange");
            },
          });
        } catch (e) {
          console.error("Error al renderizar reCAPTCHA:", e.message);
        }
      } else if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
      }
    }

    /**
     * Carga el script de reCAPTCHA si no está presente
     */
    function loadRecaptchaScript() {
      const existingScript = document.querySelector(
        "script[src*='recaptcha/api.js']"
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => renderRecaptcha();
        document.head.appendChild(script);
      } else {
        renderRecaptcha();
      }
    }

    // Inicializa
    if (window.grecaptcha && grecaptcha.render) {
      renderRecaptcha();
    } else {
      loadRecaptchaScript();
    }

    // API que Leap espera de un widget con valor
    return {
      getValue: function () {
        return token;
      },
      setValue: function (val) {
        token = val;
      },
      validateValue: function (val) {
        if ((!val || val === "") && initialProps.required) {
          return "Por favor, verifica el reCAPTCHA";
        }
        return true;
      },
      setProperty: function () {
        // No necesitamos reaccionar a propiedades, ya que no hay configurables
      },
    };
  },
};

// Registrar el widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
