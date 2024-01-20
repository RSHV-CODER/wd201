"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const db = {};

let sequelize;

try {
  if (config.use_env_variable) {
    if (!process.env[config.use_env_variable]) {
      throw new Error(`Environment variable ${config.use_env_variable} is not set.`);
    }

    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      config,
    );
  }
} catch (error) {
  console.error("Error during Sequelize initialization:", error);
  process.exit(1);
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    try {
      const model = require(path.join(__dirname, file))(
        sequelize,
        Sequelize.DataTypes,
      );
      db[model.name] = model;
    } catch (error) {
      console.error(`Error loading model from file "${file}":`, error);
    }
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
