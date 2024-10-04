const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const pg = require("pg");

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "admin",
  port: 5432,
});
db.connect();

app.use(express.urlencoded({ extended: true }));

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const booksRead = [{
  id:1,
  book_name :"Think And Grow Rich",
  author : "Napoleon Hill",
  book_description : "Think and Grow Rich is a classic work on how to lead a successful life. It was written at the commission of Andrew Carnegie and is based on interviews with men such as Henry Ford, J.P. Morgan, and John D. Rockefeller, the business titans of the early 20th century. This all-time best-seller lays out the steps needed to unleash one's potential, focusing on building individual self-confidence and a clear set of goals. Each chapter addresses one of the author's principles to leading a meaningful and productive life. The author states that by focusing on a passionate desire, having faith in oneself, training the subconscious to believe in success, and developing a detailed plan, anyone can grow rich.",
  recommendation : "9 Out Of 10",
  cover_img: "book1.jpg",
  },
  {
    id: 2,
    book_name: "Rich Dad And Poor Dad",
    author: "Robert Kiyosaki",
    book_description: "Rich Dad, Poor Dad by Robert T. Kiyosaki is one of the most important books on personal finance that introduced a new perspective on wealth management. The author explains key concepts of financial management by comparing and contrasting the financial philosophies of his two dads—the rich dad and the poor dad. His poor dad was a highly educated, salaried man who believed in hard work, job security, and formal college education. His rich dad was an entrepreneur who didn’t believe in formal education—he believed in financial literacy. He had a different view on financial management than his poor dad. He believed that the only way to build wealth is to run a business and invest in assets that generate passive income streams.",
    recommendation: "10 Out Of 10",
    cover_img: "book2.jpg",
  },
  {
    id: 3,
    book_name : "Rework",
    author: "Jason Fried",
    book_description: "ReWork by Jason Fried and David Heinemeier Hansson is a business book that offers unconventional and practical advice for starting and running a successful business. It encourages readers to question traditional workplace practices and focus on simplicity, efficiency and genuine customer service.",
    recommendation : "10 Out Of 10",
    cover_img : "book3.jpg",
  },
  {
    id:4,
    book_name : "The Power Of Subcouncious Mind ",
    author: "Joseph Murphy",
    book_description: "The Power of Your Subconscious Mind' by Joseph Murphy is a self-help book that explores the potential and influence the subconscious mind can have on our lives. It offers techniques to harness the power of your subconscious mind for personal growth and success.",
    recommendation : "10 Out Of 10",
    cover_img : "book4.jpg",
  },
  {
    id: 5,
    book_name : "My Possessive Billionaire",
    author: "Laura Olsen",
    book_description: "The man who has everything has finally met his match! Enrique Monteiro, powerful Brazilian billionaire, got everything he wanted in life. He had the looks, wealth, power and women. He often traveled in his private jet to negotiate business deals, all over the globe. His godly looks and reserved attitude made women chase after him. He had everything he wanted in just a snap of his fingers… Everything, except a woman named Sophia Castello.",
    recommendation : "10 Out Of 10",
    cover_img : "book5.jpg",
  },
  ];

// Home page
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM booksiread ORDER BY id ASC");
    const books = result.rows; // Make sure to use `books` instead of `booksRead`

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
    await db.query(
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



// edit
// Route to display the edit form for a specific book
app.get("/edit/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  
  try {
    const result = await db.query("SELECT * FROM booksiread WHERE id = $1", [bookId]);
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
    const result = await db.query(updateQuery, values);

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
app.get('/details/:id', (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const book = booksRead.find((b) => b.id === bookId);

    if (book) {
      res.render('details', { book });
    } else {
      res.status(404).send('Book not found');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});


// Route to show the delete confirmation page for a specific book
app.get("/delete/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  try {
    const result = await db.query("SELECT * FROM booksiread WHERE id = $1", [bookId]);
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
    const result = await db.query(deleteQuery, [bookId]);

    if (result.rowCount === 0) {
      // No book found with the given ID
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