// RecaptchaWidget.js
const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" }, // devuelve el token del CAPTCHA
  category: { id: "custom.security", label: "Widgets personalizados" }, // Paleta “Seguridad”
  iconClassName: "recaptcha-icon", // icono (FontAwesome)
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

    // Creamos el contenedor si no existe
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    let token = "";

    // Función robusta para renderizar con reintento si grecaptcha o el contenedor no están listos
    function renderRecaptcha(attempt = 0) {
      const MAX_ATTEMPTS = 10;
      const DELAY_MS = 500;

      const captchaContainer = document.getElementById(widgetId);

      if (!captchaContainer) {
        console.warn(
          `Intento ${attempt}: Contenedor con ID '${widgetId}' aún no disponible`
        );
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
              eventManager.fireEvent("onChange"); // Notifica a Leap que hubo un cambio
            },
          });
        } catch (e) {
          console.error("Error al renderizar reCAPTCHA:", e.message);
        }
      } else {
        console.warn(`Intento ${attempt}: grecaptcha aún no está disponible`);
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
        }
      }
    }

    // Si grecaptcha ya está en la ventana, renderizamos de inmediato
    if (window.grecaptcha && grecaptcha.render) {
      renderRecaptcha();
    } else {
      // Cargamos el script de reCAPTCHA dinámicamente
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
        // Si ya existe pero no ha cargado, intentamos en bucle
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
        if ((val === "" || val == null) && initialProps.required) {
          return "Por favor, verifica el reCAPTCHA";
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
    };
  },
};
// Registrar el widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
