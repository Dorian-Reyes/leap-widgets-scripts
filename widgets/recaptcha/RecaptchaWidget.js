const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",

  // *** IMPORTANTE: esto hace que el widget sea "data widget" ***
  datatype: {
    type: "string",
    length: 2000,
    customDataType: "recaptcha-token",
  },

  category: { id: "custom.security", label: "Widgets personalizados" },

  iconClassName: "recaptcha-icon",

  builtInProperties: [
    { id: "title" },
    { id: "required" },
    { id: "seenInOverview", defaultValue: true },
  ],

  properties: [
    {
      id: "siteKey",
      label: "Clave del sitio (SiteKey)",
      propType: "string",
      defaultValue: "",
    },
  ],

  instantiate: function (context, domNode, initialProps, eventManager) {
    console.log("===== [RecaptchaWidget] Instanciando Widget =====");

    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));

    let token = ""; // <-- aquí guardamos SIEMPRE el valor real
    let errorFn = null;

    // Contenedor que Google va a usar para dibujar el recaptcha
    const container = document.createElement("div");
    container.id = widgetId;
    domNode.appendChild(container);

    // Función helper para avisar a Leap que el valor cambió
    function notifyChanged() {
      if (eventManager && typeof eventManager.fireEvent === "function") {
        console.log("[RecaptchaWidget] fireEvent('onChange')");
        eventManager.fireEvent("onChange");
      }
    }

    // Render reCAPTCHA
    function renderRecaptcha(attempt = 0) {
      const MAX = 10;
      const DELAY = 500;

      if (!window.grecaptcha || !grecaptcha.render) {
        if (attempt < MAX) {
          console.log(
            "[RecaptchaWidget] grecaptcha no listo, reintento:",
            attempt + 1
          );
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY);
        }
        return;
      }

      try {
        console.log("[RecaptchaWidget] Llamando a grecaptcha.render");
        grecaptcha.render(widgetId, {
          sitekey: initialProps.siteKey,
          callback: function (responseToken) {
            console.log(
              "[RecaptchaWidget] callback reCAPTCHA, token=",
              responseToken
            );
            token = responseToken;
            if (errorFn) errorFn(null);
            notifyChanged();
          },
        });
      } catch (e) {
        console.error("[RecaptchaWidget] Error en render:", e);
      }
    }

    // Cargar script de Google si hace falta
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

    // === API que Leap va a usar ===
    return {
      getDisplayTitle: () => initialProps.title || "Google reCAPTCHA",

      getValue: () => {
        console.log("[RecaptchaWidget] getValue ->", token);
        return token || "";
      },

      setValue: (val) => {
        console.log("[RecaptchaWidget] setValue <-", val);
        token = val || "";
        notifyChanged();
      },

      validateValue: () => {
        const isEmpty = !token || token.trim() === "";
        let result = null;

        console.log(
          "[RecaptchaWidget] validateValue, required=",
          initialProps.required,
          " token=",
          token
        );

        if (initialProps.required && isEmpty) {
          result = "Por favor verifica el reCAPTCHA";
          if (errorFn) errorFn(result);
        } else {
          if (errorFn) errorFn(null);
          result = null;
        }
        return result;
      },

      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          console.log("[RecaptchaWidget] setProperty siteKey:", propValue);
          initialProps.siteKey = propValue;
          token = "";
          if (window.grecaptcha && container) {
            try {
              grecaptcha.reset();
              renderRecaptcha();
            } catch (e) {
              console.warn("[RecaptchaWidget] No se pudo resetear:", e);
            }
          }
        }
      },

      setRequired: (r) => {
        console.log("[RecaptchaWidget] setRequired:", r);
        initialProps.required = r;
      },

      setDisabled: (isDisabled) => {
        container.style.pointerEvents = isDisabled ? "none" : "auto";
      },

      setErrorMessage: (fn) => {
        // Leap nos pasa una función para pintar el error visual
        errorFn = (msg) => {
          console.log("[RecaptchaWidget] setErrorMessage callback, msg=", msg);
          fn(msg);
        };
      },

      getJSAPIFacade: () => ({}),
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
