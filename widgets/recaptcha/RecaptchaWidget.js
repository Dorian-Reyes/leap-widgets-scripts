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
  // PROPIEDADES PERSONALIZADAS (TOKEN ELIMINADO)
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
    // 1) Crear contenedor principal
    // ============================================
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    // ============================================
    // 2) CREAR INPUT PARA VALIDAR EN LEAP
    // ============================================
    console.log("[HiddenInput] Creando input oculto para validación...");

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.id = widgetId + "_hiddenInput";

    // **Por ahora sin display none porque lo pediste así**
    // hiddenInput.style.display = "none";
    hiddenInput.value = "";

    domNode.appendChild(hiddenInput);

    console.log(`[HiddenInput] Input oculto creado con id=${hiddenInput.id}`);

    // ============================================
    // Renderizar reCAPTCHA
    // ============================================
    function renderRecaptcha(attempt = 0) {
      const MAX = 10,
        DELAY = 500;

      if (!container) return;

      if (!window.grecaptcha || !grecaptcha.render) {
        console.warn(
          `[RecaptchaWidget] grecaptcha aún no cargado. Reintento (${attempt}/${MAX})`
        );
        if (attempt < MAX) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY);
        }
        return;
      }

      try {
        console.log("[RecaptchaWidget] Renderizando reCAPTCHA...");

        grecaptcha.render(widgetId, {
          sitekey: initialProps.siteKey,
          callback: function (responseToken) {
            console.log(
              "[RecaptchaWidget] Token recibido del captcha:",
              responseToken
            );

            token = responseToken;

            // ============================================
            // ACTUALIZAR INPUT OCULTO — AQUÍ ES LA MAGIA 🔥
            // ============================================
            hiddenInput.value = token || initialProps.siteKey;
            console.log(
              `[HiddenInput] Input oculto actualizado → ${hiddenInput.value}`
            );

            if (errorFn) {
              console.log("[RecaptchaWidget] limpiando error (token recibido)");
              errorFn(null);
            }

            eventManager.fireEvent("onChange");
          },
        });
      } catch (e) {
        console.error("Error al render reCAPTCHA:", e.message);
      }
    }

    // ============================================
    // Cargar script si no existe
    // ============================================
    const existing = document.querySelector("script[src*='recaptcha/api.js']");
    if (!existing) {
      console.log("[RecaptchaWidget] Cargando script de Google reCAPTCHA...");

      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("[RecaptchaWidget] Script cargado ✔️");
        renderRecaptcha();
      };

      document.head.appendChild(script);
    } else {
      console.log("[RecaptchaWidget] Script existente. Renderizando...");
      renderRecaptcha();
    }

    // ============================================
    // MÉTODOS DEL WIDGET
    // ============================================
    return {
      getValue: () => {
        console.log("[RecaptchaWidget] getValue() →", token);
        return token;
      },

      setValue: (val) => {
        console.log("[RecaptchaWidget] setValue():", val);
        token = val;

        hiddenInput.value = val || initialProps.siteKey;
        console.log(
          `[HiddenInput] Actualizado desde setValue(): ${hiddenInput.value}`
        );
      },

      validateValue: () => {
        console.log("===== [RecaptchaWidget] Ejecutando validateValue() =====");
        console.log("[RecaptchaWidget] required:", initialProps.required);
        console.log("[RecaptchaWidget] token actual:", token);
        console.log("[HiddenInput] valor:", hiddenInput.value);

        const isEmpty = !hiddenInput.value || hiddenInput.value.trim() === "";
        let result = null;

        if (initialProps.required && isEmpty) {
          console.warn(
            "[RecaptchaWidget] VALIDACIÓN FALLIDA → campo oculto vacío"
          );

          if (errorFn) errorFn("Por favor verifica el reCAPTCHA");

          result = "Por favor verifica el reCAPTCHA";
        } else {
          console.log("[RecaptchaWidget] VALIDACIÓN CORRECTA");

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

          console.log(`[HiddenInput] Prellenando con siteKey ${propValue}`);
          hiddenInput.value = propValue;

          if (window.grecaptcha && container) {
            try {
              grecaptcha.reset();
              renderRecaptcha();
            } catch (e) {
              console.warn(
                "[RecaptchaWidget] No se pudo resetear captcha:",
                e.message
              );
            }
          }
        }
      },

      setRequired: (r) => {
        console.log(`[RecaptchaWidget] setRequired(${r})`);
        initialProps.required = r;
      },

      setErrorMessage: (fn) => {
        console.log("[RecaptchaWidget] setErrorMessage() asignado");
        errorFn = fn;
      },
    };
  },
};

nitro.registerWidget(recaptchaWidgetDefinition);
