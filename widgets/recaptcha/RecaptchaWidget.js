// RecaptchaWidget.js
const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" }, // devuelve el token del CAPTCHA
  category: { id: "custom.security", label: "Avanzado" }, // Paleta “Seguridad”
  iconClassName: "fa fa-shield-alt", // icono (FontAwesome)
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
    const container = document.createElement("div");
    container.id = widgetId;
    domNode.appendChild(container);

    let token = "";

    function renderRecaptcha() {
      const captchaContainer = document.getElementById(widgetId);
      if (!captchaContainer) {
        console.error("No se encontró el contenedor con ID:", widgetId);
        return;
      }

      if (window.grecaptcha) {
        window.grecaptcha.render(widgetId, {
          sitekey: initialProps.siteKey,
          callback: function (responseToken) {
            token = responseToken;
            eventManager.fireEvent("onChange"); // Notifica a Leap que hubo un cambio
          },
        });
      }
    }

    if (window.grecaptcha) {
      renderRecaptcha();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = renderRecaptcha;
      document.head.appendChild(script);
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
              window.grecaptcha.reset();
            } catch (e) {
              console.warn("Intento de reset fallido:", e.message);
            }
            renderRecaptcha();
          }
        }
      },
    };
  },
};
// Registrar el widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
