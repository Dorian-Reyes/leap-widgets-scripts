const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" },
  category: { id: "custom.security", label: "Widgets personalizados" },
  iconClassName: "recaptcha-icon",

  // Built-in properties que LEAP espera
  builtInProperties: [
    { id: "title" },
    { id: "id" },
    { id: "required" },
    { id: "seenInOverview", defaultValue: true },
  ],

  // Propiedades propias del widget
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

    // 1) Contenedor para reCAPTCHA
    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    // 2) Crear input oculto para que LEAP lo use como “valor”
    console.log("[HiddenInput] Creando input oculto para validación...");

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.id = widgetId + "_hiddenInput";
    // Podrías ocultarlo con style.display = "none", pero lo dejamos para debug si quieres
    // hiddenInput.style.display = "none";
    hiddenInput.value = ""; // inicialmente vacío

    domNode.appendChild(hiddenInput);
    console.log(`[HiddenInput] Creado con id=${hiddenInput.id}`);

    // Función para renderizar reCAPTCHA
    function renderRecaptcha(attempt = 0) {
      const MAX = 10;
      const DELAY = 500;

      if (!container) return;

      if (!window.grecaptcha || !grecaptcha.render) {
        console.warn(
          `[RecaptchaWidget] grecaptcha aún no cargado. Reintentando (${attempt}/${MAX})`
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

            // Aquí actualizamos el hiddenInput con el token
            hiddenInput.value = token;
            console.log(
              `[HiddenInput] Input oculto actualizado → ${hiddenInput.value}`
            );

            if (errorFn) {
              console.log(
                "[RecaptchaWidget] Limpiando mensaje de error (token válido)"
              );
              errorFn(null);
            }

            // Informar a LEAP que hubo un cambio de valor
            eventManager.fireEvent("onChange");
          },
        });
      } catch (e) {
        console.error(
          "[RecaptchaWidget] Error al render reCAPTCHA:",
          e.message
        );
      }
    }

    // Cargar el script de Google reCAPTCHA si no está presente
    const existing = document.querySelector("script[src*='recaptcha/api.js']");
    if (!existing) {
      console.log("[RecaptchaWidget] Cargando script de Google reCAPTCHA...");
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("[RecaptchaWidget] Script reCAPTCHA cargado ✔️");
        renderRecaptcha();
      };
      document.head.appendChild(script);
    } else {
      console.log(
        "[RecaptchaWidget] Script reCAPTCHA ya existe. Renderizando..."
      );
      renderRecaptcha();
    }

    // Métodos del widget para LEAP
    return {
      getValue: () => {
        // Importante: devolvemos el valor del input oculto, no solo el token
        console.log("[RecaptchaWidget] getValue() →", hiddenInput.value);
        return hiddenInput.value;
      },

      setValue: (val) => {
        console.log("[RecaptchaWidget] setValue():", val);
        token = val;
        hiddenInput.value = val || ""; // si val es vacío, limpiar
        console.log(
          `[HiddenInput] Actualizado desde setValue(): ${hiddenInput.value}`
        );
        // también avisamos a LEAP que cambió
        eventManager.fireEvent("onChange");
      },

      validateValue: () => {
        console.log("===== [RecaptchaWidget] Ejecutando validateValue() =====");
        console.log("[RecaptchaWidget] required:", initialProps.required);
        console.log("[HiddenInput] valor actual:", hiddenInput.value);

        const val = hiddenInput.value;
        const isEmpty = !val || val.trim() === "";
        let result = null;

        if (initialProps.required && isEmpty) {
          console.warn(
            "[RecaptchaWidget] VALIDACIÓN FALLIDA → campo oculto vacío"
          );
          if (errorFn) {
            errorFn("Por favor verifica el reCAPTCHA");
          }
          result = "Por favor verifica el reCAPTCHA";
        } else {
          console.log("[RecaptchaWidget] VALIDACIÓN CORRECTA");
          if (errorFn) {
            errorFn(null);
          }
          result = null;
        }

        return result;
      },

      setProperty: (propName, propValue) => {
        console.log(`[RecaptchaWidget] setProperty(${propName}):`, propValue);
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          console.log(
            `[HiddenInput] Prellenando valor con siteKey: ${propValue}`
          );
          // opcional: podrías prellenar el hidden input, pero no como token
          hiddenInput.value = ""; // no ponemos siteKey como valor de validación
          try {
            if (window.grecaptcha) {
              grecaptcha.reset();
            }
            renderRecaptcha();
          } catch (e) {
            console.warn(
              "[RecaptchaWidget] No se pudo resetear reCAPTCHA:",
              e.message
            );
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
