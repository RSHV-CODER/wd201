const todoList = () => {
  const all = [];

  const add = (todoItem) => {
    all.push(todoItem);
  };

  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const fDate = () => new Date().toLocaleDateString("en-CA");

  const overdue = () => {
    return all.filter((item) => item.dueDate < fDate());
  };

  const dueToday = () => {
    return all.filter((item) => item.dueDate === fDate());
  };

  const dueLater = () => {
    return all.filter((item) => item.dueDate > fDate());
  };

  const toDisplayableList = (list) => {
    const output = list.map((item) => {
      const status = item.completed ? "[x]" : "[ ]";
      const dateFormatted = item.dueDate ? ` ${new Date(item.dueDate).toLocaleDateString("en-CA")}` : "";
      return ${status} ${item.title}${dateFormatted};
    });
    return output.join("\n");
  };

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
