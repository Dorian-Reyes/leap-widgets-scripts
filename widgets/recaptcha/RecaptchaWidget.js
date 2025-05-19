const recaptchaWidgetDefinition = {
  id: "custom.recaptcha",
  version: "1.0.0",
  apiVersion: "1.0.0",
  label: "reCAPTCHA",
  description: "Componente de reCAPTCHA de Google para validar humanos",
  datatype: {
    type: "string",
  },
  category: {
    id: "custom.widgets",
    label: "Custom Widgets",
  },
  iconClassName: "custom-recaptcha-icon",
  builtInProperties: ["title", "required"],
  properties: [
    {
      name: "siteKey",
      label: "Site Key",
      type: "string",
      help: "Clave pública de tu cuenta de reCAPTCHA",
    },
  ],

  instantiate: function (context) {
    const { domNode, initialProps, eventManager, dataId } = context;

    const widgetId = "recaptcha_" + (dataId || Date.now());
    const container = document.createElement("div");
    container.id = widgetId;
    domNode.appendChild(container);

    let token = "";
    let recaptchaWidgetId = null;
    let isDisabled = false;

    function renderRecaptcha() {
      const recaptchaContainer = document.getElementById(widgetId);
      if (window.grecaptcha && recaptchaContainer) {
        try {
          recaptchaWidgetId = window.grecaptcha.render(widgetId, {
            sitekey: initialProps.siteKey,
            callback: function (responseToken) {
              token = responseToken;
              eventManager.fireEvent("onChange");
            },
            "expired-callback": function () {
              token = "";
              eventManager.fireEvent("onChange");
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
          "No se encontró el contenedor para reCAPTCHA o grecaptcha no está disponible."
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

    window.onRecaptchaLoadCallback = function () {
      renderRecaptcha();
    };

    loadRecaptchaScript();

    return {
      getDisplayTitle: function () {
        return "Google reCAPTCHA";
      },

      getValue: function () {
        return token;
      },

      setValue: function (val) {
        token = val;
      },

      validateValue: function (val) {
        if ((val === "" || val == null) && initialProps.required) {
          return "Por favor, completa el reCAPTCHA";
        }
        return true;
      },

      setProperty: function (propName, propValue) {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;

          // Resetear el captcha si está renderizado
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

      setDisabled: function (disabled) {
        isDisabled = disabled;
        const recaptchaContainer = document.getElementById(widgetId);
        if (recaptchaContainer) {
          recaptchaContainer.style.pointerEvents = disabled ? "none" : "auto";
          recaptchaContainer.style.opacity = disabled ? "0.5" : "1";
        }
      },

      getJSAPIFacade: function () {
        return {
          reset: function () {
            if (window.grecaptcha && recaptchaWidgetId !== null) {
              window.grecaptcha.reset(recaptchaWidgetId);
              token = "";
            }
          },
        };
      },
    };
  },
};
