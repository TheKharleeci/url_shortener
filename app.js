import validUrl from 'valid-url';
import express from 'express';
import UrlSchema from './schema';
import mongoose from 'mongoose';
import 'dotenv/config';

const app = express();

app.use(express.json());

const dbUrl = process.env.URLSHORTENER_DATABASE_URL

// mongodb connection
mongoose.connect( dbUrl, { 
    useUnifiedTopology: true, 
    useNewUrlParser: true, 
})
.then( async () => {
    console.log('Connected to mongodb');
})

// to generate a unique string
const generateUniqueId = () => Math.random().toString(32).substr(2, 8);

// checks if the url inputted is a valid url
const checkIfUrlIsValid = (req, res, next) => {
    const { url } = req.body;
    if (validUrl.isUri(url)) {
      next();
    } else {
      res.send(400);
    }
};

// checks if the url already exists
const checkIfUrlExists = async (req, res, next) => {
    const findOriginalUrl = await UrlSchema.findOne({original_url:req.body.url});
    if (findOriginalUrl) {
        return res.status(200).json({ shortUrl: findOriginalUrl.short_url });
    }
    next();
};

// shortens the url
const createShortUrl = async (req, res) => {
    try {
      const id = generateUniqueId();
      const shortUrl = `http://localhost:3000/${id}`;
      const newUrl = new UrlSchema({ original_url: req.body.url, short_url: shortUrl, generated_id: id });
      await newUrl.save();
      return res.status(201).json({
        shortUrl,
      });
    } catch (error) {
      console.log(error);
      res.status(500);
    }
};
// fetches the url from the db
const findUrl = async (req, res) => {
    const { urlId } = req.params;
    const returnedUrl = await UrlSchema.findOne({generated_id:urlId});
    return returnedUrl
      ? res.redirect(returnedUrl.original_url)
      : res.status(404);
};

app.post("/shorten", checkIfUrlIsValid, checkIfUrlExists, createShortUrl);
app.get("/:urlId", findUrl);

app.listen(3000, () => console.log(`Listening on port ${3000}`));
