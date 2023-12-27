// Import the necessary modules for testing (e.g., Jest or another testing library)
// Ensure you have access to the 'todoList' function

test("Test to add a todo", () => {
  const todos = todoList();
  const initialTodoCount = todos.all.length;

  todos.add({ title: "New Task", dueDate: "2023-12-28", completed: false });

  expect(todos.all.length).toBe(initialTodoCount + 1);
  expect(todos.all[initialTodoCount].title).toBe("New Task");
});

test("Test to mark a todo as complete", () => {
  const todos = todoList();
  todos.add({ title: "Task to Complete", dueDate: "2023-12-28", completed: false });

  const initialCompletionStatus = todos.all[0].completed;
  todos.markAsComplete(0);

  expect(todos.all[0].completed).toBe(!initialCompletionStatus);
});

test("Test to retrieve overdue items", () => {
  const todos = todoList();
  todos.add({ title: "Overdue Task", dueDate: "2023-12-25", completed: false });

  const overdueItems = todos.overdue();

  expect(overdueItems.length).toBe(1);
  expect(overdueItems[0].title).toBe("Overdue Task");
});

test("Test to retrieve due today items", () => {
  const todos = todoList();
  todos.add({ title: "Due Today Task", dueDate: "2023-12-27", completed: false });

  const dueTodayItems = todos.dueToday();

  expect(dueTodayItems.length).toBe(1);
  expect(dueTodayItems[0].title).toBe("Due Today Task");
});

test("Test to retrieve due later items", () => {
  const todos = todoList();
  todos.add({ title: "Due Later Task", dueDate: "2023-12-29", completed: false });

  const dueLaterItems = todos.dueLater();

  expect(dueLaterItems.length).toBe(1);
  expect(dueLaterItems[0].title).toBe("Due Later Task");
});
