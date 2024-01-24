"use strict";
const { Model, Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({ title, dueDate, completed: false, userId });
    }

    static getTodos() {
      return this.findAll();
    }

    static async remove(id, userId) {
      return this.destroy({
        where: { id, userId },
      });
    }

    static async getFilteredTodos(userId, whereCondition) {
      const date = new Date();
      return this.findAll({
        where: {
          userId,
          completed: false,
          ...whereCondition,
        },
      });
    }

    static async OverdueTodos(userId) {
      return this.getFilteredTodos(userId, {
        dueDate: { [Op.lt]: new Date() },
      });
    }

    static async dueTodayTodos(userId) {
      return this.getFilteredTodos(userId, {
        dueDate: { [Op.eq]: new Date() },
      });
    }

    static async dueLaterTodos(userId) {
      return this.getFilteredTodos(userId, {
        dueDate: { [Op.gt]: new Date() },
      });
    }

    static async CompletedTodos(userId) {
      return this.getFilteredTodos(userId, {
        completed: true,
      });
    }

    setCompletionStatus(completed) {
      return this.update({ completed: !completed });
    }
  }

  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    },
  );

  return Todo;
};
