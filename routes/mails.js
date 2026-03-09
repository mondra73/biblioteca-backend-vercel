const nodemailer = require("nodemailer");

async function enviarEmail(destinatario, asunto, cuerpo, esHTML = false) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "biblotecamultimedia@gmail.com",
        pass: "q a a h u e a w d c l i m w h k",
      },
    });

    const mailOptions = {
      from: "biblotecamultimedia@gmail.com",
      to: destinatario,
      subject: asunto,
    };

    if (esHTML) {
      mailOptions.html = cuerpo;
    } else {
      mailOptions.text = cuerpo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo electrónico enviado:", info.response);
    return {
      success: true,
      message: "Correo electrónico enviado correctamente.",
    };
  } catch (error) {
    console.error("Error al enviar el correo electrónico:", error);
    return {
      success: false,
      message: "Error al enviar el correo electrónico.",
    };
  }
}

module.exports = enviarEmail;