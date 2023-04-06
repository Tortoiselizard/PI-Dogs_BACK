const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('dog', {
    id:{
      type: DataTypes.STRING,
      primaryKey:true,
      allowNull: false,
      //autoIncrement: true,
      set(value) {
        this.setDataValue("id", `${value}db`)
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    height:{
      type: DataTypes.STRING,
      allowNull: false
    },
    weight: {
      type: DataTypes.STRING,
      allowNull: false
    },
    life_span:{
      type: DataTypes.STRING,
      // set(value) {
      //   this.setDataValue("life_span", value+" years")
      // }
    },
    image: {
      type: DataTypes.STRING
    }
  }, {timestamps: false})
};
