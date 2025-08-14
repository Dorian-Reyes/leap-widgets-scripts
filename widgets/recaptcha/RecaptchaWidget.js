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
  properties: [
    {
      id: "siteKey",
      label: "Clave del sitio (SiteKey)",
      propType: "string",
      defaultValue: "6Ld6zxArAAAAAPDYDDPDAOfjpZguznwnM8m5W7vd",
    },
  ],

  instantiate: function (context, domNode, initialProps, eventManager) {
    const widgetInstance = {
      // --- Variables internas ---
      _widgetId:
        "recaptcha_" +
        (context.dataId || Math.random().toString(36).substr(2, 9)),
      _containerNode: null,
      _token: "",
      _siteKey: initialProps.siteKey,

      // --- Inicialización del widget ---
      _init: function () {
        let container = document.getElementById(this._widgetId);
        if (!container) {
          container = document.createElement("div");
          container.id = this._widgetId;
          domNode.appendChild(container);
        }
        this._containerNode = container;
        this._renderRecaptcha();
      },

      // --- Renderizado de reCAPTCHA con reintentos ---
      _renderRecaptcha: function (attempt = 0) {
        const MAX_ATTEMPTS = 10;
        const DELAY_MS = 500;

        if (!this._containerNode) return;

        if (window.grecaptcha && grecaptcha.render) {
          try {
            grecaptcha.render(this._containerNode, {
              sitekey: this._siteKey,
              callback: (responseToken) => {
                this._token = responseToken;
                eventManager.fireEvent("onChange");
              },
            });
          } catch (e) {
            console.error("Error al renderizar reCAPTCHA:", e.message);
          }
        } else if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => this._renderRecaptcha(attempt + 1), DELAY_MS);
        }
      },

      // --- Cambiar propiedades dinámicamente ---
      setProperty: function (propName, propValue) {
        switch (propName) {
          case "siteKey":
            this._siteKey = propValue;
            if (window.grecaptcha && this._containerNode) {
              try {
                grecaptcha.reset();
                this._renderRecaptcha();
              } catch (e) {
                console.warn("Intento de reset fallido:", e.message);
              }
            }
            break;
        }
      },

      // --- API pública para JS externo ---
      getJSAPIFacade: function () {
        const self = this;
        return {
          __self: self,
          getValue: function () {
            return self._token;
          },
          setValue: function (val) {
            self._token = val;
          },
          validateValue: function (val) {
            if ((val === "" || val == null) && initialProps.required) {
              return "Por favor, verifica el reCAPTCHA";
            }
            return true;
          },
          setSiteKey: function (key) {
            self.setProperty("siteKey", key);
          },
        };
      },

      // --- Métodos requeridos por Leap (al primer nivel) ---
      getValue: function () {
        return this._token;
      },
      setValue: function (val) {
        this._token = val;
      },
      validateValue: function (val) {
        if ((val === "" || val == null) && initialProps.required) {
          return "Por favor, verifica el reCAPTCHA";
        }
        return true;
      },
    };

    // --- Cargar script si no existe y luego inicializar ---
    const existingScript = document.querySelector(
      "script[src*='recaptcha/api.js']"
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => widgetInstance._init();
      document.head.appendChild(script);
    } else {
      widgetInstance._init();
    }

    return widgetInstance;
  },
};

// Registrar widget en LEAP
nitro.registerWidget(recaptchaWidgetDefinition);
