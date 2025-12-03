const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "3.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",

  // AHORA ES UN WIDGET DE TEXTO NORMAL
  datatype: {
    type: "string",
    length: 2000,
  },

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
    console.log("===== [RecaptchaWidget] Instanciando =====");

    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));

    // TOKEN REAL
    let token = "";
    let errorFn = null;

    // CONTENEDOR DEL CAPTCHA
    const container = document.createElement("div");
    container.id = widgetId;
    domNode.appendChild(container);

    // INPUT OCULTO QUE LEAP USARÁ COMO VALOR REAL
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = widgetId + "_token";
    hiddenInput.value = "";
    domNode.appendChild(hiddenInput);

    // Notificar a Leap
    function notifyChanged() {
      if (eventManager && typeof eventManager.fireEvent === "function") {
        console.log("[RecaptchaWidget] fireEvent('onChange')");
        eventManager.fireEvent("onChange");
      }
    }

    // Render reCAPTCHA
    function renderRecaptcha(attempt = 0) {
      if (!window.grecaptcha || !grecaptcha.render) {
        if (attempt < 10) {
          console.log("Reintentando render:", attempt);
          setTimeout(() => renderRecaptcha(attempt + 1), 300);
        }
        return;
      }

      grecaptcha.render(widgetId, {
        sitekey: initialProps.siteKey,
        callback: function (responseToken) {
          console.log("[RecaptchaWidget] token recibido:", responseToken);

          token = responseToken;
          hiddenInput.value = responseToken;

          if (errorFn) errorFn(null);

          notifyChanged();
        },
      });
    }

    // Cargar script Google
    const scriptExists = document.querySelector(
      "script[src*='recaptcha/api.js']"
    );

    if (!scriptExists) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => renderRecaptcha();
      document.head.appendChild(script);
    } else {
      renderRecaptcha();
    }

    // === API DEL WIDGET ===
    return {
      getValue: () => {
        console.log("[RecaptchaWidget] getValue =>", hiddenInput.value);
        return hiddenInput.value;
      },

      setValue: (val) => {
        token = val || "";
        hiddenInput.value = token;
      },

      validateValue: () => {
        console.log("[RecaptchaWidget] validateValue");

        const val = hiddenInput.value;
        if (initialProps.required && (!val || val.trim() === "")) {
          const msg = "Por favor verifica el reCAPTCHA";
          if (errorFn) errorFn(msg);
          return msg;
        }

        if (errorFn) errorFn(null);
        return true;
      },

      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          hiddenInput.value = "";
          token = "";

          if (window.grecaptcha) {
            try {
              grecaptcha.reset();
            } catch (_) {}
          }

          renderRecaptcha();
        }
      },

      setRequired: (r) => {
        initialProps.required = r;
      },

      setErrorMessage: (fn) => {
        errorFn = fn;
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
