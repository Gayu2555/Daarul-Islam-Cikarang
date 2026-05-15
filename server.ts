import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending email reminder
  app.post("/api/send-reminder", async (req, res) => {
    const { to, studentName, amount, dueDate } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.VITE_SMTP_HOST || "smtp-relay.brevo.com",
      port: Number(process.env.VITE_SMTP_PORT) || 587,
      secure: false, // port 587 uses STARTTLS
      auth: {
        user: process.env.EMAIL_SERVICE_USER,
        pass: process.env.EMAIL_SERVICE_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SERVICE_USER,
      to,
      subject: `Tagihan SPP - ${studentName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Pengingat Pembayaran SPP</h2>
          <p>Halo Orang Tua/Wali dari <strong>${studentName}</strong>,</p>
          <p>Ini adalah pengingat bahwa pembayaran SPP untuk bulan ini sebesar <strong>Rp ${new Intl.NumberFormat("id-ID").format(amount)}</strong> akan jatuh tempo pada <strong>${dueDate}</strong>.</p>
          <p>Mohon segera lakukan pembayaran melalui kanal yang tersedia.</p>
          <p>Terima kasih atas perhatian Anda.</p>
          <br/>
          <p>Salam,</p>
          <p><strong>Tim Administrasi EduManage</strong></p>
        </div>
      `,
    };

    try {
      if (!process.env.EMAIL_SERVICE_USER || !process.env.EMAIL_SERVICE_PASS) {
        throw new Error("Email credentials not configured");
      }
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
