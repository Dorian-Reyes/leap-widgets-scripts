const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" }, // devuelve el token del CAPTCHA
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
        console.warn(
          `[reCAPTCHA] Intento ${attempt}: Contenedor '${widgetId}' aún no disponible`
        );
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
        }
        return;
      }

      if (window.grecaptcha && grecaptcha.render) {
        try {
          console.log("[reCAPTCHA] Renderizando captcha en", widgetId);
          grecaptcha.render(widgetId, {
            sitekey: initialProps.siteKey,
            callback: function (responseToken) {
              token = responseToken;
              console.log("[reCAPTCHA] callback ejecutado, token =", token);
              eventManager.fireEvent("onChange");
              console.log("[reCAPTCHA] onChange disparado después de validar");
            },
          });
        } catch (e) {
          console.error("[reCAPTCHA] Error al renderizar:", e.message);
        }
      } else {
        console.warn(
          `[reCAPTCHA] Intento ${attempt}: grecaptcha aún no disponible`
        );
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
        console.log("[reCAPTCHA] Cargando script api.js dinámicamente");
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log("[reCAPTCHA] Script cargado, renderizando...");
          renderRecaptcha();
        };
        document.head.appendChild(script);
      } else {
        renderRecaptcha();
      }
    }

    return {
      getValue: function () {
        console.log("[reCAPTCHA] getValue() llamado, valor =", token);
        return token;
      },
      setValue: function (val) {
        token = val;
        console.log("[reCAPTCHA] setValue() llamado, nuevo valor =", token);
        eventManager.fireEvent("onChange");
        console.log("[reCAPTCHA] onChange disparado desde setValue()");
      },
      validateValue: function (val) {
        console.log(
          "[reCAPTCHA] validateValue() llamado, val =",
          val,
          "required =",
          initialProps.required
        );
        if ((val === "" || val == null) && initialProps.required) {
          console.warn("[reCAPTCHA] Validación fallida: campo requerido vacío");
          return "Por favor, verifica el reCAPTCHA";
        }
        console.log("[reCAPTCHA] Validación exitosa");
        return null; // importante: null significa válido
      },
      setProperty: function (propName, propValue) {
        console.log(
          `[reCAPTCHA] setProperty() llamado para ${propName} = ${propValue}`
        );
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          const captchaContainer = document.getElementById(widgetId);
          if (window.grecaptcha && captchaContainer) {
            try {
              grecaptcha.reset();
              renderRecaptcha();
              console.log("[reCAPTCHA] Captcha reseteado y re-renderizado");
            } catch (e) {
              console.warn("[reCAPTCHA] Reset fallido:", e.message);
            }
          }
        }
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
