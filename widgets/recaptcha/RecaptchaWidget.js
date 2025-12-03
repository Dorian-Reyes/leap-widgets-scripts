const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",

  datatype: {
    type: "string",
    customDataType: "recaptcha-token",
    length: 2000,
  },

  builtInProperties: [
    { id: "title" },
    { id: "required" },
    { id: "seenInOverview", defaultValue: true },
  ],

  properties: [
    { id: "siteKey", label: "SiteKey", propType: "string", defaultValue: "" },
  ],

  instantiate: function (context, domNode, initialProps, eventManager) {
    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));

    let token = "";
    let errorFn = null;

    // Contenedor del captcha
    const container = document.createElement("div");
    container.id = widgetId;
    domNode.appendChild(container);

    // Hidden input
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.style.display = "none";
    domNode.appendChild(hiddenInput);

    function updateValue(newVal) {
      token = newVal || "";
      hiddenInput.value = token;

      console.log("[RecaptchaWidget] updateValue:", token);
      eventManager.fireEvent("onChange"); // <- CRÍTICO PARA LEAP
    }

    function renderCaptcha(attempt = 0) {
      const MAX = 15;

      if (!window.grecaptcha) {
        if (attempt < MAX) {
          return setTimeout(() => renderCaptcha(attempt + 1), 300);
        }
        return;
      }

      grecaptcha.render(widgetId, {
        sitekey: initialProps.siteKey,
        callback: function (responseToken) {
          console.log("[RecaptchaWidget] TOKEN:", responseToken);
          updateValue(responseToken);

          if (errorFn) errorFn(null);
        },
      });
    }

    // Load script if needed
    if (!document.querySelector("script[src*='recaptcha/api.js']")) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => renderCaptcha();
      document.head.appendChild(script);
    } else {
      renderCaptcha();
    }

    return {
      getValue: () => {
        console.log("[RecaptchaWidget] getValue:", hiddenInput.value);
        return hiddenInput.value;
      },

      setValue: (val) => {
        console.log("[RecaptchaWidget] setValue:", val);
        updateValue(val);
      },

      validateValue: () => {
        const val = hiddenInput.value;
        const empty = !val || val.trim() === "";

        if (initialProps.required && empty) {
          const msg = "Por favor resuelva el reCAPTCHA";
          if (errorFn) errorFn(msg);
          return msg;
        }

        if (errorFn) errorFn(null);
        return true;
      },

      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          updateValue("");
          if (window.grecaptcha) {
            grecaptcha.reset();
          }
          renderCaptcha();
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
