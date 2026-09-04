import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { env } from "../config/env.js";

let dbInstance = null;
let connectionPromise = null;

export async function getDatabaseConnection() {
  if (dbInstance) {
    return dbInstance;
  }

  // Evita race condition: reutiliza a mesma Promise se multiplas requisicoes chegarem juntas
  if (!connectionPromise) {
    connectionPromise = (async () => {
      const db = await open({
        filename: env.databasePath || "./database.sqlite",
        driver: sqlite3.Database
      });

      // Ativar checagem de Chaves Estrangeiras (Regra 24)
      await db.run("PRAGMA foreign_keys = ON;");

      // Ativar modo WAL para evitar travamento de leitura durante escritas
      await db.run("PRAGMA journal_mode = WAL;");

      // Definir timeout de espera para evitar erros de banco ocupado
      await db.run("PRAGMA busy_timeout = 5000;");

      dbInstance = db;
      return dbInstance;
    })();
  }

  return connectionPromise;
}