const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('user', {
    id:{
      type: DataTypes.INTEGER,
      primaryKey:true,
      allowNull: false,
      autoIncrement: true,
      set(value) {
        this.setDataValue("id", `${value}db`)
      }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password:{
      type: DataTypes.STRING,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING
    }
  }, {timestamps: false})
};