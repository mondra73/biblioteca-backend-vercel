const contactoUsuarioTemplate = (datos) => {
  const {
    nombre,
    email,
    telefono = 'No proporcionado',
    asunto,
    mensaje,
    fechaEnvio
  } = datos;

  const asuntosUrgentes = ['soporte-tecnico', 'problema-cuenta'];
  const prioridad = asuntosUrgentes.includes(asunto) ? 'URGENTE' : 'NORMAL';
  
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
    <title>Nuevo mensaje de contacto - Entertainment Hub</title>
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
            background-color: #ff6b35;
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

        .message-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #007bff;
        }

        .detail-row {
            display: flex;
            margin-bottom: 15px;
            align-items: flex-start;
        }

        .detail-label {
            font-weight: bold;
            color: #333;
            min-width: 100px;
            margin-right: 15px;
        }

        .detail-value {
            color: #555;
            flex: 1;
            word-break: break-word;
        }

        .message-content {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
            font-style: italic;
            color: #444;
        }

        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .priority-normal {
            background-color: #e3f2fd;
            color: #1976d2;
        }

        .priority-urgent {
            background-color: #ffebee;
            color: #d32f2f;
        }

        .action-section {
            text-align: center;
            margin: 30px 0;
        }

        .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 0 10px;
        }

        .btn:hover {
            background-color: #0056b3;
        }

        .btn-secondary {
            background-color: #6c757d;
        }

        .btn-secondary:hover {
            background-color: #545b62;
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

        .timestamp {
            background-color: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            color: #666;
            text-align: center;
            margin-top: 20px;
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
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            </div>

            <h2 class="title">Nuevo Mensaje de Contacto</h2>
            <p class="subtitle">Has recibido un nuevo mensaje a través del formulario de contacto de tu sitio web</p>

            <div class="message-details">
                <div class="detail-row">
                    <span class="detail-label">Nombre:</span>
                    <span class="detail-value">${nombre}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${email}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Teléfono:</span>
                    <span class="detail-value">${telefono}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Asunto:</span>
                    <span class="detail-value">
                        ${asuntoLegible}
                        <span class="priority-badge priority-${prioridad.toLowerCase()}">${prioridad}</span>
                    </span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Mensaje:</span>
                    <div class="detail-value">
                        <div class="message-content">
                            ${mensaje}
                        </div>
                    </div>
                </div>
            </div>

            <div class="action-section">
                <a href="mailto:${email}?subject=Re: ${asuntoLegible}" class="btn">
                    Responder por Email
                </a>
                ${telefono !== 'No proporcionado' ? `
                <a href="tel:${telefono}" class="btn btn-secondary">
                    Llamar
                </a>
                ` : ''}
            </div>

            <div class="timestamp">
                Mensaje recibido el ${fechaEnvio}
            </div>
        </div>

        <div class="footer">
            <p class="footer-text">© 2024 Entertainment Hub. Todos los derechos reservados.</p>
            <p class="footer-text">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" style="color: #007bff;">Panel de Administración</a> |
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/configuracion" style="color: #007bff;">Configurar Notificaciones</a>
            </p>
        </div>
    </div>
</body>

</html>
`;
};

module.exports = contactoUsuarioTemplate;