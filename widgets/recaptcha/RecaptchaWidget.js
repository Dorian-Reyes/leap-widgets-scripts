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
    console.log("eventManager:", eventManager);

    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));
    let token = "";
    let errorFn = null;
    let lastValidationResult = null;

    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.id = widgetId + "_hiddenInput";
    hiddenInput.value = "";
    domNode.appendChild(hiddenInput);

    function renderRecaptcha(attempt = 0) {
      const MAX = 10,
        DELAY = 500;
      if (!container) return;

      if (!window.grecaptcha || !grecaptcha.render) {
        console.warn(
          `[RecaptchaWidget] grecaptcha no cargado. Reintento (${attempt}/${MAX})`
        );
        if (attempt < MAX) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY);
        }
        return;
      }

      try {
        console.log("[RecaptchaWidget] Renderizando...");
        grecaptcha.render(widgetId, {
          sitekey: initialProps.siteKey,
          callback: function (responseToken) {
            token = responseToken;
            hiddenInput.value = token;
            console.log(`[HiddenInput] actualizado → ${hiddenInput.value}`);

            if (errorFn) errorFn(null);

            if (eventManager && typeof eventManager.fireEvent === "function") {
              eventManager.fireEvent("onChange");
            } else {
              console.warn(
                "[RecaptchaWidget] eventManager.fireEvent no está definido"
              );
            }
          },
        });
      } catch (e) {
        console.error("Error en render:", e);
      }
    }

    const existingScript = document.querySelector(
      "script[src*='recaptcha/api.js']"
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("[RecaptchaWidget] Script cargado");
        renderRecaptcha();
      };
      document.head.appendChild(script);
    } else {
      renderRecaptcha();
    }

    return {
      getValue: () => hiddenInput.value,

      setValue: (val) => {
        token = val;
        hiddenInput.value = val;
        if (eventManager && typeof eventManager.fireEvent === "function") {
          eventManager.fireEvent("onChange");
        } else {
          console.warn(
            "[RecaptchaWidget] setValue: eventManager.fireEvent no disponible"
          );
        }
      },

      validateValue: (val) => {
        const realVal = val !== undefined ? val : hiddenInput.value;
        const isEmpty = !realVal || realVal.trim() === "";
        let result = null;

        if (initialProps.required && isEmpty) {
          result = "Por favor verifica el reCAPTCHA";
        }

        if (result !== lastValidationResult) {
          lastValidationResult = result;
          if (errorFn) errorFn(result);
        }

        console.log("[RecaptchaWidget] validateValue →", result);
        return result;
      },

      setProperty: (propName, propValue) => {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          token = "";
          hiddenInput.value = "";
          try {
            if (window.grecaptcha && typeof grecaptcha.reset === "function") {
              grecaptcha.reset();
            }
          } catch (e) {
            console.warn("No se pudo resetear reCAPTCHA:", e);
          }
          renderRecaptcha();
        }
      },

      setRequired: (r) => {
        initialProps.required = r;
        if (errorFn) errorFn(this.validateValue());
      },

      setErrorMessage: (fn) => {
        errorFn = fn;
        if (errorFn) errorFn(this.validateValue());
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
