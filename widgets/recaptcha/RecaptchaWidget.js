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

    // Contenedor principal
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    // Input oculto
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.id = widgetId + "_hiddenInput";
    hiddenInput.value = "";
    domNode.appendChild(hiddenInput);

    // Render del reCAPTCHA
    function renderRecaptcha(attempt = 0) {
      const MAX = 10,
        DELAY = 500;
      if (!container) return;

      if (!window.grecaptcha || !grecaptcha.render) {
        console.warn(
          `[RecaptchaWidget] grecaptcha no cargado. Reintento (${attempt}/${MAX})`
        );
        if (attempt < MAX)
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY);
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

            // Limpiar error previo
            if (errorFn) errorFn(null);

            // Notificar a Leap
            eventManager.fireEvent("onChange");
          },
        });
      } catch (e) {
        console.error("Error en render:", e);
      }
    }

    // Cargar script
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

    // API del widget
    return {
      getValue: () => {
        console.log("[RecaptchaWidget] getValue() →", hiddenInput.value);
        return hiddenInput.value;
      },

      setValue: (val) => {
        console.log("[RecaptchaWidget] setValue():", val);
        token = val;
        hiddenInput.value = val;
        eventManager.fireEvent("onChange"); // disparar cambio
      },

      validateValue: (val) => {
        const realVal = val !== undefined ? val : hiddenInput.value;
        const isEmpty = !realVal || realVal.trim() === "";
        let result = null;

        if (initialProps.required && isEmpty) {
          result = "Por favor verifica el reCAPTCHA";
        }

        // Solo notificar si cambió la validación
        if (result !== lastValidationResult) {
          lastValidationResult = result;
          if (errorFn) errorFn(result);
        }

        console.log("[RecaptchaWidget] validateValue →", result);
        return result;
      },

      setProperty: (propName, propValue) => {
        console.log(`[RecaptchaWidget] setProperty(${propName}):`, propValue);
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          token = "";
          hiddenInput.value = "";
          if (window.grecaptcha && container) {
            try {
              grecaptcha.reset();
            } catch (e) {
              console.warn("No se pudo resetear:", e);
            }
          }
          renderRecaptcha();
        }
      },

      setRequired: (r) => {
        console.log(`[RecaptchaWidget] setRequired(${r})`);
        initialProps.required = r;
        // revalidar
        if (errorFn) errorFn(this.validateValue());
      },

      setErrorMessage: (fn) => {
        console.log("[RecaptchaWidget] setErrorMessage() registrado");
        errorFn = fn;
        // validar al registrar
        if (errorFn) errorFn(this.validateValue());
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
