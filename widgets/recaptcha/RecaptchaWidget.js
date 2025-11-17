const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" },
  category: { id: "custom.security", label: "Widgets personalizados" },
  iconClassName: "recaptcha-icon",
  builtInProperties: [
    { id: "title" },
    { id: "id" },
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

    let token = "";
    let errorFn = null;
    let lastValidationResult = null;

    // CONTENEDOR PRINCIPAL
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    // INPUT OCULTO
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.id = widgetId + "_hiddenInput";
    hiddenInput.value = "";
    domNode.appendChild(hiddenInput);

    // RENDER RECAPTCHA
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
            hiddenInput.value = token;
            if (errorFn) errorFn(null);
            // Notificar a Leap de manera segura
            if (context && typeof context.notifyChange === "function") {
              context.notifyChange();
            }
          },
        });
      } catch (e) {
        console.error("Error en render:", e);
      }
    }

    // Cargar script si no existe
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
      getDisplayTitle: () => initialProps.title || "Google reCAPTCHA",
      getValue: () => hiddenInput.value,
      setValue: (val) => {
        token = val;
        hiddenInput.value = val;
        if (context && typeof context.notifyChange === "function") {
          context.notifyChange();
        }
      },
      validateValue: () => {
        const val = hiddenInput.value;
        const isEmpty = !val || val.trim() === "";
        let result = null;
        if (initialProps.required && isEmpty) {
          result = "Por favor verifica el reCAPTCHA";
          if (errorFn) errorFn(result);
        } else {
          if (errorFn) errorFn(null);
          result = null;
        }
        lastValidationResult = result;
        return result;
      },
      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          hiddenInput.value = "";
          token = "";
          if (window.grecaptcha && container) {
            try {
              grecaptcha.reset();
              renderRecaptcha();
            } catch (e) {
              console.warn("No se pudo resetear:", e);
            }
          }
        }
      },
      setRequired: (r) => {
        initialProps.required = r;
      },
      setDisabled: (isDisabled) => {
        container.style.pointerEvents = isDisabled ? "none" : "auto";
      },
      setErrorMessage: (fn) => {
        errorFn = fn;
      },
      getJSAPIFacade: () => ({
        /* opcional: exponer API personalizada */
      }),
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
