import session from "express-session";
import { env } from "./env.js";

export const sessionConfig = session({
  secret: env.sessionSecret,
  resave: true, // Forca a atualização do cookie de sessao a cada resposta
  saveUninitialized: false,
  cookie: {
    secure: env.nodeEnv === "production",
    httpOnly: true,
    sameSite: "lax", // Permite a navegacao e leitura de cookies no mesmo dominio/localhost
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
});