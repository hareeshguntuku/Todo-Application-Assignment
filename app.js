const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let format = require("date-fns/format");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

//API 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  if (requestQuery.status !== undefined) {
    return true;
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

const hasCategoryProperty = (requestQuery) => {
  if (requestQuery.category !== undefined) {
    return true;
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
      id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE
      todo LIKE '%${search_q}%'
      AND status = '${status}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
      id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE
      todo LIKE '%${search_q}%'
      AND priority = '${priority}';`;
      break;
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
      SELECT
      id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE
      todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';`;
      break;

    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
      id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE
      todo LIKE '%${search_q}%'
      AND category = '${category}' AND status = '${status}';`;
      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
      id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE
      todo LIKE '%${search_q}%'
      AND category = '${category}';`;
      break;

    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
      SELECT
      id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE
      todo LIKE '%${search_q}%'
      AND category = '${category}' AND priority = '${priority}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
      id,todo,priority,status,category, due_date AS dueDate FROM todo WHERE
      todo LIKE '%${search_q}%';`;
      break;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT
      id,todo,priority,status,category, due_date AS dueDate
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todoItem = await db.get(getTodoQuery);
  response.send(todoItem);
});

//API 3

app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 12, 12), "yyyy-MM-dd");
  const getTodoQuery = `SELECT
      id,todo,priority,status,category, due_date AS dueDate
    FROM
      todo
    WHERE
      due_date = '${date}';`;
  const todoItem = await db.get(getTodoQuery);
  response.send(todoItem);
});

//API 4

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const addTodoQuery = `INSERT INTO
      todo (id,todo,priority,status, category, due_date)
    VALUES
      (
         ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
      );`;

  const dbResponse = await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5

const isTodo = (result) => {
  if (result !== undefined) {
    return true;
  } else {
    response.status(400);
    response.send("Invalid Todo");
  }
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  let updateTodoQuery = "";
  const { status, priority, todo, category, dueDate } = todoDetails;

  switch (true) {
    case hasStatusProperty(status):
      updateTodoQuery = `UPDATE
      todo
      SET
      status='${status}'
      WHERE
      id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;

    case hasPriorityProperty(priority):
      updateTodoQuery = `UPDATE
      todo
      SET
      priority='${priority}'
      WHERE
      id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case isTodo(todo):
      updateTodoQuery = `UPDATE
      todo
      SET
      todo='${todo}'
      WHERE
      id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case hasCategoryProperty(category):
      updateTodoQuery = `UPDATE
      todo
      SET
      category='${category}'
      WHERE
      id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
      break;
    case validateDate(dueDate):
      updateTodoQuery = `UPDATE
      todo
      SET
      due_date='${dueDate}'
      WHERE
      id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
      break;

    default:
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM 
      todo 
    WHERE
      id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

initializeDBAndServer();
