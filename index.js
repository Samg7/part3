const express = require('express');
const { use } = require('express/lib/application');
const req = require('express/lib/request');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// Enable cross-origin resource sharing middleware for frontend and backend
app.use(cors());

app.use(express.static('build'));

// Explicitly defines express.json() to be the first middleware in the req-res chain
app.use(express.json());

// Define token to be extracted from the request
// express.json() middleware has to run first to properly parse the body of the request
morgan.token('body', req => {
  return JSON.stringify(req.body);
});

// Log messages using Morgan's Tiny configuration
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

// Phonebook entries
let persons = [
  {
    "id": 1,
    "name": "Arto Hellas",
    "number": "040-123456"
  },
  {
    "id": 2,
    "name": "Ada Lovelace",
    "number": "39-44-5323523"
  },
  {
    "id": 3,
    "name": "Dan Abramov",
    "number": "12-43-234345"
  },
  {
    "id": 4,
    "name": "Mary Poppendieck",
    "number": "39-23-6423122"
  }
];

// --- Routes ---
// This HTTP GET is responsible for rendering the phonebook entries on start-up
app.get('/api/persons', (request, response) => {
  response.json(persons);
});

// HTTP GET for a single person resource
app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id); // Cast string id into a number

  // We're looking for a specific phone book entry
  const targetEntry = persons.find(entry => entry.id === id);

  if (targetEntry) {
    response.json(targetEntry);
  } else {
    response.statusMessage = `ID: ${id} is not a valid phone book entry`;
    response.status(404).end();
  }
});

// This HTTP DELETE is responsible for deleting a single phonebook entry
// Approach: filter every id that doesn't match the targetEntry
app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id);

  // We want to alter the phone book completely
  persons = persons.filter(entry => entry.id !== id);

  response.statusMessage = `Removed entry with ID: ${id}`;
  response.status(204).end();
});

app.get('/info', (request, response) => {
  const entries = persons.length;
  const date = new Date();
  const timestamp = date.toDateString().concat(' ', date.toTimeString());

  response.send(`
    <div>Phonebook has info for ${entries}</div>
    <div>${timestamp}</div>
  `);
});

// Generate new ID's for phone book entries
const generateId = (max) => {  
  return Math.floor(Math.random() * max);
};

app.post('/api/persons', (request, response) => {
  const body = request.body;

  // Validate request body contains necessary headers (bit redundant for now)
  if (!body.name) {
    return response.status(400).json({
      error: 'name is missing'
    });
  } else if (!body.number) {
    return response.status(400).json({
      error: 'number is missing'
    });
  }

  // ASSERTION: body.name and body.number exist
  // Validate body.name is unique
  const notAUniqueName = persons.find(entry => entry.name === String(body.name));
  if (notAUniqueName) {
    return response.status(400).json({
      error: 'name must be unique'
    });
  }

  // ASSERTION: body.name is unique
  const entry = {
    "id": generateId(1000),
    "name": body.name,
    "number": body.number,
  };

  persons = persons.concat(entry);

  response.json(entry);
});

// Server runs on localhost port 3001, and frontend code on localhost port 3000
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});