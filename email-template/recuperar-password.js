function generarEmailRecuperacion(nombre, urlRecuperacion) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer Contraseña - Biblioteca Multimedia</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #3b82f6;
            padding: 24px;
            text-align: center;
        }
        .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .content {
            padding: 32px 24px;
        }
        .icon-container {
            text-align: center;
            margin-bottom: 24px;
        }
        .icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }
        .icon-warning {
            background-color: #fef3c7;
        }
        .checkmark {
            font-size: 32px;
            color: #d97706;
            font-weight: bold;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 16px 0;
            text-align: center;
        }
        .message {
            font-size: 16px;
            color: #6b7280;
            line-height: 1.6;
            margin: 0 0 32px 0;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 0 auto;
            display: block;
            width: fit-content;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 8px 0;
        }
        .footer-links {
            font-size: 14px;
        }
        .footer-links a {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 8px;
        }
        .warning-note {
            background-color: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
        }
        .warning-text {
            color: #92400e;
            font-size: 14px;
            margin: 0;
        }
        .security-info {
            background-color: #f1f5f9;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .security-title {
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
        }
        .security-list {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
            padding-left: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="logo">Biblioteca Multimedia</h1>
        </div>
        <div class="content">
            <div class="icon-container">
                <div class="icon icon-warning">
                    <div class="checkmark">🔑</div>
                </div>
            </div>
            <h2 class="title">Restablecer tu Contraseña</h2>
            <p class="message">
                Hola <strong>${nombre}</strong>,<br>
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            </p>
            
            <a href="${urlRecuperacion}" class="button">Restablecer Contraseña</a>

            <div class="warning-note">
                <p class="warning-text">
                    ⚠️ <strong>Este enlace expirará en 1 hora</strong> por motivos de seguridad.
                </p>
            </div>

            <div class="security-info">
                <p class="security-title">¿No solicitaste este cambio?</p>
                <p class="security-list">
                    • Si no fuiste tú, puedes ignorar este mensaje con toda seguridad.<br>
                    • Tu cuenta permanecerá segura y protegida.<br>
                    • Te recomendamos mantener tu contraseña en un lugar seguro.
                </p>
            </div>
            
            <div style="margin-top: 32px; padding: 16px; background-color: #e5e7eb; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #4b5563; text-align: center;">
                    Si tienes problemas con el botón, copia y pega esta URL en tu navegador:<br>
                    <span style="word-break: break-all; color: #3b82f6; font-family: monospace;">${urlRecuperacion}</span>
                </p>
            </div>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 Biblioteca Multimedia. Todos los derechos reservados.</p>
            <div class="footer-links">
                <a href="${process.env.URLUSER}/contacto">Soporte</a>
            </div>
        </div>
    </div>
</body>
</html>
`;
}

module.exports = generarEmailRecuperacion;