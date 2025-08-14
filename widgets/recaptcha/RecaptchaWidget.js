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
      _widgetId:
        "recaptcha_" +
        (context.dataId || Math.random().toString(36).substr(2, 9)),
      _containerNode: null,
      _token: "",
      _siteKey: initialProps.siteKey,

      // Inicializa DOM y reCAPTCHA
      _init: function () {
        // Crear contenedor si no existe
        let container = document.getElementById(this._widgetId);
        if (!container) {
          container = document.createElement("div");
          container.id = this._widgetId;
          domNode.appendChild(container);
        }
        this._containerNode = container;

        this._renderRecaptcha();
      },

      // Función robusta para renderizar reCAPTCHA
      _renderRecaptcha: function (attempt = 0) {
        const MAX_ATTEMPTS = 10;
        const DELAY_MS = 500;

        if (!this._containerNode) return;

        if (window.grecaptcha && grecaptcha.render) {
          try {
            grecaptcha.render(this._widgetId, {
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

      // Permite cambiar propiedades dinámicamente
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

      // Exponer API para JS externo siguiendo convención
      getJSAPIFacade: function () {
        const facade = {
          __self: this,
          getValue: function () {
            return this.__self._token;
          },
          setValue: function (val) {
            this.__self._token = val;
          },
          validateValue: function (val) {
            if ((val === "" || val == null) && initialProps.required) {
              return "Por favor, verifica el reCAPTCHA";
            }
            return true;
          },
          setSiteKey: function (key) {
            this.__self.setProperty("siteKey", key);
          },
        };
        return facade;
      },
    };

    // Inicializar widget
    widgetInstance._init();

    // Retornar instancia para Leap
    return widgetInstance;
  },
};

// Registrar widget
nitro.registerWidget(recaptchaWidgetDefinition);
