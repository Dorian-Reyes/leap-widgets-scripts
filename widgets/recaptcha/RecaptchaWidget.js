const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" },
  category: { id: "custom.security", label: "Widgets personalizados" },
  iconClassName: "recaptcha-icon",

  // ============================================
  // BUILT-IN PROPERTIES REALES DE LEAP
  // ============================================
  builtInProperties: [
    { id: "title" },
    { id: "id" },
    { id: "required" },
    { id: "seenInOverview", defaultValue: true },
  ],

  // ============================================
  // PROPIEDADES PERSONALIZADAS
  // ============================================
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

    // ============================================
    // CONTENEDOR PRINCIPAL
    // ============================================
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    // ============================================
    // INPUT OCULTO — VALOR REAL DEL WIDGET PARA LEAP
    // ============================================
    console.log("[HiddenInput] creando input oculto...");

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.id = widgetId + "_hiddenInput";

    // DEBE iniciar vacío
    hiddenInput.value = "";

    domNode.appendChild(hiddenInput);

    console.log(`[HiddenInput] creado con id=${hiddenInput.id}`);

    // ============================================
    // RENDER DEL RECAPTCHA
    // ============================================
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
            console.log("[RecaptchaWidget] token recibido:", responseToken);

            token = responseToken;

            // ============================================
            // ASIGNAR VALOR REAL DEL WIDGET
            // ============================================
            hiddenInput.value = token;

            console.log(`[HiddenInput] actualizado → ${hiddenInput.value}`);

            // Limpia error si lo había
            if (errorFn) errorFn(null);

            // Notificar a LEAP del cambio
            eventManager.fireEvent("onChange");
          },
        });
      } catch (e) {
        console.error("Error en render:", e);
      }
    }

    // ============================================
    // Cargar script de Google si no existe
    // ============================================
    const existingScript = document.querySelector(
      "script[src*='recaptcha/api.js']"
    );

    if (!existingScript) {
      console.log("[RecaptchaWidget] Cargando script reCAPTCHA...");

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
      console.log("[RecaptchaWidget] Script ya existe");
      renderRecaptcha();
    }

    // ============================================
    // API DEL WIDGET
    // ============================================
    return {
      getValue: () => {
        console.log("[RecaptchaWidget] getValue() →", hiddenInput.value);
        return hiddenInput.value; // <==== CAMBIO CRÍTICO
      },

      setValue: (val) => {
        console.log("[RecaptchaWidget] setValue():", val);

        token = val;
        hiddenInput.value = val;

        console.log(
          `[HiddenInput] actualizado desde setValue(): ${hiddenInput.value}`
        );
      },

      validateValue: () => {
        console.log("===== [RecaptchaWidget] validateValue() =====");

        const val = hiddenInput.value;
        const isEmpty = !val || val.trim() === "";

        let result = null;

        if (initialProps.required && isEmpty) {
          console.warn("[RecaptchaWidget] VALIDACIÓN FALLIDA: vacío");

          result = "Por favor verifica el reCAPTCHA";

          if (errorFn) errorFn(result);
        } else {
          console.log("[RecaptchaWidget] VALIDACIÓN OK");

          if (errorFn) errorFn(null);
          result = null;
        }

        lastValidationResult = result;
        return result;
      },

      setProperty: (propName, propValue) => {
        console.log(`[RecaptchaWidget] setProperty(${propName}):`, propValue);

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
        console.log(`[RecaptchaWidget] setRequired(${r})`);
        initialProps.required = r;
      },

      setErrorMessage: (fn) => {
        console.log("[RecaptchaWidget] setErrorMessage() registrado");
        errorFn = fn;
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
