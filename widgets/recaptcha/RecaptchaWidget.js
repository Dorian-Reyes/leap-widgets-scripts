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
    const widgetId = "recaptcha_" + (context.dataId || Date.now());
    const container = document.createElement("div");
    container.id = widgetId;
    domNode.appendChild(container);

    let token = "";
    let recaptchaWidgetId = null;

    function renderRecaptcha() {
      const recaptchaContainer = document.getElementById(widgetId);
      if (window.grecaptcha && recaptchaContainer) {
        try {
          recaptchaWidgetId = window.grecaptcha.render(widgetId, {
            sitekey: initialProps.siteKey,
            callback: function (responseToken) {
              token = responseToken;
            },
            "expired-callback": function () {
              token = "";
            },
            "error-callback": function () {
              console.error("Error al cargar reCAPTCHA");
              token = "";
            },
          });
        } catch (err) {
          console.error("Error al renderizar reCAPTCHA:", err);
        }
      } else {
        console.error(
          "No se pudo encontrar el contenedor para reCAPTCHA o grecaptcha no está disponible."
        );
      }
    }

    function loadRecaptchaScript() {
      if (!window.grecaptcha) {
        const script = document.createElement("script");
        script.src =
          "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadCallback&render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        renderRecaptcha();
      }
    }

    // Callback global para cuando se carga reCAPTCHA
    window.onRecaptchaLoadCallback = function () {
      renderRecaptcha();
    };

    loadRecaptchaScript();

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
          if (window.grecaptcha && recaptchaWidgetId !== null) {
            try {
              window.grecaptcha.reset(recaptchaWidgetId);
              renderRecaptcha();
            } catch (e) {
              console.error("Error al resetear reCAPTCHA:", e);
            }
          }
        }
      },
    };
  },
};

// Registrar el widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
