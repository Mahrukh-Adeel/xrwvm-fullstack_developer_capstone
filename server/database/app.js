const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors'); // Fixed: Added semicolon
const app = express();
const port = 3030; // Fixed: Added semicolon

app.use(cors());
app.use(express.json()); // Fixed: Added semicolon and simplified
app.use(require('body-parser').urlencoded({ extended: false }));

const reviews_data = JSON.parse(fs.readFileSync("reviews.json", 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync("dealerships.json", 'utf8'));

mongoose.connect("mongodb://mongo_db:27017/",{'dbName':'dealershipsDB'});

const Reviews = require('./review');
const Dealerships = require('./dealership');

try {
    Reviews.deleteMany({}).then(()=>{
        Reviews.insertMany(reviews_data.reviews); // Fixed: Changed ['reviews'] to .reviews
    });
    Dealerships.deleteMany({}).then(()=>{
        Dealerships.insertMany(dealerships_data.dealerships); // Fixed: Changed ['dealerships'] to .dealerships
    });
} catch (error) {
    console.error('Error during initial data setup:', error);
}

// Express route to home
app.get('/', async (req, res) => {
    res.send("Welcome to the Mongoose API"); // Fixed: Added semicolon
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
    try {
        const documents = await Reviews.find();
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
    try {
        const documents = await Reviews.find({dealership: req.params.id});
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

app.get('/fetchDealers', async (req, res) => {
    try {
        const documents = await Dealerships.find();
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
    try {
        const documents = await Dealerships.find({state: req.params.state});
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
    try {
        const documents = await Dealerships.find({id: req.params.id});
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

//Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
    try {
        const data = JSON.parse(req.body); // Fixed: Added semicolon and const
        const documents = await Reviews.find().sort( { id: -1 } );
        let new_id = documents[0].id + 1; // Fixed: Changed ['id'] to .id and added semicolon
        
        const review = new Reviews({
            "id": new_id,
            "name": data.name, // Fixed: Changed ['name'] to .name
            "dealership": data.dealership, // Fixed: Changed ['dealership'] to .dealership
            "review": data.review, // Fixed: Changed ['review'] to .review
            "purchase": data.purchase, // Fixed: Changed ['purchase'] to .purchase
            "purchase_date": data.purchase_date, // Fixed: Changed ['purchase_date'] to .purchase_date
            "car_make": data.car_make, // Fixed: Changed ['car_make'] to .car_make
            "car_model": data.car_model, // Fixed: Changed ['car_model'] to .car_model
            "car_year": data.car_year, // Fixed: Changed ['car_year'] to .car_year
        });
        
        const savedReview = await review.save();
        res.json(savedReview);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error inserting review' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});