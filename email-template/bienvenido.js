function generarEmailBienvenida(nombre, urlConfirmacion) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Biblioteca Multimedia</title>
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
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="logo">Biblioteca Multimedia</h1>
        </div>
        <div class="content">
            <div class="icon-container">
                <!-- Círculo verde con "OK" centrado -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="64" height="64" style="background-color:#dcfce7; border-radius:50%; text-align:center;">
                  <tr>
                    <td align="center" valign="middle" style="font-size:18px; font-weight:bold; color:#16a34a;">
                      OK
                    </td>
                  </tr>
                </table>
            </div>
            <h2 class="title">¡Bienvenido/a, ${nombre}!</h2>
            <p class="message">
                Tu cuenta ha sido creada exitosamente en Biblioteca Multimedia. 
                Para completar el proceso de registro y activar tu cuenta, 
                por favor confirma tu dirección de correo electrónico haciendo clic en el botón de abajo.
            </p>
            <a href="${urlConfirmacion}" class="button">Confirmar Email</a>
            
            <div style="margin-top: 32px; padding: 16px; background-color: #f1f5f9; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                    <span style="word-break: break-all; color: #3b82f6;">${urlConfirmacion}</span>
                </p>
            </div>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 Biblioteca Multimedia. Todos los derechos reservados.</p>
            <div class="footer-links">
                <a href="${process.env.URLUSER}/contacto">Contacto</a>
            </div>
        </div>
    </div>
</body>
</html>
`;
}

module.exports = generarEmailBienvenida;
