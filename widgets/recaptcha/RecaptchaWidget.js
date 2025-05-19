// RecaptchaWidget.js

const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" },
  category: { id: "custom.security", label: "Avanzado" },
  iconClassName: "fa fa-shield-alt",
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
    let recaptchaWidgetInstanceId = null;
    let isDisabled = false;
    let isRequired = !!initialProps.required;

    function renderRecaptcha() {
      if (context.mode === "design") {
        // No renderizamos nada en modo diseño
        container.innerHTML = "<p style='color:gray;'>[reCAPTCHA]</p>";
        return;
      }

      if (window.grecaptcha && document.getElementById(widgetId)) {
        recaptchaWidgetInstanceId = window.grecaptcha.render(widgetId, {
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
      } else {
        console.error(
          "No se pudo encontrar el contenedor para reCAPTCHA o grecaptcha no está disponible."
        );
      }
    }

    function loadRecaptchaScript() {
      if (typeof window.grecaptcha === "undefined") {
        if (!document.getElementById("recaptcha-script")) {
          const script = document.createElement("script");
          script.id = "recaptcha-script";
          script.src =
            "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadCallback&render=explicit";
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
        window.onRecaptchaLoadCallback = function () {
          renderRecaptcha();
        };
      } else {
        renderRecaptcha();
      }
    }

    loadRecaptchaScript();

    return {
      getValue: function () {
        return token;
      },
      setValue: function (val) {
        token = val;
        if (
          val &&
          typeof window.grecaptcha !== "undefined" &&
          recaptchaWidgetInstanceId !== null
        ) {
          try {
            window.grecaptcha.reset(recaptchaWidgetInstanceId);
          } catch (err) {
            console.warn("Error al intentar resetear reCAPTCHA:", err);
          }
        }
      },
      setProperty: function (propName, propValue) {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          if (
            typeof window.grecaptcha !== "undefined" &&
            recaptchaWidgetInstanceId !== null
          ) {
            try {
              window.grecaptcha.reset(recaptchaWidgetInstanceId);
              renderRecaptcha();
            } catch (e) {
              console.error("Error al resetear reCAPTCHA:", e);
            }
          }
        } else if (propName === "required") {
          isRequired = propValue;
        }
      },
      validateValue: function (val) {
        if ((val === "" || val == null) && isRequired) {
          return "Por favor, verifica el reCAPTCHA.";
        }
        return true;
      },
      setDisabled: function (disabled) {
        isDisabled = disabled;
        if (disabled && container) {
          container.style.pointerEvents = "none";
          container.style.opacity = "0.5";
        } else {
          container.style.pointerEvents = "auto";
          container.style.opacity = "1";
        }
      },
      setRequired: function (required) {
        isRequired = required;
      },
      setErrorMessage: function (msg) {
        if (msg) {
          container.style.border = "1px solid red";
          container.title = msg;
        } else {
          container.style.border = "";
          container.title = "";
        }
      },
    };
  },
};

// Registrar el widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
