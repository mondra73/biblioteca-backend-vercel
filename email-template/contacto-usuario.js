const correoEnviadoTemplate = (datos) => {
  const {
    nombre,
    email,
    asunto,
    mensaje,
    fechaEnvio
  } = datos;

  const asuntosMap = {
    'consulta-general': 'Consulta general',
    'soporte-tecnico': 'Soporte técnico',
    'sugerencia': 'Sugerencia de mejora',
    'problema-cuenta': 'Problema con mi cuenta',
    'colaboracion': 'Propuesta de colaboración',
    'otro': 'Otro'
  };

  const asuntoLegible = asuntosMap[asunto] || asunto;

  return `
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de mensaje enviado - Entertainment Hub</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            padding: 30px 20px;
            text-align: center;
        }

        .logo {
            color: white;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }

        .content {
            padding: 40px 30px;
        }

        .icon-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #28a745;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
        }

        .icon {
            width: 40px;
            height: 40px;
            fill: white;
        }

        .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            text-align: center;
            margin-bottom: 15px;
        }

        .subtitle {
            font-size: 16px;
            color: #666;
            text-align: center;
            margin-bottom: 30px;
        }

        .message-summary {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #28a745;
        }

        .summary-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            font-size: 16px;
        }

        .detail-row {
            display: flex;
            margin-bottom: 12px;
            align-items: flex-start;
        }

        .detail-label {
            font-weight: bold;
            color: #333;
            min-width: 80px;
            margin-right: 15px;
            font-size: 14px;
        }

        .detail-value {
            color: #555;
            flex: 1;
            font-size: 14px;
        }

        .message-preview {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
            font-style: italic;
            color: #444;
            max-height: 100px;
            overflow: hidden;
            position: relative;
        }

        .response-info {
            background-color: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }

        .response-title {
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
        }

        .response-text {
            color: #333;
            font-size: 14px;
        }

        .next-steps {
            margin: 30px 0;
        }

        .steps-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
        }

        .step {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .step-number {
            background-color: #007bff;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-weight: bold;
            font-size: 12px;
        }

        .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            text-align: center;
            margin: 20px auto;
            display: block;
            width: fit-content;
        }

        .btn:hover {
            background-color: #0056b3;
        }

        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }

        .footer-text {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }

        .social-links {
            margin-top: 15px;
        }

        .social-links a {
            color: #007bff;
            text-decoration: none;
            margin: 0 10px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">Entertainment Hub</h1>
        </div>

        <div class="content">
            <div class="icon-circle">
                <svg class="icon" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h2 class="title">¡Mensaje Enviado Correctamente!</h2>
            <p class="subtitle">Hola ${nombre}, hemos recibido tu mensaje y te responderemos pronto</p>

            <div class="message-summary">
                <div class="summary-title">Resumen de tu mensaje:</div>

                <div class="detail-row">
                    <span class="detail-label">Nombre:</span>
                    <span class="detail-value">${nombre}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${email}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Asunto:</span>
                    <span class="detail-value">${asuntoLegible}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Mensaje:</span>
                    <div class="detail-value">
                        <div class="message-preview">
                            ${mensaje}
                        </div>
                    </div>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Enviado:</span>
                    <span class="detail-value">${fechaEnvio}</span>
                </div>
            </div>

            <div class="response-info">
                <div class="response-title">⏰ Tiempo de Respuesta</div>
                <div class="response-text">
                    Nuestro equipo revisará tu mensaje y te responderá en un plazo máximo de <strong>24 horas</strong>
                    durante días hábiles.
                </div>
            </div>

            <div class="next-steps">
                <div class="steps-title">¿Qué sigue ahora?</div>

                <div class="step">
                    <div class="step-number">1</div>
                    <span>Hemos recibido tu mensaje y lo hemos registrado en nuestro sistema</span>
                </div>

                <div class="step">
                    <div class="step-number">2</div>
                    <span>Nuestro equipo lo revisará y te contactará por email</span>
                </div>

                <div class="step">
                    <div class="step-number">3</div>
                    <span>Si es urgente, también puedes llamarnos al +54 2473-469984</span>
                </div>
            </div>

            <a href="${process.env.URLUSER || 'http://localhost:3000'}" class="btn">Volver al Sitio Web</a>
        </div>

        <div class="footer">
            <p class="footer-text">© 2024 Entertainment Hub. Todos los derechos reservados.</p>
            <p class="footer-text">
                Si no solicitaste este mensaje, puedes ignorar este email.
            </p>
            <div class="social-links">
                <a href="mailto:javier.espinosa@live.com.ar">Email</a> |
                <a href="tel:+542473469984">Teléfono</a> |
                <a href="${process.env.URLUSER || 'http://localhost:3000'}">Sitio Web</a>
            </div>
        </div>
    </div>
</body>

</html>
`;
};

module.exports = correoEnviadoTemplate;