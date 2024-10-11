require('dotenv').config();

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const pg = require('pg');  // Add this line to import pg

const app = express();
const port = process.env.PORT || 3000;

// Initialize PostgreSQL client
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Disable SSL
});
client.connect();

app.use(express.urlencoded({ extended: true }));

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Home page
app.get("/", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM booksiread ORDER BY id ASC"); // Use the correct client instance
    const books = result.rows;

    res.render("index.ejs", {
      username: "Varshini Dandam",
      bookItems: books, // Use the fetched books from the database
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to render the form
app.get("/add", (req, res) => {
  res.render("add");
});

// Route to handle form submission
app.post("/add", async (req, res) => {
  const { book_name, author, book_description, recommendation, cover_img } = req.body;

  console.log(req.body); // Check if form data is coming through

  try {
    // Insert book details into the database
    await client.query(
      "INSERT INTO booksiread (book_name, author, book_description, recommendation, cover_img) VALUES ($1, $2, $3, $4, $5)",
      [book_name, author, book_description, recommendation, cover_img]
    );

    // Redirect to home page which will fetch the updated list of books
    res.redirect("/");
  } catch (err) {
    if (err.code === '23505') { // Catch duplicate key error
      console.error("Duplicate entry error: Book with this ID already exists.", err.detail);
      res.status(400).send("A book with this ID already exists. Please try again with a unique ID.");
    } else {
      console.error("Error in adding book:", err.code, err.detail); // Log detailed error for other issues
      res.status(500).send("Internal Server Error");
    }
  }
});

// Route to display the edit form for a specific book
app.get("/edit/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  
  try {
    const result = await client.query("SELECT * FROM booksiread WHERE id = $1", [bookId]);
    const book = result.rows[0];

    if (!book) {
      return res.status(404).send('Book not found.');
    }

    res.render("edit", { book });
  } catch (err) {
    console.error('Error fetching book for editing:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle book edit submission
app.post("/edit/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  const { book_name, author, book_description, recommendation, cover_img } = req.body;

  // Basic validation
  if (!book_name || !author || !book_description || !recommendation || !cover_img) {
    return res.status(400).send('All fields are required.');
  }

  const updateQuery = `
    UPDATE booksiread
    SET book_name = $1,
        author = $2,
        book_description = $3,
        recommendation = $4,
        cover_img = $5
    WHERE id = $6
  `;

  const values = [book_name, author, book_description, recommendation, cover_img, bookId];

  try {
    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).send('Book not found.');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Details Route
app.get('/details/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const result = await client.query("SELECT * FROM booksiread WHERE id = $1", [bookId]);
    const book = result.rows[0];

    if (!book) {
      return res.status(404).send('Book not found');
    }

    res.render('details', { book });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Route to show the delete confirmation page for a specific book
app.get("/delete/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  try {
    const result = await client.query("SELECT * FROM booksiread WHERE id = $1", [bookId]);
    const book = result.rows[0];

    if (!book) {
      return res.status(404).send('Book not found.');
    }

    res.render("delete", { book });
  } catch (err) {
    console.error('Error fetching book for deletion:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle the actual deletion of the book
app.post("/delete/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  // Validate the bookId
  if (isNaN(bookId)) {
    return res.status(400).send('Invalid Book ID');
  }

  try {
    const deleteQuery = 'DELETE FROM booksiread WHERE id = $1';
    const result = await client.query(deleteQuery, [bookId]);

    if (result.rowCount === 0) {
      return res.status(404).send('Book Not Found');
    }

    // Redirect back to the home page after successful deletion
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
