// RecaptchaWidget.js
const recaptchaWidgetDefinition = {
  id: "custom.Recaptcha",
  version: "2.0.0",
  apiVersion: "1.0.0",
  label: "Google reCAPTCHA",
  description: "Verificación anti-bots con Google reCAPTCHA",
  datatype: { type: "string" }, // devuelve el token del CAPTCHA
  category: { id: "custom.security", label: "Avanzado" }, // Paleta “Seguridad”
  iconClassName: "fa fa-shield-alt", // icono (FontAwesome)
  builtInProperties: [{ id: "required" }, { id: "title" }],
  properties: [
    {
      id: "siteKey",
      label: "Clave del sitio (SiteKey)",
      propType: "string",
      defaultValue: "6Ld6zxArAAAAAPDYDDPDAOfjpZguznwnM8m5W7vd",
    },
  ],
  instantiate: function (context, domNode, initialProps, eventManager) {
    // Crear contenedor para el reCAPTCHA
    const widgetId = "recaptcha_" + context.dataId;
    const container = document.createElement("div");
    container.id = widgetId;
    domNode.appendChild(container);

    // Variable para almacenar el token de reCAPTCHA
    let token = "";

    // Función para renderizar el CAPTCHA una vez que la librería carga
    function renderRecaptcha() {
      if (window.grecaptcha && container) {
        window.grecaptcha.render(widgetId, {
          sitekey: initialProps.siteKey,
          callback: function (responseToken) {
            token = responseToken; // guardar token cuando el usuario resuelve
          },
        });
      }
    }

    // Si la librería ya está cargada, renderizar de inmediato
    if (window.grecaptcha) {
      renderRecaptcha();
    } else {
      // Si no está cargada, insertar script de Google y luego renderizar
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = renderRecaptcha;
      document.head.appendChild(script);
    }

    // Métodos obligatorios por la API de widget
    return {
      // Retorna el token capturado (valor del widget)
      getValue: function () {
        return token;
      },
      // Permite asignar valor (no se usa normalmente con reCAPTCHA)
      setValue: function (val) {
        token = val;
      },
      // Valida el valor: si está vacío y es requerido, devuelve mensaje
      validateValue: function (val) {
        if ((val === "" || val == null) && initialProps.required) {
          return "Por favor, verifica el reCAPTCHA";
        }
        return true;
      },
      // Captura cambios en propiedades (por ejemplo, cambiar siteKey)
      setProperty: function (propName, propValue) {
        if (propName === "siteKey") {
          initialProps.siteKey = propValue;
          // Si ya se había rendereado, reiniciamos el CAPTCHA
          if (window.grecaptcha) {
            window.grecaptcha.reset();
            renderRecaptcha();
          }
        }
      },
    };
  },
};
// Registrar el widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
