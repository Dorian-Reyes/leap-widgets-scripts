// RecaptchaWidget.js
const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" },
  category: { id: "custom.security", label: "Widgets personalizados" },
  iconClassName: "recaptcha-icon",

  builtInProperties: [{ id: "required" }, { id: "title" }],
  properties: [],

  instantiate: function (context, domNode, initialProps, eventManager) {
    const widgetId =
      "recaptcha_" +
      (context.dataId || Math.random().toString(36).substr(2, 9));
    const SITE_KEY = "6Ld6zxArAAAAAPDYDDPDAOfjpZguznwnM8m5W7vd"; // Contenedor del CAPTCHA

    let container = document.getElementById(widgetId);
    if (!container) {
      container = document.createElement("div");
      container.id = widgetId;
      domNode.appendChild(container);
    }

    function renderRecaptcha(attempt = 0) {
      const MAX_ATTEMPTS = 10;
      const DELAY_MS = 500;
      const captchaContainer = document.getElementById(widgetId);

      if (!captchaContainer) {
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
        }
        return;
      }

      if (window.grecaptcha && grecaptcha.render) {
        try {
          grecaptcha.render(widgetId, {
            sitekey: SITE_KEY,
            callback: function (responseToken) {
              context.setValue(responseToken);
              eventManager.fireEvent("onChange");
            },
            "expired-callback": function () {
              context.setValue("");
              eventManager.fireEvent("onChange");
            },
          });
        } catch (e) {
          console.error("Error al renderizar reCAPTCHA:", e.message);
        }
      } else if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => renderRecaptcha(attempt + 1), DELAY_MS);
      }
    }

    function loadRecaptchaScript() {
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
    } // Inicializa // CAMBIO CLAVE: Usa el contexto para determinar el modo de ejecución

    if (context.mode === "design") {
      // En modo de diseño, solo muestra un mensaje de placeholder
      domNode.innerHTML = "<div>reCAPTCHA Widget Placeholder</div>";
    } else {
      // En modo de ejecución, carga el script
      loadRecaptchaScript();
    }

    return {
      getValue: function () {
        return context.getValue();
      },
      setValue: function (val) {
        context.setValue(val);
      },
      validateValue: function (val) {
        if (initialProps.required && (!val || val.length === 0)) {
          return "Por favor, verifique el reCAPTCHA.";
        }
        return null;
      },
      setProperty: function (propName, propValue) {
        // Lógica para manejar cambios de propiedades, si fuera necesario
      },
    };
  },
};

// Registrar el widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
