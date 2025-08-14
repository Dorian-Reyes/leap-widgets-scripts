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
    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));
    let token = "";
    let container = document.getElementById(widgetId);

    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    function renderRecaptcha(attempt = 0) {
      const MAX_ATTEMPTS = 10;
      const DELAY_MS = 500;

      if (!container) {
        if (attempt < MAX_ATTEMPTS)
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
        return;
      }

      if (window.grecaptcha && grecaptcha.render) {
        try {
          grecaptcha.render(widgetId, {
            sitekey: initialProps.siteKey,
            callback: function (responseToken) {
              token = responseToken;
              eventManager.fireEvent("onChange"); // Leap reevalúa el estado
            },
          });
        } catch (e) {
          console.error("Error al renderizar reCAPTCHA:", e.message);
        }
      } else if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
      }
    }

    // Cargar script de reCAPTCHA
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

    return {
      getValue: () => token,
      setValue: (val) => {
        token = val;
      },
      validateValue: () => {
        if (!token || token.trim() === "") {
          // Aunque Leap diga que no es requerido, bloqueamos si no hay token
          return "Por favor, verifica el reCAPTCHA";
        }
        // Token presente → campo válido
        return null;
      },
      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          if (window.grecaptcha && container) {
            try {
              grecaptcha.reset();
              renderRecaptcha();
            } catch (e) {
              console.warn("Intento de reset fallido:", e.message);
            }
          }
        }
      },
      setRequired: (isRequired) => {
        initialProps.required = isRequired;
      },
    };
  },
};

// Registrar widget
nitro.registerWidget(recaptchaWidgetDefinition);
