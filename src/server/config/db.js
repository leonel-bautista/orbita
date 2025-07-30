import mysql from "mysql2";

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_INSEC_AUTH } = process.env;

export const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: parseInt(DB_PORT) || 3306,
    insecureAuth: DB_INSEC_AUTH === 'true'
})

db.connect(error => {
    if (error){
        console.error("|❌| ERROR AL CONECTARSE A LA BASE DE DATOS")
        console.error(error);
        process.exit(1);
    }

    console.log("✅ Conectado a la base de datos!");
})