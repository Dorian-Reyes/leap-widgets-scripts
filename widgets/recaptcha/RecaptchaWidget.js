// RecaptchaWidget.js
const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" },
  category: { id: "custom.security", label: "Widgets personalizados" },
  iconClassName: "recaptcha-icon",
  builtInProperties: [{ id: "required" }, { id: "title" }],
  properties: [
    {
      id: "siteKey",
      label: "Clave del sitio (SiteKey)",
      propType: "string",
      defaultValue: "6Ld6zxArAAAAAPDYDDPDAOfjpZguznwnM8m5W7vd",
    },
  ],

  instantiate: function (context, domNode, initialProps, eventManager) {
    // --- Variables internas ---
    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));
    let token = "";
    let container = null;

    // --- Método obligatorio _init ---
    function _init() {
      container = document.getElementById(widgetId);
      if (!container) {
        container = document.createElement("div");
        container.id = widgetId;
        domNode.appendChild(container);
      }
      _renderRecaptcha();
    }

    // --- Renderizado robusto de reCAPTCHA ---
    function _renderRecaptcha(attempt = 0) {
      const MAX_ATTEMPTS = 10;
      const DELAY_MS = 500;

      if (!container) return;

      if (window.grecaptcha && grecaptcha.render) {
        try {
          grecaptcha.render(widgetId, {
            sitekey: initialProps.siteKey,
            callback: function (responseToken) {
              token = responseToken;
              eventManager.fireEvent("onChange");
            },
          });
        } catch (e) {
          console.error("Error al renderizar reCAPTCHA:", e.message);
        }
      } else if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => _renderRecaptcha(attempt + 1), DELAY_MS);
      }
    }

    // --- Cargar script si no existe ---
    const existingScript = document.querySelector(
      "script[src*='recaptcha/api.js']"
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = _init;
      document.head.appendChild(script);
    } else {
      _init();
    }

    // --- Instancia final que devuelve Leap ---
    return {
      _init, // Obligatorio
      getValue: () => token,
      setValue: (val) => {
        token = val;
      },
      validateValue: (val) => {
        if ((val === "" || val == null) && initialProps.required) {
          return "Por favor, verifica el reCAPTCHA";
        }
        // null indica que el valor es válido según la doc de Leap
        return null;
      },

      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          if (window.grecaptcha && container) {
            try {
              grecaptcha.reset();
              _renderRecaptcha();
            } catch (e) {
              console.warn("Intento de reset fallido:", e.message);
            }
          }
        }
      },
    };
  },
};

// Registrar widget
nitro.registerWidget(recaptchaWidgetDefinition);
