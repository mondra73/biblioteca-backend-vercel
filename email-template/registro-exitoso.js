function getEmailTemplate(nombreUsuario) {
  return `
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido a Biblioteca Multimedia!</title>
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
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            padding: 32px 24px;
            text-align: center;
        }

        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: -0.5px;
        }

        .subtitle {
            color: #e2e8f0;
            font-size: 14px;
            margin: 8px 0 0 0;
            font-weight: 400;
        }

        .content {
            padding: 40px 32px;
        }

        .icon-container {
            text-align: center;
            margin-bottom: 32px;
        }

        .icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }

        .welcome-title {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 16px 0;
            text-align: center;
            line-height: 1.2;
        }

        .subtitle-text {
            font-size: 18px;
            color: #10b981;
            font-weight: 600;
            text-align: center;
            margin: 0 0 24px 0;
        }

        .message {
            font-size: 16px;
            color: #4b5563;
            line-height: 1.7;
            margin: 0 0 32px 0;
            text-align: center;
        }

        .features {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
        }

        .features-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 16px 0;
            text-align: center;
        }

        .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
            color: #6b7280;
        }

        .feature-icon {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            flex-shrink: 0;
        }

        .button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: #ffffff;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 0 auto;
            display: block;
            width: fit-content;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            transition: all 0.3s ease;
        }

        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
        }

        .footer {
            background-color: #f8fafc;
            padding: 32px 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 16px 0;
        }

        .footer-links {
            font-size: 14px;
        }

        .footer-links a {
            color: #8b5cf6;
            text-decoration: none;
            margin: 0 12px;
            font-weight: 500;
        }

        .footer-links a:hover {
            text-decoration: underline;
        }

        .social-links {
            margin-top: 20px;
        }

        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #9ca3af;
            text-decoration: none;
        }
    </style>
</head>

<body>
    <div class="email-container">
        <div class="header">
            <h1 class="logo">Biblioteca Multimedia</h1>
            <p class="subtitle">Tu mundo de contenido digital</p>
        </div>

        <div class="content">
            <div class="icon-container">
                <div class="icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
                        <path d="M9 12l2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                </div>
            </div>

            <h2 class="welcome-title">¡Gracias por registrarte, ${nombreUsuario}!</h2>
            <p class="subtitle-text">Bienvenido a Biblioteca Multimedia</p>

            <p class="message">
                Nos emociona tenerte como parte de nuestra comunidad. Tu cuenta ha sido creada exitosamente
                y ya puedes comenzar a explorar nuestra extensa colección de contenido multimedia.
            </p>

            <div class="features">
                <h3 class="features-title">¿Qué puedes hacer ahora?</h3>
                <ul class="feature-list">
                    <li class="feature-item">
                        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                            <path
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Registra todos los libros que lees, o quieres leer
                    </li>
                    <li class="feature-item">
                        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                            <path
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Guarda Todas las peliculas y series que has visto o deseas ver
                    </li>
                    <li class="feature-item">
                        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                            <path
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Visualiza las estadisticas globales de los usuarios para ver como estas en el ranking
                    </li>
                </ul>
            </div>

            <a href="#" class="button">Comenzar a Explorar</a>
        </div>

        <div class="footer">
            <p class="footer-text">© 2025 Biblioteca Multimedia. Todos los derechos reservados.</p>
            <div class="footer-links">
                <a href="#">Ayuda</a>
                <a href="#">Contacto</a>
                <a href="#">Términos de Uso</a>
                <a href="#">Privacidad</a>
            </div>
            <div class="social-links">
                <a href="#">Facebook</a>
                <a href="#">Twitter</a>
                <a href="#">Instagram</a>
            </div>
        </div>
    </div>
</body>

</html>
`;
}

module.exports = getEmailTemplate; 