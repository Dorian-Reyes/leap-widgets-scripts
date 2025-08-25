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
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }
    let token = "";

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
            sitekey: initialProps.siteKey,
            callback: function (responseToken) {
              token = responseToken;
              // El evento onChange notifica al formulario que el valor ha cambiado
              // Esto hace que Leap dispare la revalidación.
              eventManager.fireEvent("onChange");
            },
            "expired-callback": function () {
              // Maneja la expiración del token de reCAPTCHA
              token = "";
              eventManager.fireEvent("onChange");
            },
            "error-callback": function () {
              // Maneja un error en reCAPTCHA
              token = "";
              eventManager.fireEvent("onChange");
            },
          });
        } catch (e) {
          console.error("Error al renderizar reCAPTCHA:", e.message);
        }
      } else {
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
        }
      }
    }

    if (window.grecaptcha && grecaptcha.render) {
      renderRecaptcha();
    } else {
      const existingScript = document.querySelector(
        "script[src*='recaptcha/api.js']"
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderRecaptcha();
        };
        document.head.appendChild(script);
      } else {
        renderRecaptcha();
      }
    }

    return {
      getValue: function () {
        return token;
      },
      setValue: function (val) {
        token = val;
      },
      validateValue: function (val) {
        // La validación se basa en si hay un token válido.
        if (initialProps.required && (!val || val.length === 0)) {
          return "Por favor, verifica el reCAPTCHA.";
        }
        return true;
      },
      setProperty: function (propName, propValue) {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          const captchaContainer = document.getElementById(widgetId);
          if (window.grecaptcha && captchaContainer) {
            try {
              grecaptcha.reset();
              renderRecaptcha();
            } catch (e) {
              console.warn("Intento de reset fallido:", e.message);
            }
          }
        }
      },
      getJSAPIFacade: function () {
        return {
          __self: this,
          reset: function () {
            grecaptcha.reset();
            this.__self.setValue("");
            eventManager.fireEvent("onChange");
          },
        };
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
