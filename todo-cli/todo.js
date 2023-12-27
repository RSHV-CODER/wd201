/* eslint-disable no-undef */
const todoList = () => {
  const all = [];

  const add = (todoItem) => {
    all.push(todoItem);
  };

  const markAsComplete = (index) => {
    if (all[index]) {
      all[index].completed = true;
    }
  };

  const overdue = () => {
    const over = all.filter((item) => {
      const dueDate = new Date(item.dueDate);
      return dueDate.getDate() === todayDate - 1;
    });
    return over;
  };

  const dueToday = () => {
    const due = all.filter((item) => {
      const dueDate = new Date(item.dueDate);
      return dueDate.getDate() === todayDate;
    });
    return due;
  };

  const dueLater = () => {
    const later = all.filter((item) => {
      const dueDate = new Date(item.dueDate);
      return dueDate.getDate() === todayDate + 1;
    });
    return later;
  };

  const toDisplayableList = (list) => {
    const output = list.map((item) => {
      const date = new Date(item.dueDate);
      const fd = date.toISOString().split("T")[0];
      const status = item.completed ? "[x]" : "[ ]";
      return ${status} ${item.title} ${fd};
    });
    return output.join("\n");
  };

  const today = new Date();
  const todayDate = today.getDate();

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

module.exports = todoList;

const todos = todoList();

const formattedDate = (d) => d.toISOString().split("T")[0];

const dateToday = new Date();
const today = formattedDate(dateToday);
const yesterday = formattedDate(new Date(dateToday.setDate(dateToday.getDate() - 1)));
const tomorrow = formattedDate(new Date(dateToday.setDate(dateToday.getDate() + 1)));

todos.add({ title: "Submit assignment", dueDate: yesterday, completed: false });
todos.add({ title: "Pay rent", dueDate: today, completed: true });
todos.add({ title: "Service Vehicle", dueDate: today, completed: false });
todos.add({ title: "File taxes", dueDate: tomorrow, completed: false });
todos.add({ title: "Pay electric bill", dueDate: tomorrow, completed: false });

console.log("My Todo-list\n");

console.log("Overdue");
const overdues = todos.overdue();
const formattedOverdues = todos.toDisplayableList(overdues);
console.log(formattedOverdues);
console.log("\n");

console.log("Due Today");
const itemsDueToday = todos.dueToday();
const formattedItemsDueToday = todos.toDisplayableList(itemsDueToday);
console.log(formattedItemsDueToday);
console.log("\n");

console.log("Due Later");
const itemsDueLater = todos.dueLater();
const formattedItemsDueLater = todos.toDisplayableList(itemsDueLater);
console.log(formattedItemsDueLater);
console.log("\n\n");
