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
      defaultValue: "",
    },
    {
      id: "token",
      label: "Token del captcha",
      propType: "string",
      defaultValue: "",
    },
  ],

  instantiate: function (context, domNode, initialProps, eventManager) {
    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));

    let token = "";
    let errorFn = null;

    // Crear contenedor
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    // Renderizar reCAPTCHA
    function renderRecaptcha(attempt = 0) {
      const MAX = 10,
        DELAY = 500;

      if (!container) return;
      if (!window.grecaptcha || !grecaptcha.render) {
        if (attempt < MAX) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY);
        }
        return;
      }

      try {
        grecaptcha.render(widgetId, {
          sitekey: initialProps.siteKey,
          callback: function (responseToken) {
            token = responseToken;
            initialProps.token = token;

            // Token recibido → limpiar error
            if (errorFn) errorFn(null);

            // Notificar a LEAP
            eventManager.fireEvent("onChange");
          },
        });
      } catch (e) {
        console.error("Error al render reCAPTCHA:", e.message);
      }
    }

    // Cargar script si no existe
    const existing = document.querySelector("script[src*='recaptcha/api.js']");
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => renderRecaptcha();
      document.head.appendChild(script);
    } else {
      renderRecaptcha();
    }

    return {
      getValue: () => token,

      setValue: (val) => {
        token = val;
        initialProps.token = val;
      },

      validateValue: () => {
        if (initialProps.required && (!token || token.trim() === "")) {
          if (errorFn) errorFn("Por favor verifica el reCAPTCHA");
          return "Por favor verifica el reCAPTCHA";
        }

        if (errorFn) errorFn(null);
        return null;
      },

      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          if (window.grecaptcha && container) {
            try {
              grecaptcha.reset();
              renderRecaptcha();
            } catch (e) {}
          }
        }
      },

      setRequired: (r) => {
        initialProps.required = r;
      },

      setErrorMessage: (fn) => {
        errorFn = fn;
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
